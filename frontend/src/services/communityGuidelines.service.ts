import apiClient from './api';

// Types for Community Guidelines
export interface CommunityGuidelines {
    id: string;
    content: string;
    version: number;
    publishedAt: string;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}

export interface CommunityGuidelinesWithCreator extends CommunityGuidelines {
    creator?: {
        id: string;
        username: string;
        displayName: string | null;
    };
}

export interface GuidelinesPaginatedResponse {
    data: CommunityGuidelinesWithCreator[];
    total: number;
    page: number;
    totalPages: number;
}

export interface ApiResponse<T> {
    data: T;
}

export const communityGuidelinesService = {
    /**
     * Get the current (latest published) community guidelines - public endpoint
     */
    getCurrent: async (): Promise<CommunityGuidelines> => {
        const response = await apiClient.get<ApiResponse<CommunityGuidelines>>('/community-guidelines/current');
        return response.data.data;
    },

    /**
     * Get a specific guidelines version by ID - auth required
     */
    getById: async (id: string): Promise<CommunityGuidelines> => {
        const response = await apiClient.get<ApiResponse<CommunityGuidelines>>(`/community-guidelines/${id}`);
        return response.data.data;
    },

    /**
     * Get all guidelines versions (admin) with pagination
     */
    getAll: async (params?: { page?: number; limit?: number }): Promise<GuidelinesPaginatedResponse> => {
        const response = await apiClient.get<ApiResponse<GuidelinesPaginatedResponse>>('/admin/community-guidelines', { params });
        return response.data.data;
    },

    /**
     * Create new guidelines version (admin) - publishes new version
     */
    create: async (content: string): Promise<CommunityGuidelines> => {
        const response = await apiClient.post<ApiResponse<CommunityGuidelines>>('/admin/community-guidelines', { content });
        return response.data.data;
    },

    /**
     * Update existing guidelines version (admin)
     */
    update: async (id: string, content: string): Promise<CommunityGuidelines> => {
        const response = await apiClient.put<ApiResponse<CommunityGuidelines>>(`/admin/community-guidelines/${id}`, { content });
        return response.data.data;
    },
};
