import { describe, it, expect, vi, beforeEach } from 'vitest';
import { groupsService } from './groups.service';
import apiClient from './api';

vi.mock('./api', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
    }
}));

describe('Groups Service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('getGroups fetches with query params', async () => {
        const mockResponse = { data: { groups: [], total: 0 } };
        vi.mocked(apiClient.get).mockResolvedValueOnce(mockResponse);

        const params = { filter: 'discover' as const, radius: 10 };
        const result = await groupsService.getGroups(params);

        expect(apiClient.get).toHaveBeenCalledWith('/groups', { params });
        expect(result).toEqual(mockResponse.data);
    });

    it('getGroup fetches a specific group by ID', async () => {
        const mockGroup = { id: 'g1', name: 'Test Group' };
        vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockGroup });

        const result = await groupsService.getGroup('g1');

        expect(apiClient.get).toHaveBeenCalledWith('/groups/g1');
        expect(result).toEqual(mockGroup);
    });

    it('createGroup posts new group data', async () => {
        const mockGroup = { id: 'g2', name: 'New Group' };
        vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockGroup });

        const payload = { name: 'New Group', description: 'Desc' };
        const result = await groupsService.createGroup(payload);

        expect(apiClient.post).toHaveBeenCalledWith('/groups', payload);
        expect(result).toEqual(mockGroup);
    });

    it('joinGroup posts to join endpoint', async () => {
        vi.mocked(apiClient.post).mockResolvedValueOnce({ data: { success: true } });
        await groupsService.joinGroup('g1');
        expect(apiClient.post).toHaveBeenCalledWith('/groups/g1/join');
    });

    it('leaveGroup posts to leave endpoint', async () => {
        vi.mocked(apiClient.post).mockResolvedValueOnce({ data: { success: true } });
        await groupsService.leaveGroup('g1');
        expect(apiClient.post).toHaveBeenCalledWith('/groups/g1/leave');
    });
});
