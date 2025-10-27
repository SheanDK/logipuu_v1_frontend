'use client';

/**
 * Debug helper that subscribes to connectivity state and writes informative
 * messages (initial status, status changes, queue size) to the console.
 * Aids verification of provider/hooks wiring during development.
 */

import { useEffect, useRef } from 'react';
import { useConnectivity } from '@/hooks/useConnectivity';

export default function ConnectivityDebugLogger() {
  // Read connectivity status and an immutable snapshot of the current job queue.
  const { isOnline, queueSnapshot } = useConnectivity();

  // Refs to track previous values across renders without causing re-renders.
  const prevIsOnline = useRef<boolean | null>(null);
  const prevQueueLength = useRef<number>(queueSnapshot.jobs.length);

  // Log initial values once on mount.
  useEffect(() => {
    console.info('[connectivity] initial status:', isOnline ? 'online' : 'offline');
    console.info('[connectivity] initial queue size:', queueSnapshot.jobs.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty: we want a single mount-time log

  // Log when online/offline status changes.
  useEffect(() => {
    if (prevIsOnline.current !== isOnline) {
      prevIsOnline.current = isOnline;
      console.info('[connectivity] status changed:', isOnline ? 'online' : 'offline');
    }
  }, [isOnline]);

  // Log when the length of the job queue changes.
  useEffect(() => {
    if (prevQueueLength.current !== queueSnapshot.jobs.length) {
      prevQueueLength.current = queueSnapshot.jobs.length;
      console.info('[connectivity] queue size:', queueSnapshot.jobs.length);
    }
  }, [queueSnapshot.jobs.length]);

  // Pure side-effects component: renders nothing.
  return null;
}