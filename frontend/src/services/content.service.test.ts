import { describe, it, expect, vi, beforeEach } from 'vitest';
import { contentService } from './content.service';
import apiClient from './api';

vi.mock('./api', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
        delete: vi.fn(),
        put: vi.fn(),
    }
}));

describe('Content Service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('getAll fetches content with params', async () => {
        const mockResponse = { data: { content: [], total: 0 } };
        vi.mocked(apiClient.get).mockResolvedValueOnce(mockResponse);

        const params = { limit: 10, offset: 0 };
        const result = await contentService.getAll(params);

        expect(apiClient.get).toHaveBeenCalledWith('/content', { params });
        expect(result).toEqual(mockResponse.data);
    });

    it('getById fetches a single content', async () => {
        const mockData = { id: 'item-1', title: 'Test' };
        vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockData });

        const result = await contentService.getById('item-1');

        expect(apiClient.get).toHaveBeenCalledWith('/content/item-1');
        expect(result).toEqual(mockData);
    });

    it('getDiscover fetches explore content with geolocation params', async () => {
        const mockData = { promotions: [], events: [] };
        vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockData });

        const params = { latitude: 40, longitude: -70 };
        const result = await contentService.getDiscover(params);

        expect(apiClient.get).toHaveBeenCalledWith('/content/discover', { params });
        expect(result).toEqual(mockData);
    });

    it('getBookmarks fetches bookmarked content', async () => {
        const mockData = [{ id: 'b1' }];
        vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockData });

        const params = { limit: 5 };
        const result = await contentService.getBookmarks(params);

        expect(apiClient.get).toHaveBeenCalledWith('/content/bookmarks', { params });
        expect(result).toEqual(mockData);
    });

    it('toggleBookmark posts when isBookmarked is false', async () => {
        vi.mocked(apiClient.post).mockResolvedValueOnce({});
        await contentService.toggleBookmark('cx1', false);
        expect(apiClient.post).toHaveBeenCalledWith('/content/cx1/bookmark');
    });

    it('toggleBookmark deletes when isBookmarked is true', async () => {
        vi.mocked(apiClient.delete).mockResolvedValueOnce({});
        await contentService.toggleBookmark('cx1', true);
        expect(apiClient.delete).toHaveBeenCalledWith('/content/cx1/bookmark');
    });

    it('toggleLike posts when isLiked is false', async () => {
        vi.mocked(apiClient.post).mockResolvedValueOnce({});
        await contentService.toggleLike('cy1', false);
        expect(apiClient.post).toHaveBeenCalledWith('/content/cy1/like');
    });

    it('toggleLike deletes when isLiked is true', async () => {
        vi.mocked(apiClient.delete).mockResolvedValueOnce({});
        await contentService.toggleLike('cy1', true);
        expect(apiClient.delete).toHaveBeenCalledWith('/content/cy1/like');
    });

    it('moderateComment updates comment status', async () => {
        vi.mocked(apiClient.put).mockResolvedValueOnce({});
        await contentService.moderateComment('cm1', 'flagged');
        expect(apiClient.put).toHaveBeenCalledWith('/content/comments/cm1/moderate', { status: 'flagged' });
    });
});
