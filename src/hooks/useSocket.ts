// frontend/src/hooks/useSocket.ts
'use client';
import { useEffect, useState, useRef, useCallback } from 'react'; // added useCallback
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';

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
    const socketRef = useRef<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [lastLocationUpdate, setLastLocationUpdate] = useState<LocationUpdatePayload | null>(null);
    const [socketState, setSocketState] = useState<Socket | null>(null);

    useEffect(() => {
        if (isAuthenticated && token) {
            if (socketRef.current?.connected) return;

            const socketUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

            console.log('🔌 Connecting socket to:', socketUrl); // Debug

            const socketInstance = io(socketUrl, {
                auth: { token: token, vehicleId: vehicleId },
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionAttempts: 5,        // 🚀 infinite reconnect නෙවෙයි
                reconnectionDelay: 2000,
            });

            socketInstance.on('connect', () => {
                console.log('✅ Socket connected:', socketInstance.id);
                setIsConnected(true);
                setSocketState(socketInstance);
            });

            socketInstance.on('connect_error', (err) => {
                // 🚀 Connect error log කරන්න - debug සඳහා
                console.error('❌ Socket connect error:', err.message);
            });

            socketInstance.on('disconnect', (reason) => {
                console.log('❌ Socket disconnected:', reason);
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

            socketRef.current = socketInstance;

            return () => {
                if (socketRef.current) {
                    socketRef.current.disconnect();
                    socketRef.current = null;
                    setSocketState(null);
                }
            };
        }
    }, [isAuthenticated, token, vehicleId, logout, setForceLogout]);

    return { socket: socketState, isConnected, lastLocationUpdate };
};

export default useSocket;


