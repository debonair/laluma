import apiClient from './api';


export interface ConnectionUser {
    id: string;
    username: string;
    displayName?: string;
    profileImageUrl?: string;
    isVerified?: boolean;
    motherhoodStage?: string;
}

export interface Connection {
    id: string;
    requesterId: string;
    recipientId: string;
    status: 'pending' | 'accepted' | 'declined';
    createdAt: string;
    updatedAt: string;
    requester: ConnectionUser;
    recipient: ConnectionUser;
}

export const connectionService = {
    getConnections: async (): Promise<Connection[]> => {
        const response = await apiClient.get<{ connections: Connection[] }>('/connections');
        return response.data.connections;
    },

    sendRequest: async (recipientId: string): Promise<Connection> => {
        const response = await apiClient.post<Connection>('/connections/request', { recipientId });
        return response.data;
    },

    respondToRequest: async (connectionId: string, status: 'accepted' | 'declined'): Promise<Connection | { success: boolean; message: string }> => {
        const response = await apiClient.put(`/connections/${connectionId}/respond`, { status });
        return response.data;
    }
};
