import apiClient from './api';
import { type Post } from './posts.service';

export interface FeedPost extends Post {
    group: {
        id: string;
        name: string;
        image_emoji?: string;
    };
}

export interface FeedResponse {
    posts: FeedPost[];
    total: number;
    has_more: boolean;
}

export const feedService = {
    getActivityFeed: async (params?: { limit?: number; offset?: number }): Promise<FeedResponse> => {
        const response = await apiClient.get<FeedResponse>('/feed', { params });
        return response.data;
    },
};
