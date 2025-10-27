// src/components/providers/ConnectivityBoundary.tsx

/*
client-side boundary used in the layout.
It memoises the Axios executor, mounts ConnectivityProvider, and (in non-production builds)
renders the debug logger before children.

*/

'use client';

import React, { PropsWithChildren, useMemo } from 'react';
import { ConnectivityProvider } from '@/contexts/ConnectivityContext';
import { createAxiosExecutor } from '@/offline/executors/httpExecutors';
import apiClient from '@/services/apiClient';
import ConnectivityDebugLogger from './ConnectivityDebugLogger';

export default function ConnectivityBoundary({ children }: PropsWithChildren) {
    const executor = useMemo(() => createAxiosExecutor(apiClient), []);
    return (
        <ConnectivityProvider executor={executor}>
            
            {/* Show verbose connectivity logs only outside production. */}
            {process.env.NODE_ENV !== 'production' ? <ConnectivityDebugLogger /> : null}
            {children}
        </ConnectivityProvider>
    );
}
