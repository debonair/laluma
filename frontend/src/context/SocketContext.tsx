/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { tokenStorage } from '../services/auth.service';

interface SocketContextData {
    socket: Socket | null;
    isConnected: boolean;
}

const SocketContext = createContext<SocketContextData>({ socket: null, isConnected: false });

export const SocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        let newSocket: Socket | null = null;
        let mounted = true;

        if (isAuthenticated) {
            const token = tokenStorage.getAccessToken();

            if (token) {
                // Connect to Socket.IO backend
                newSocket = io('http://localhost:3000', {
                    auth: { token },
                    transports: ['websocket', 'polling'] // Try WS first, fallback to polling
                });

                newSocket.on('connect', () => {
                    console.log('🔗 Connected to Real-time socket', newSocket?.id);
                    if (mounted) {
                        setIsConnected(true);
                        setSocket(newSocket);
                    }
                });

                newSocket.on('disconnect', () => {
                    console.log('🔗 Disconnected from Real-time socket');
                    if (mounted) {
                        setIsConnected(false);
                        setSocket(null);
                    }
                });

                // Global listen for generic backend errors emitted via socket
                newSocket.on('error', (err) => {
                    console.error('Socket error received:', err);
                });
            }
        }

        return () => {
            mounted = false;
            if (newSocket) {
                newSocket.disconnect();
            }
        };
    }, [isAuthenticated]);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => useContext(SocketContext);
