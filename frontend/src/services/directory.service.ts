import apiClient from './api';

export interface DirectoryReview {
    id: string;
    listingId: string;
    authorId: string;
    rating: number;
    content: string;
    createdAt: string;
    author?: {
        id: string;
        username: string;
        displayName?: string;
        profileImageUrl?: string;
        isVerified?: boolean;
    };
}

export interface DirectoryListing {
    id: string;
    name: string;
    category: string;
    address?: string;
    latitude: number;
    longitude: number;
    description?: string;
    createdAt: string;
    averageRating?: number;
    reviewCount?: number;
    reviews?: DirectoryReview[];
}

export const directoryService = {
    getListings: async (params?: { latitude?: number; longitude?: number; radius?: number; category?: string; }): Promise<{ listings: DirectoryListing[] }> => {
        const response = await apiClient.get<{ listings: DirectoryListing[] }>('/directory', { params });
        return response.data;
    },
    createListing: async (data: Partial<DirectoryListing>): Promise<DirectoryListing> => {
        const response = await apiClient.post<DirectoryListing>('/directory', data);
        return response.data;
    },
    getListingReviews: async (id: string): Promise<{ reviews: DirectoryReview[] }> => {
        const response = await apiClient.get<{ reviews: DirectoryReview[] }>(`/directory/${id}/reviews`);
        return response.data;
    },
    addReview: async (id: string, data: { rating: number, content: string }): Promise<DirectoryReview> => {
        const response = await apiClient.post<DirectoryReview>(`/directory/${id}/reviews`, data);
        return response.data;
    }
};
