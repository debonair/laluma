import { describe, it, expect, vi, beforeEach } from 'vitest';
import { pollsService } from './polls.service';
import apiClient from './api';

vi.mock('./api', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
    }
}));

describe('Polls Service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('getPoll fetches by id', async () => {
        const mockPoll = { id: 'poll1' };
        vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockPoll });
        const result = await pollsService.getPoll('poll1');
        expect(apiClient.get).toHaveBeenCalledWith('/polls/poll1');
        expect(result).toEqual(mockPoll);
    });

    it('votePoll posts to vote endpoint', async () => {
        vi.mocked(apiClient.post).mockResolvedValueOnce({ data: { success: true } });
        await pollsService.votePoll('poll1', 'opt1');
        expect(apiClient.post).toHaveBeenCalledWith('/polls/poll1/vote', { optionId: 'opt1' });
    });
});
