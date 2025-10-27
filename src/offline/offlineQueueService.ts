// frontend/src/offline/offlineQueueService.ts

/*
heart of the offline queue. It lazily initialises the store,
enqueues jobs, notifies subscribers on changes, and flushes the queue with exponential backoff,
respecting per-job retry delays and max-attempt limits. It also exports a singleton for convenience
plus the executor type alias.
*/

import {
  FlushResult,
  OfflineJob,
  OfflineQueueOptions,
  OfflineQueueSnapshot,
  OfflineRequestConfig,
} from './offlineJob.types';
import { OfflineJobStore, OfflineJobStoreFactory } from './storage/persistentStore';
import { createDefaultOfflineJobStore } from './storage/indexedDbStore';

// Listener signature for queue updates; receives a full snapshot
type QueueListener<TBody = any, TMeta = Record<string, unknown>> =
  (snapshot: OfflineQueueSnapshot<TBody, TMeta>) => void;

// Executor runs a single job (e.g., performs the HTTP request). Throws to signal failure.
export type OfflineJobExecutor<TBody = any, TMeta = Record<string, unknown>> =
  (job: OfflineJob<TBody, TMeta>) => Promise<void>;

// Sensible defaults; can be overridden via deps.options
const DEFAULT_OPTIONS: Required<OfflineQueueOptions> = {
  maxAttempts: 5,
  retryDelayMs: 1_000,
};

// Stable ID generator with crypto fallback
function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export interface OfflineQueueDependencies<TBody = any, TMeta = Record<string, unknown>> {
  storeFactory?: OfflineJobStoreFactory<TBody, TMeta>; // Allows swapping storage backend
  options?: OfflineQueueOptions;                        // Overrides for retries/backoff
}

/**
 * Persistent offline queue that:
 * - lazily creates its store (IndexedDB by default)
 * - enqueues/removes/clears jobs
 * - notifies subscribers with snapshots
 * - flushes jobs in FIFO order with exponential backoff & per-job retryAfter
 */
export class OfflineQueueService<TBody = any, TMeta = Record<string, unknown>> {
  private storePromise?: Promise<OfflineJobStore<TBody, TMeta>>;          // Lazy-initialized store
  private readonly storeFactory: OfflineJobStoreFactory<TBody, TMeta>;
  private readonly options: Required<OfflineQueueOptions>;
  private readonly listeners = new Set<QueueListener<TBody, TMeta>>();    // Snapshot subscribers
  private isFlushing = false;                                             // Concurrency guard

  constructor(deps: OfflineQueueDependencies<TBody, TMeta> = {}) {
    this.storeFactory = deps.storeFactory ?? createDefaultOfflineJobStore;
    this.options = { ...DEFAULT_OPTIONS, ...(deps.options ?? {}) };
  }

  // Ensure single store instance; initialize on first use
  private getStore(): Promise<OfflineJobStore<TBody, TMeta>> {
    if (!this.storePromise) {
      this.storePromise = this.storeFactory();
    }
    return this.storePromise;
  }

  // Add a job to the queue and notify listeners
  async enqueue(
    request: OfflineRequestConfig<TBody>,
    metadata?: TMeta
  ): Promise<OfflineJob<TBody, TMeta>> {
    const job: OfflineJob<TBody, TMeta> = {
      id: createId(),
      createdAt: Date.now(),
      request,
      metadata,
      attemptCount: 0,
    };

    const store = await this.getStore();
    await store.put(job);
    await this.emitChange();
    return job;
  }

  // Return jobs sorted old→new for stable FIFO semantics
  async getJobs(): Promise<OfflineJob<TBody, TMeta>[]> {
    const store = await this.getStore();
    const jobs = await store.getAll();
    return jobs.sort((a, b) => a.createdAt - b.createdAt);
  }

  // Remove a job by id (and notify)
  async remove(id: string): Promise<void> {
    const store = await this.getStore();
    await store.delete(id);
    await this.emitChange();
  }

  // Clear all jobs (and notify)
  async clear(): Promise<void> {
    const store = await this.getStore();
    await store.clear();
    await this.emitChange();
  }

  // Snapshot current queue state
  async snapshot(): Promise<OfflineQueueSnapshot<TBody, TMeta>> {
    const jobs = await this.getJobs();
    return { jobs };
  }

  /**
   * Attempt to flush queued jobs by feeding each entry to the provided executor.
   *
   * - Executes in FIFO order.
   * - Respects per-job retryAfter (skips ahead and records nextRetryAt).
   * - On failure: increments attemptCount, applies exponential backoff, and re-persists the job (unless maxAttempts is reached).
   * - Notifies subscribers if any job completes or fails (i.e., queue mutates).
   * - Concurrency-safe: parallel calls while flushing are no-ops.
   */
  async flush(executor: OfflineJobExecutor<TBody, TMeta>): Promise<FlushResult> {
    if (this.isFlushing) {
      return { completed: 0, failed: 0 };
    }
    this.isFlushing = true;

    try {
      const store = await this.getStore();
      const jobs = await store.getAll();
      const orderedJobs = jobs.sort((a, b) => a.createdAt - b.createdAt);

      let completed = 0;
      let failed = 0;
      let nextRetryAt: number | undefined;
      const now = Date.now();

      for (const job of orderedJobs) {
        // Respect scheduled retry time
        if (job.retryAfter && job.retryAfter > now) {
          nextRetryAt = Math.min(nextRetryAt ?? job.retryAfter, job.retryAfter);
          continue;
        }

        try {
          await executor(job);        // Let the executor throw on failure
          await store.delete(job.id); // Success: remove job
          completed += 1;
        } catch (error) {
          failed += 1;
          const attempts = job.attemptCount + 1;
          job.attemptCount = attempts;
          job.lastAttemptAt = Date.now();

          // Drop permanently after max attempts
          if (attempts >= this.options.maxAttempts) {
            await store.delete(job.id);
            continue;
          }

          // Schedule next retry using exponential backoff
          const delay = this.computeBackoffDelay(attempts);
          job.retryAfter = job.lastAttemptAt + delay;
          nextRetryAt = Math.min(nextRetryAt ?? job.retryAfter, job.retryAfter);
          await store.put(job);
        }
      }

      // Notify only if queue state actually changed
      if (completed || failed) {
        await this.emitChange();
      }

      return { completed, failed, nextRetryAt };
    } finally {
      this.isFlushing = false;
    }
  }

  // Subscribe to snapshot updates; immediately push the current snapshot
  subscribe(listener: QueueListener<TBody, TMeta>): () => void {
    this.listeners.add(listener);
    void this.snapshot().then((snapshot) => listener(snapshot));
    return () => {
      this.listeners.delete(listener);
    };
  }

  // Emit the latest snapshot to all listeners
  private async emitChange(): Promise<void> {
    if (!this.listeners.size) return;
    const snapshot = await this.snapshot();
    this.listeners.forEach((listener) => {
      try {
        listener(snapshot);
      } catch (error) {
        console.error('OfflineQueueService listener threw an error', error);
      }
    });
  }

  // Exponential backoff based on attempt number (1 => 1x, 2 => 2x, 3 => 4x, ...)
  private computeBackoffDelay(attempts: number): number {
    const exponential = Math.pow(2, attempts - 1);
    return this.options.retryDelayMs * exponential;
  }
}

/**
 * Helper factory for places where dependency injection is unnecessary.
 * Useful for quick usage, tests, or small apps.
 */
export const offlineQueue = new OfflineQueueService();
