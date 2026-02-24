import apiClient from './api';

export interface MarketplaceItem {
    id: string;
    sellerId: string;
    title: string;
    description: string;
    price: number;
    condition: string;
    category: string;
    latitude: number;
    longitude: number;
    status: string;
    createdAt: string;
    seller?: {
        id: string;
        username: string;
        displayName?: string;
        profileImageUrl?: string;
        isVerified?: boolean;
    };
}

export const marketplaceService = {
    getItems: async (params?: { latitude?: number; longitude?: number; radius?: number; category?: string; }): Promise<{ items: MarketplaceItem[] }> => {
        const response = await apiClient.get<{ items: MarketplaceItem[] }>('/marketplace', { params });
        return response.data;
    },
    createItem: async (data: Partial<MarketplaceItem>): Promise<MarketplaceItem> => {
        const response = await apiClient.post<MarketplaceItem>('/marketplace', data);
        return response.data;
    },
    updateItemStatus: async (id: string, status: string): Promise<MarketplaceItem> => {
        const response = await apiClient.patch<MarketplaceItem>(`/marketplace/${id}/status`, { status });
        return response.data;
    },
    deleteItem: async (id: string): Promise<void> => {
        await apiClient.delete(`/marketplace/${id}`);
    }
};
