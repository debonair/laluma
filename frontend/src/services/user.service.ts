import apiClient from './api';

export interface UserProfile {
    id: string;
    username: string;
    email: string;
    display_name?: string;
    about_me?: string;
    motherhood_stage?: string;
    profile_image_url?: string;
    location?: {
        radius: number;
        anywhere: boolean;
        city?: string;
        country?: string;
        latitude?: number;
        longitude?: number;
    };
    looking_for?: string[];
    has_completed_onboarding: boolean;
    role: string;
    isVerified?: boolean;
    created_at: string;
}

export interface UpdateProfileData {
    display_name?: string;
    about_me?: string;
    motherhood_stage?: string;
    location?: {
        radius?: number;
        anywhere?: boolean;
        latitude?: number;
        longitude?: number;
        city?: string;
        country?: string;
    };
    looking_for?: string[];
}

export interface PublicProfile {
    id: string;
    username: string;
    display_name?: string;
    about_me?: string;
    motherhood_stage?: string;
    profile_image_url?: string;
    isVerified?: boolean;
    created_at: string;
    stats: {
        groups_created: number;
        posts_created: number;
    };
}

export interface UserSearchResult {
    id: string;
    username: string;
    display_name?: string;
    profile_image_url?: string;
    motherhood_stage?: string;
    isVerified?: boolean;
}

export interface UserNearbyResult {
    id: string;
    username: string;
    display_name?: string;
    profile_image_url?: string;
    motherhood_stage?: string;
    isVerified?: boolean;
    distance_km: number;
}

export const userService = {
    getCurrentUser: async (): Promise<UserProfile> => {
        const response = await apiClient.get<UserProfile>('/users/me');
        return response.data;
    },

    updateCurrentUser: async (data: UpdateProfileData): Promise<UserProfile> => {
        const response = await apiClient.patch<UserProfile>('/users/me', data);
        return response.data;
    },

    searchUsers: async (query: string): Promise<UserSearchResult[]> => {
        const response = await apiClient.get<{ users: UserSearchResult[] }>(`/users/search?q=${encodeURIComponent(query)}`);
        return response.data.users;
    },

    getPublicProfile: async (id: string): Promise<PublicProfile> => {
        const response = await apiClient.get<PublicProfile>(`/users/${id}`);
        return response.data;
    },

    getNearbyUsers: async (): Promise<UserNearbyResult[]> => {
        const response = await apiClient.get<{ users: UserNearbyResult[] }>('/users/nearby');
        return response.data.users;
    },

    verifyUser: async (verificationMethod: 'manual' | 'selfie' | 'phone'): Promise<{ success: boolean; isVerified: boolean }> => {
        const response = await apiClient.post('/users/me/verify', { verificationMethod });
        return response.data;
    },

    blockUser: async (id: string): Promise<{ success: boolean }> => {
        const response = await apiClient.post(`/users/${id}/block`);
        return response.data;
    },

    unblockUser: async (id: string): Promise<{ success: boolean }> => {
        const response = await apiClient.delete(`/users/${id}/block`);
        return response.data;
    }
};
