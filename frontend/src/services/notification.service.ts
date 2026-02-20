import apiClient from './api';
import type { NotificationResponse } from '../types/notification';

export const notificationService = {
    getAll: async (params?: { limit?: number; offset?: number }): Promise<NotificationResponse> => {
        const response = await apiClient.get<NotificationResponse>('/notifications', { params });
        return response.data;
    },

    markAsRead: async (id: string): Promise<void> => {
        await apiClient.put(`/notifications/${id}/read`);
    },

    markAllAsRead: async (): Promise<void> => {
        await apiClient.put('/notifications/read-all');
    }
};
