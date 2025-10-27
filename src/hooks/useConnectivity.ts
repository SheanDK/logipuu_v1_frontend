'use client';

/**
 * Connectivity hook:
 * Exposes online/offline status and a snapshot of the offline job queue,
 * plus helpers to enqueue/flush jobs and set a custom executor.
 *
 * Works with the app’s OfflineQueueService to allow requests to be queued
 * while offline and flushed once connectivity returns.
 */

import { useConnectivityContext } from '../contexts/ConnectivityContext';
import { OfflineJobExecutor, OfflineQueueService } from '../offline/offlineQueueService';
import { FlushResult, OfflineQueueSnapshot } from '../offline/offlineJob.types';

/**
 * Shape of the connectivity state returned by the hook.
 *
 * @template TBody - Request body type for queued jobs (defaults to any)
 * @template TMeta - Metadata stored per job (defaults to a generic record)
 */

export interface ConnectivityState<
    TBody = any,
    TMeta extends Record<string, unknown> = Record<string, unknown>
> {
    isOnline: boolean; // Current online status. true = online, false = offline.
    lastStatusChange: number | null; // Epoch milliseconds of the last online/offline transition, or null if unknown.
    queueSnapshot: OfflineQueueSnapshot<TBody, TMeta>; // Contains the current job list and queue metadata at the time of read.
    queue: OfflineQueueService<TBody, TMeta>; // Use this to add jobs that will be flushed when connectivity is available.
    flushQueue: (
        executorOverride?: OfflineJobExecutor<TBody, TMeta>
    ) => Promise<FlushResult | undefined>; // Pass undefined to remove a custom executor and fall back to the default one.
    setExecutor: (executor: OfflineJobExecutor<TBody, TMeta> | undefined) => void; // Pass undefined to remove a custom executor and fall back to the default one.
}

/**
 * useConnectivity:
 * Hook that bridges the ConnectivityContext to consumers.
 * Provides online status + offline queue primitives so features can
 * degrade gracefully when offline (queue now, sync later).
 */

export function useConnectivity<
    TBody = any,
    TMeta extends Record<string, unknown> = Record<string, unknown>
>(): ConnectivityState<TBody, TMeta> {

    // Pull state and actions from the nearest ConnectivityContext provider.
    const { isOnline, lastStatusChange, queueSnapshot, queue, flushQueue, setExecutor } =
        useConnectivityContext<TBody, TMeta>();

    // Expose a stable, typed API for consumers.
    return { isOnline, lastStatusChange, queueSnapshot, queue, flushQueue, setExecutor };
}
