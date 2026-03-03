import { describe, it, expect, vi, beforeEach } from 'vitest';
import { directoryService } from './directory.service';
import apiClient from './api';

vi.mock('./api', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
    }
}));

describe('Directory Service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('getListings fetches with params', async () => {
        const mockData = { listings: [] };
        vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockData });
        const params = { radius: 10 };
        const result = await directoryService.getListings(params);
        expect(apiClient.get).toHaveBeenCalledWith('/directory', { params });
        expect(result).toEqual(mockData);
    });

    it('createListing posts new listing data', async () => {
        const mockData = { id: 'l1', name: 'Test Listing', latitude: 0, longitude: 0, category: 'Healthcare', createdAt: '' };
        vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockData });
        const payload = { name: 'Test Listing' };
        const result = await directoryService.createListing(payload);
        expect(apiClient.post).toHaveBeenCalledWith('/directory', payload);
        expect(result).toEqual(mockData);
    });

    it('getListingReviews fetches reviews by id', async () => {
        const mockData = { reviews: [] };
        vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockData });
        const result = await directoryService.getListingReviews('l1');
        expect(apiClient.get).toHaveBeenCalledWith('/directory/l1/reviews');
        expect(result).toEqual(mockData);
    });

    it('addReview posts a dynamic review', async () => {
        const mockReview = { id: 'r1', rating: 5, content: 'Great', listingId: 'l1', authorId: 'u1', createdAt: '' };
        vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockReview });
        const payload = { rating: 5, content: 'Great' };
        const result = await directoryService.addReview('l1', payload);
        expect(apiClient.post).toHaveBeenCalledWith('/directory/l1/reviews', payload);
        expect(result).toEqual(mockReview);
    });
});
