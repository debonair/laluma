import { describe, it, expect, vi, beforeEach } from 'vitest';
import { userService } from './user.service';
import apiClient from './api';

vi.mock('./api', () => ({
    default: {
        get: vi.fn(),
        patch: vi.fn(),
    }
}));

describe('User Service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('getCurrentUser fetches the me endpoint', async () => {
        const mockUser = { id: 'u1', username: 'test' };
        vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockUser });
        const result = await userService.getCurrentUser();
        expect(apiClient.get).toHaveBeenCalledWith('/users/me');
        expect(result).toEqual(mockUser);
    });

    it('updateCurrentUser patches the me endpoint', async () => {
        const mockUser = { id: 'u1', display_name: 'Updated' };
        vi.mocked(apiClient.patch).mockResolvedValueOnce({ data: mockUser });
        const payload = { display_name: 'Updated' };
        const result = await userService.updateCurrentUser(payload);
        expect(apiClient.patch).toHaveBeenCalledWith('/users/me', payload);
        expect(result).toEqual(mockUser);
    });

    it('searchUsers fetches from search endpoint', async () => {
        const mockUsers = [{ id: 'u2' }];
        vi.mocked(apiClient.get).mockResolvedValueOnce({ data: { users: mockUsers } });
        const result = await userService.searchUsers('test search');
        expect(apiClient.get).toHaveBeenCalledWith('/users/search?q=test%20search');
        expect(result).toEqual(mockUsers);
    });

    it('getPublicProfile fetches by id', async () => {
        const mockProfile = { id: 'u3' };
        vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockProfile });
        const result = await userService.getPublicProfile('u3');
        expect(apiClient.get).toHaveBeenCalledWith('/users/u3');
        expect(result).toEqual(mockProfile);
    });

    it('getNearbyUsers fetches from nearby endpoint', async () => {
        const mockUsers = [{ id: 'u4' }];
        vi.mocked(apiClient.get).mockResolvedValueOnce({ data: { users: mockUsers } });
        const result = await userService.getNearbyUsers();
        expect(apiClient.get).toHaveBeenCalledWith('/users/nearby');
        expect(result).toEqual(mockUsers);
    });
});
