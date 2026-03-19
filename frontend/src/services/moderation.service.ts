import apiClient from './api';

export type EntityType = 'post' | 'comment' | 'content';

export interface ReportData {
    entityType: EntityType;
    entityId: string;
    reason: string;
}

export const moderationService = {
    reportContent: async (data: ReportData): Promise<{ success: boolean; message: string }> => {
        const response = await apiClient.post('/moderation/report', data);
        return response.data;
    }
};
