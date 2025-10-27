// frontend/src/contexts/ConnectivityContext.tsx

/* 
Wraps the queue in a React context. It tracks navigator.onLine,
subscribes to queue snapshots, auto-flushes on reconnect when an executor is present, and exposes
helper functions through useConnectivityContext. It re-exports the executor factories for convenience.
*/

'use client';

import React, {
  PropsWithChildren,
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  FlushResult,
  OfflineQueueSnapshot,
} from '../offline/offlineJob.types';
import {
  OfflineJobExecutor,
  OfflineQueueDependencies,
  OfflineQueueService,
} from '../offline/offlineQueueService';

interface ConnectivityProviderProps<
  TBody = any,
  TMeta extends Record<string, unknown> = Record<string, unknown>
> extends PropsWithChildren {
  queueDependencies?: OfflineQueueDependencies<TBody, TMeta>;
  /**
   * Optional executor used to replay queued jobs. Can be overridden later via context.
   */
  executor?: OfflineJobExecutor<TBody, TMeta>;
  /**
   * Automatically call flush when the app transitions back online and an executor is available.
   * Defaults to true.
   */
  autoFlushOnReconnect?: boolean;
}

interface ConnectivityContextValue<
  TBody = any,
  TMeta extends Record<string, unknown> = Record<string, unknown>
> {
  isOnline: boolean;                                   // Current browser online/offline flag
  lastStatusChange: number | null;                     // Timestamp of the last online/offline change
  queueSnapshot: OfflineQueueSnapshot<TBody, TMeta>;   // Observable snapshot of queued jobs
  queue: OfflineQueueService<TBody, TMeta>;            // Underlying queue service (imperative API)
  flushQueue: (
    executorOverride?: OfflineJobExecutor<TBody, TMeta>
  ) => Promise<FlushResult | undefined>;               // Flush helper (uses override or current executor)
  setExecutor: (executor: OfflineJobExecutor<TBody, TMeta> | undefined) => void; // Update executor reference
}

// Internal context (generic-friendly); exposed via the hook below
const ConnectivityContext =
  createContext<ConnectivityContextValue<any, Record<string, unknown>> | null>(null);

export function ConnectivityProvider<
  TBody = any,
  TMeta extends Record<string, unknown> = Record<string, unknown>
>({
  children,
  queueDependencies,
  executor,
  autoFlushOnReconnect = true,
}: ConnectivityProviderProps<TBody, TMeta>) {
  // Initialize online status (SSR-safe: default true when navigator is undefined)
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (typeof navigator === 'undefined') return true;
    return navigator.onLine;
  });
  const [lastStatusChange, setLastStatusChange] = useState<number | null>(null);
  const [queueSnapshot, setQueueSnapshot] =
    useState<OfflineQueueSnapshot<TBody, TMeta>>({ jobs: [] });

  // Lazily create a single queue instance per provider mount
  const queueRef = useRef<OfflineQueueService<TBody, TMeta> | null>(null);
  if (!queueRef.current) {
    queueRef.current = new OfflineQueueService(queueDependencies);
  }

  // Keep the active executor in a ref so consumers can flush without re-renders
  const executorRef = useRef<OfflineJobExecutor<TBody, TMeta> | undefined>(executor);
  useEffect(() => {
    executorRef.current = executor;
  }, [executor]);

  // Subscribe to queue snapshots once; update local state when queue changes
  useEffect(() => {
    const queue = queueRef.current!;
    const unsubscribe = queue.subscribe((snapshot) => setQueueSnapshot(snapshot));
    return unsubscribe;
  }, []);

  // Listen to browser online/offline events and optionally auto-flush
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handleOnline = () => {
      setIsOnline(true);
      setLastStatusChange(Date.now());
      if (autoFlushOnReconnect && executorRef.current) {
        void queueRef.current!.flush(executorRef.current);
      }
    };
    const handleOffline = () => {
      setIsOnline(false);
      setLastStatusChange(Date.now());
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [autoFlushOnReconnect]);

  // Public helper to flush the queue with either an override or the current executor
  const flushQueue = useCallback(
    async (
      executorOverride?: OfflineJobExecutor<TBody, TMeta>
    ): Promise<FlushResult | undefined> => {
      const activeExecutor = executorOverride ?? executorRef.current;
      if (!activeExecutor) return undefined;
      return queueRef.current!.flush(activeExecutor);
    },
    []
  );

  // Allow consumers to swap the executor (e.g., when auth tokens rotate)
  const setExecutor = useCallback(
    (nextExecutor: OfflineJobExecutor<TBody, TMeta> | undefined) => {
      executorRef.current = nextExecutor;
    },
    []
  );

  // Stable context value; queue instance identity comes from the ref
  const value = useMemo<ConnectivityContextValue<TBody, TMeta>>(
    () => ({
      isOnline,
      lastStatusChange,
      queueSnapshot,
      queue: queueRef.current!,
      flushQueue,
      setExecutor,
    }),
    [flushQueue, isOnline, lastStatusChange, queueSnapshot, setExecutor]
  );

  return (
    <ConnectivityContext.Provider
      value={
        value as unknown as ConnectivityContextValue<any, Record<string, unknown>>
      }
    >
      {children}
    </ConnectivityContext.Provider>
  );
}

// Typed consumer hook with invariant check
export function useConnectivityContext<
  TBody = any,
  TMeta extends Record<string, unknown> = Record<string, unknown>
>() {
  const context = React.useContext(
    ConnectivityContext as React.Context<
      ConnectivityContextValue<TBody, TMeta> | null
    >
  );
  if (!context) {
    throw new Error('useConnectivityContext must be used within a ConnectivityProvider');
  }
  return context;
}

// Re-export types and executor factories for convenience
export type { OfflineJobExecutor } from '../offline/offlineQueueService';
export { createAxiosExecutor, createFetchExecutor } from '../offline/executors/httpExecutors';