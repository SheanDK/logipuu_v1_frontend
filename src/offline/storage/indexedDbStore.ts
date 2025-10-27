// frontend/src/offline/storage/indexedDbStore.ts

import { OfflineJob } from '../offlineJob.types';
import { OfflineJobStore } from './persistentStore';

// IndexedDB configuration
const DB_NAME = 'offlineQueue';
const STORE_NAME = 'jobs';
const DB_VERSION = 1;

/**
 * IndexedDbJobStore
 * ------------------
 * A browser-only implementation of OfflineJobStore that persists jobs
 * in IndexedDB. It lazily opens the database once and reuses the same
 * connection via a Promise to avoid race conditions.
 */
class IndexedDbJobStore<TBody = any, TMeta = Record<string, unknown>> implements OfflineJobStore<TBody, TMeta> {
    // Promise that resolves to an open IDBDatabase; shared by all operations
    private dbPromise: Promise<IDBDatabase>;

    constructor() {
        this.dbPromise = this.openDatabase();
    }

    /**
     * Open (or create) the IndexedDB database, and ensure the object store exists.
     * This runs the upgrade path when DB_VERSION increases.
     */
    private openDatabase(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            // Create schema on first open or when DB_VERSION increases
            request.onupgradeneeded = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    // Use 'id' from OfflineJob as the primary key
                    db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                }
            };

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Read all jobs from the object store.
     */
    async getAll(): Promise<OfflineJob<TBody, TMeta>[]> {
        const db = await this.dbPromise;
        return new Promise<OfflineJob<TBody, TMeta>[]>((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result as OfflineJob<TBody, TMeta>[]);
            request.onerror = () => reject(request.error);
            tx.onerror = () => reject(tx.error);
        });
    }

    /**
     * Read a single job by id.
     */
    async get(id: string): Promise<OfflineJob<TBody, TMeta> | undefined> {
        const db = await this.dbPromise;
        return new Promise<OfflineJob<TBody, TMeta> | undefined>((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result as OfflineJob<TBody, TMeta> | undefined);
            request.onerror = () => reject(request.error);
            tx.onerror = () => reject(tx.error);
        });
    }

    /**
     * Upsert a single job.
     */
    async put(job: OfflineJob<TBody, TMeta>): Promise<void> {
        const db = await this.dbPromise;
        return new Promise<void>((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);

            store.put(job);

            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
            tx.onabort = () => reject(tx.error);
        });
    }

    /**
     * Upsert multiple jobs in a single transaction.
     */
    async bulkPut(jobs: OfflineJob<TBody, TMeta>[]): Promise<void> {
        if (!jobs.length) return;

        const db = await this.dbPromise;
        return new Promise<void>((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);

            jobs.forEach((job) => store.put(job));

            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
            tx.onabort = () => reject(tx.error);
        });
    }

    /**
     * Delete a job by id.
     */
    async delete(id: string): Promise<void> {
        const db = await this.dbPromise;
        return new Promise<void>((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);

            store.delete(id);

            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
            tx.onabort = () => reject(tx.error);
        });
    }

    /**
     * Clear all jobs from the store.
     */
    async clear(): Promise<void> {
        const db = await this.dbPromise;
        return new Promise<void>((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);

            store.clear();

            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
            tx.onabort = () => reject(tx.error);
        });
    }
}

/**
 * MemoryJobStore
 * ---------------
 * An in-memory fallback implementation used when IndexedDB is not available
 * (e.g., during SSR or on very old/locked-down browsers).
 * Data is ephemeral and will be lost on reload.
 */
class MemoryJobStore<TBody = any, TMeta = Record<string, unknown>> implements OfflineJobStore<TBody, TMeta> {
    private store = new Map<string, OfflineJob<TBody, TMeta>>();

    async getAll(): Promise<OfflineJob<TBody, TMeta>[]> {
        return Array.from(this.store.values());
    }

    async get(id: string): Promise<OfflineJob<TBody, TMeta> | undefined> {
        return this.store.get(id);
    }

    async put(job: OfflineJob<TBody, TMeta>): Promise<void> {
        this.store.set(job.id, job);
    }

    async bulkPut(jobs: OfflineJob<TBody, TMeta>[]): Promise<void> {
        jobs.forEach((job) => this.store.set(job.id, job));
    }

    async delete(id: string): Promise<void> {
        this.store.delete(id);
    }

    async clear(): Promise<void> {
        this.store.clear();
    }
}

/**
 * Factory: choose the best available persistent store for the current environment.
 * - If running in a browser with IndexedDB support, use IndexedDbJobStore.
 * - Otherwise (SSR/Node/unsupported), fall back to MemoryJobStore.
 */
export async function createDefaultOfflineJobStore<TBody = any, TMeta = Record<string, unknown>>(): Promise<
    OfflineJobStore<TBody, TMeta>
> {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
        return new MemoryJobStore<TBody, TMeta>();
    }

    return new IndexedDbJobStore<TBody, TMeta>();
}
