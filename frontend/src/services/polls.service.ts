import apiClient from './api';
import type { Poll } from './posts.service';

export const pollsService = {
    getPoll: async (pollId: string): Promise<Poll> => {
        const response = await apiClient.get<Poll>(`/polls/${pollId}`);
        return response.data;
    },

    votePoll: async (pollId: string, optionId: string): Promise<void> => {
        await apiClient.post(`/polls/${pollId}/vote`, { optionId });
    }
};
