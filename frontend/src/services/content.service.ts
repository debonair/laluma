import apiClient from './api';
import type { Content, ContentResponse } from '../types/content';

export const contentService = {
    getAll: async (params?: {
        category?: string;
        isPremium?: boolean;
        isFeatured?: boolean;
        limit?: number;
        offset?: number
    }): Promise<ContentResponse> => {
        const response = await apiClient.get<ContentResponse>('/content', { params });
        return response.data;
    },

    getById: async (id: string): Promise<Content> => {
        const response = await apiClient.get<Content>(`/content/${id}`);
        return response.data;
    },

    getDiscover: async (params?: { latitude?: number; longitude?: number; radius?: number }): Promise<{ promotions: Content[], events: Content[] }> => {
        const response = await apiClient.get<{ promotions: Content[], events: Content[] }>('/content/discover', { params });
        return response.data;
    },

    getBookmarks: async (params?: { limit?: number; offset?: number }): Promise<Content[]> => {
        const response = await apiClient.get<Content[]>('/content/bookmarks', { params });
        return response.data;
    },

    toggleBookmark: async (id: string, isBookmarked: boolean): Promise<void> => {
        if (isBookmarked) {
            await apiClient.delete(`/content/${id}/bookmark`);
        } else {
            await apiClient.post(`/content/${id}/bookmark`);
        }
    },

    toggleLike: async (id: string, isLiked: boolean): Promise<void> => {
        if (isLiked) {
            await apiClient.delete(`/content/${id}/like`);
        } else {
            await apiClient.post(`/content/${id}/like`);
        }
    },

    moderateComment: async (commentId: string, status: 'visible' | 'hidden' | 'flagged'): Promise<void> => {
        await apiClient.put(`/content/comments/${commentId}/moderate`, { status });
    }
};
