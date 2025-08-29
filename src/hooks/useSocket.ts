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

const useSocket = (): UseSocketReturn => {
    // Get authentication state to use the token for connection (optional but good practice)
    const { isAuthenticated, token } = useAuth();
    
    // useRef to hold the socket instance to prevent re-creation on every render
    const socketRef = useRef<Socket | null>(null);
    
    // useState to manage connection status and incoming data
    const [isConnected, setIsConnected] = useState(false);
    const [lastLocationUpdate, setLastLocationUpdate] = useState<LocationUpdatePayload | null>(null);

    useEffect(() => {
        // Only attempt to connect if the user is authenticated
        if (isAuthenticated) {
            // If there's already an active connection, do nothing
            if (socketRef.current?.connected) {
                return;
            }

            // Get the API URL from environment variables
            const socketUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            
            // Create a new socket instance
            const socketInstance = io(socketUrl, {
                // Optional: You can pass auth tokens for secure connections
                auth: {
                    token: token,
                },
                transports: ['websocket'] // Prefer WebSocket for real-time performance
            });

            // --- Event Listeners ---
            socketInstance.on('connect', () => {
                console.log('✅ Socket connected:', socketInstance.id);
                setIsConnected(true);
            });

            socketInstance.on('disconnect', () => {
                console.log('❌ Socket disconnected');
                setIsConnected(false);
            });
            
            // This is the custom event we created in the backend
            socketInstance.on('locationUpdate', (data: LocationUpdatePayload) => {
                console.log('🛰️ Received location update:', data);
                setLastLocationUpdate(data);
            });

            // Store the instance in the ref
            socketRef.current = socketInstance;

            // Cleanup function: This will be called when the component unmounts
            return () => {
                if (socketRef.current) {
                    console.log('🧹 Cleaning up socket connection...');
                    socketRef.current.disconnect();
                    socketRef.current = null;
                }
            };
        } else {
            // If the user is not authenticated, disconnect any existing socket
            if (socketRef.current?.connected) {
                socketRef.current.disconnect();
            }
        }
    }, [isAuthenticated, token]); // Rerun this effect if authentication state changes

    return {
        socket: socketRef.current,
        isConnected,
        lastLocationUpdate,
    };
};

export default useSocket;