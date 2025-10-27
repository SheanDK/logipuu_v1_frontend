// frontend/src/offline/storage/persistentStore.ts

import { OfflineJob } from '../offlineJob.types';

/**
 * OfflineJobStore
 * ----------------
 * Abstraction over the persistence layer used by the offline queue.
 * Implementations can back this with IndexedDB, in-memory storage, or any
 * other database. All methods are Promise-based to keep the API uniform
 * across async storage engines.
 *
 * TBody - the type of the request body stored with each job
 * TMeta - the type of any additional metadata stored with each job
 */
export interface OfflineJobStore<TBody = any, TMeta = Record<string, unknown>> {
    /**
     * Return all persisted jobs in the store.
     */
    getAll(): Promise<OfflineJob<TBody, TMeta>[]>;

    /**
     * Look up a job by its ID.
     * @param id Unique job identifier
     */
    get(id: string): Promise<OfflineJob<TBody, TMeta> | undefined>;

    /**
     * Insert or update a single job.
     * Implementations should treat this as an UPSERT.
     * @param job The job to persist
     */
    put(job: OfflineJob<TBody, TMeta>): Promise<void>;

    /**
     * Insert or update multiple jobs in one operation/transaction when possible.
     * @param jobs The jobs to persist
     */
    bulkPut(jobs: OfflineJob<TBody, TMeta>[]): Promise<void>;

    /**
     * Remove a job by ID.
     * @param id Unique job identifier
     */
    delete(id: string): Promise<void>;

    /**
     * Remove all jobs from the store.
     */
    clear(): Promise<void>;
}

/**
 * OfflineJobStoreFactory
 * ----------------------
 * Factory signature used by the queue service to lazily initialize a concrete
 * store implementation. Returning a Promise allows the factory to perform any
 * async bootstrapping (e.g., opening IndexedDB, migrating schemas) before
 * handing back a ready-to-use store instance.
 */
export type OfflineJobStoreFactory<TBody = any, TMeta = Record<string, unknown>> = () => Promise<
    OfflineJobStore<TBody, TMeta>
>;
