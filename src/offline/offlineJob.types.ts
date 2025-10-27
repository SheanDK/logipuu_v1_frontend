// frontend/src/offline/offlineJob.types.ts
/**
* defines the shared TypeScript types for offline jobs: the HTTP method enum, 
* a serialisable request payload, queue entry metadata (id, timestamps, retry info) and configuration objects. 
* This keeps queue/service code strongly typed and portable.
 */

export type OfflineHttpMethod = 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * Minimal subset of Axios/fetch request config we need to replay a request later.
 */
export interface OfflineRequestConfig<TBody = any> {
    url: string;
    method: OfflineHttpMethod;
    body?: TBody;
    headers?: Record<string, string>;
    /**
     * Optional query string params kept separate so they can be serialized safely.
     */
    params?: Record<string, string | number | boolean | null | undefined>;
}

/**
 * Metadata describing an enqueued job. The generic type allows callers to attach
 * custom metadata required to update UI optimistically.
 */
export interface OfflineJob<TBody = any, TMeta = Record<string, unknown>> {
    id: string;
    createdAt: number;
    request: OfflineRequestConfig<TBody>;
    metadata?: TMeta;
    lastAttemptAt?: number;
    attemptCount: number;
    /**
     * When set, the job is temporarily blocked from retrying until this timestamp.
     */
    retryAfter?: number;
}

export interface OfflineQueueSnapshot<TBody = any, TMeta = Record<string, unknown>> {
    jobs: OfflineJob<TBody, TMeta>[];
}

export interface OfflineQueueOptions {
    /**
     * Maximum number of delivery attempts before we give up and mark the job as failed.
     * Defaults to 5.
     */
    maxAttempts?: number;
    /**
     * Optional base delay (ms) used when computing exponential backoff for retries.
     * Defaults to 1_000 ms.
     */
    retryDelayMs?: number;
}

/**
 * Simple response container returned after a flush operation.
 */
export interface FlushResult {
    completed: number;
    failed: number;
    nextRetryAt?: number;
}
