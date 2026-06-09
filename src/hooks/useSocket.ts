// frontend/src/hooks/useSocket.ts
'use client';
import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';

// 🚀 SHARED SINGLETON STORAGE: Keeps a single stable socket active across all pages/hooks [1]
let sharedSocket: Socket | null = null;
let sharedToken: string | null = null;

interface LocationUpdatePayload {
    vehicleId: string | number;
    lat: number;
    lng: number;
    timestamp?: number;
    updatedBy?: string;
}

interface UseSocketReturn {
    socket: Socket | null;
    isConnected: boolean;
    lastLocationUpdate: LocationUpdatePayload | null;
}

const useSocket = (vehicleId?: string | number | null): UseSocketReturn => {
    const { isAuthenticated, token, logout, setForceLogout } = useAuth();
    const [isConnected, setIsConnected] = useState(false);
    const [lastLocationUpdate, setLastLocationUpdate] = useState<LocationUpdatePayload | null>(null);
    const [socketState, setSocketState] = useState<Socket | null>(sharedSocket);

    useEffect(() => {
        // 1. Hard Cleanup on Logout
        if (!isAuthenticated || !token) {
            if (sharedSocket) {
                console.log('🔌 Disconnecting shared socket due to unauthentication');
                sharedSocket.disconnect();
                sharedSocket = null;
                sharedToken = null;
            }
            setIsConnected(false);
            setSocketState(null);
            return;
        }

        // 2. 🚀 STABILITY FIX: If a stable shared socket already exists with the same token, reuse it! [1]
        if (sharedSocket?.connected && sharedToken === token) {
            setIsConnected(true);
            setSocketState(sharedSocket);
            return;
        }

        // 3. If token changed, disconnect the old socket first before connecting new one
        if (sharedSocket) {
            sharedSocket.disconnect();
            sharedSocket = null;
        }

        const socketUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

        console.log('🔌 Connecting shared socket to:', socketUrl); // Debug

        const socketInstance = io(socketUrl, {
            auth: { token: token, vehicleId: vehicleId },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,        // 🚀 infinite reconnect නෙවෙයි
            reconnectionDelay: 2000,
        });

        socketInstance.on('connect', () => {
            console.log('✅ Shared Socket connected:', socketInstance.id);
            setIsConnected(true);
            setSocketState(socketInstance);
        });

        socketInstance.on('connect_error', (err) => {
            // 🚀 Connect error log කරන්න - debug සඳහා
            console.error('❌ Shared Socket connect error:', err.message);
        });

        socketInstance.on('disconnect', (reason) => {
            console.log('❌ Shared Socket disconnected:', reason);
            setIsConnected(false);
            setSocketState(null);
        });

        socketInstance.on('emergencyLogout', (data: { tokenIdentifier: string, reason: string }) => {
            console.warn("🚨 EMERGENCY LOGOUT RECEIVED:", data);
            const currentToken = (token.startsWith('Bearer ') ? token.slice(7) : token).trim();
            const incomingToken = (data.tokenIdentifier.startsWith('Bearer ') ? data.tokenIdentifier.slice(7) : data.tokenIdentifier).trim();
            if (currentToken === incomingToken) {
                setForceLogout(data.reason || "Your session has been terminated.");
            }
        });

        socketInstance.on('newNotification', (data: any) => {
            console.log('📡 Notification received:', data);
        });

        // Save to singleton storage
        sharedSocket = socketInstance;
        sharedToken = token;
        setSocketState(socketInstance);

        return () => {
            // 🚀 STABILITY FIX: Do not disconnect on simple page re-renders/unmounts
            // This keeps the socket alive when navigating between pages!
        };
    }, [isAuthenticated, token, vehicleId, logout, setForceLogout]);

    return { socket: socketState, isConnected, lastLocationUpdate };
};

export default useSocket;