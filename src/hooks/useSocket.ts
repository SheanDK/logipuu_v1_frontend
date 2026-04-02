// frontend/src/hooks/useSocket.ts
'use client';
import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';
// Define the structure for the location update payload we expect from the server
interface LocationUpdatePayload {
    vehicleId: string | number;
    lat: number;
    lng: number;
    timestamp?: number;
    updatedBy?: string;
}
// Define the return type of our custom hook
interface UseSocketReturn {
    socket: Socket | null;
    isConnected: boolean;
    lastLocationUpdate: LocationUpdatePayload | null;
}
const useSocket = (vehicleId?: string | number | null): UseSocketReturn => {
    const { isAuthenticated, token } = useAuth();
    // useRef to hold the socket instance to prevent re-creation on every render
    const socketRef = useRef<Socket | null>(null);

    // useState to manage connection status and incoming data
    const [isConnected, setIsConnected] = useState(false);
    const [lastLocationUpdate, setLastLocationUpdate] = useState<LocationUpdatePayload | null>(null);

    // Expose socket via STATE (not just ref) so consumers re-render and re-subscribe to events
    // when the socket first connects. Without this, useEffect blocks in consumers that depend
    // on `socket` never fire — because refs don't trigger re-renders.
    const [socketState, setSocketState] = useState<Socket | null>(null);

    useEffect(() => {
        // Only attempt to connect if the user is authenticated
        if (isAuthenticated) {
            // If there's already an active connection, do nothing
            if (socketRef.current?.connected) {
                return;
            }

            const socketUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

            const socketInstance = io(socketUrl, {
                auth: {
                    token: token,
                    vehicleId: vehicleId
                },
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionAttempts: 10,
                reconnectionDelay: 1000
            });

            // --- Event Listeners ---
            socketInstance.on('connect', () => {
                console.log('✅ Socket connected:', socketInstance.id);
                setIsConnected(true);
                // Crucial: push socket into state so consumers re-render with a live reference
                setSocketState(socketInstance);
            });

            socketInstance.on('disconnect', () => {
                console.log('❌ Socket disconnected');
                setIsConnected(false);
                setSocketState(null);
            });

            socketInstance.on('locationUpdate', (data: LocationUpdatePayload) => {
                console.log('🛰️ Received location update:', data);
                setLastLocationUpdate(data);
            });

            socketRef.current = socketInstance;

            return () => {
                if (socketRef.current) {
                    console.log('🧹 Cleaning up socket connection...');
                    socketRef.current.disconnect();
                    socketRef.current = null;
                    setSocketState(null);
                }
            };
        } else {
            // If the user is not authenticated, disconnect any existing socket
            if (socketRef.current?.connected) {
                socketRef.current.disconnect();
                socketRef.current = null;
                setSocketState(null);
            }
        }
    }, [isAuthenticated, token, vehicleId]);

    return {
        socket: socketState,
        isConnected,
        lastLocationUpdate,
    };
};
export default useSocket;