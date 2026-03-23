import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import apiClient from '../services/api';

interface NotificationContextType {
    unreadNotificationsCount: number;
    unreadMessagesCount: number;
    refreshCounts: () => Promise<void>;
    clearUnread: (type: 'notifications' | 'messages') => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
    const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
    const { socket } = useSocket();
    const { isAuthenticated } = useAuth();

    const refreshCounts = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            const [notifRes, msgRes] = await Promise.all([
                apiClient.get<{ unreadCount: number }>('/notifications/unread-count'),
                apiClient.get<{ unreadCount: number }>('/messages/unread-count')
            ]);
            setUnreadNotificationsCount(notifRes.data.unreadCount);
            setUnreadMessagesCount(msgRes.data.unreadCount);
        } catch (error) {
            console.error('Failed to fetch unread counts:', error);
        }
    }, [isAuthenticated]);

    const clearUnread = useCallback((type: 'notifications' | 'messages') => {
        if (type === 'notifications') {
            setUnreadNotificationsCount(0);
        } else {
            setUnreadMessagesCount(0);
        }
    }, []);

    useEffect(() => {
        refreshCounts();
    }, [refreshCounts]);

    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = () => {
            setUnreadMessagesCount(prev => prev + 1);
        };

        const handleNewNotification = () => {
            setUnreadNotificationsCount(prev => prev + 1);
        };

        socket.on('new_message', handleNewMessage);
        socket.on('new_notification', handleNewNotification);

        return () => {
            socket.off('new_message', handleNewMessage);
            socket.off('new_notification', handleNewNotification);
        };
    }, [socket]);

    return (
        <NotificationContext.Provider value={{
            unreadNotificationsCount,
            unreadMessagesCount,
            refreshCounts,
            clearUnread
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};
