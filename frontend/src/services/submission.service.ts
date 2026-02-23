import apiClient from './api';

export interface Submission {
    id: string;
    userId: string;
    title: string;
    body: string;
    category: string;
    status: string;
    rejectionReason?: string;
    approvedContentId?: string;
    createdAt: string;
    updatedAt: string;
    user?: { id: string; username: string; displayName?: string };
}

export const submissionService = {
    create: async (data: { title: string; body: string; category: string }) => {
        const res = await apiClient.post<Submission>('/submissions', data);
        return res.data;
    },
    getMine: async () => {
        const res = await apiClient.get<Submission[]>('/submissions/mine');
        return res.data;
    },
    getAll: async (status?: string) => {
        const res = await apiClient.get<Submission[]>('/submissions', { params: status ? { status } : undefined });
        return res.data;
    },
    approve: async (id: string) => {
        const res = await apiClient.post(`/submissions/${id}/approve`);
        return res.data;
    },
    reject: async (id: string, reason?: string) => {
        const res = await apiClient.post(`/submissions/${id}/reject`, { reason });
        return res.data;
    }
};
