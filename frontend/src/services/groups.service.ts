import apiClient from './api';

export interface Group {
    id: string;
    name: string;
    description: string;
    image_emoji?: string;
    image_url?: string;
    latitude?: number | null;
    longitude?: number | null;
    city?: string | null;
    country?: string | null;
    member_count: number;
    is_member: boolean;
    created_at: string;
    created_by?: {
        id: string;
        username: string;
        display_name?: string;
    };
}

export interface GroupsResponse {
    groups: Group[];
    total: number;
    has_more: boolean;
}

export interface CreateGroupData {
    name: string;
    description: string;
    image_emoji?: string;
    is_private?: boolean;
    latitude?: number;
    longitude?: number;
    city?: string;
    country?: string;
}

export const groupsService = {
    getGroups: async (params?: {
        filter?: 'all' | 'my-groups' | 'discover';
        search?: string;
        limit?: number;
        offset?: number;
        latitude?: number;
        longitude?: number;
        radius?: number;
        city?: string;
        country?: string;
    }): Promise<GroupsResponse> => {
        const response = await apiClient.get<GroupsResponse>('/groups', { params });
        return response.data;
    },

    getGroup: async (groupId: string): Promise<Group> => {
        const response = await apiClient.get<Group>(`/groups/${groupId}`);
        return response.data;
    },

    createGroup: async (data: CreateGroupData): Promise<Group> => {
        const response = await apiClient.post<Group>('/groups', data);
        return response.data;
    },

    joinGroup: async (groupId: string): Promise<{ success: boolean; message: string }> => {
        const response = await apiClient.post(`/groups/${groupId}/join`);
        return response.data;
    },

    leaveGroup: async (groupId: string): Promise<{ success: boolean; message: string }> => {
        const response = await apiClient.post(`/groups/${groupId}/leave`);
        return response.data;
    },
};
