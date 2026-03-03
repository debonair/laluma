import { describe, it, expect, vi, beforeEach } from 'vitest';
import { feedService } from './feed.service';
import apiClient from './api';

vi.mock('./api', () => ({
    default: {
        get: vi.fn(),
    }
}));

describe('Feed Service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('getActivityFeed fetches the feed with pagination', async () => {
        const mockData = { posts: [], total: 0, has_more: false };
        vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockData });

        const params = { limit: 10, offset: 5 };
        const result = await feedService.getActivityFeed(params);

        expect(apiClient.get).toHaveBeenCalledWith('/feed', { params });
        expect(result).toEqual(mockData);
    });
});
