import { describe, it, expect, vi, beforeEach } from 'vitest';
import { notificationService } from './notification.service';
import apiClient from './api';

vi.mock('./api', () => ({
    default: {
        get: vi.fn(),
        put: vi.fn(),
    }
}));

describe('Notification Service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('getAll fetches with params', async () => {
        const mockData = { notifications: [] };
        vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockData });
        const params = { limit: 10 };
        const result = await notificationService.getAll(params);
        expect(apiClient.get).toHaveBeenCalledWith('/notifications', { params });
        expect(result).toEqual(mockData);
    });

    it('markAsRead puts to specific id', async () => {
        vi.mocked(apiClient.put).mockResolvedValueOnce({});
        await notificationService.markAsRead('n1');
        expect(apiClient.put).toHaveBeenCalledWith('/notifications/n1/read');
    });

    it('markAllAsRead puts to global endpoint', async () => {
        vi.mocked(apiClient.put).mockResolvedValueOnce({});
        await notificationService.markAllAsRead();
        expect(apiClient.put).toHaveBeenCalledWith('/notifications/read-all');
    });
});
