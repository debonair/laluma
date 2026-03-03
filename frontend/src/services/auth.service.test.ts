import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService, tokenStorage } from './auth.service';
import apiClient from './api';

vi.mock('./api', () => ({
    default: {
        post: vi.fn(),
    }
}));

let mockStorage: Record<string, string> = {};

beforeEach(() => {
    vi.clearAllMocks();
    mockStorage = {};
    vi.mocked(localStorage.getItem).mockImplementation((key) => mockStorage[key] || null);
    vi.mocked(localStorage.setItem).mockImplementation((key, value) => { mockStorage[key] = value.toString(); });
    vi.mocked(localStorage.removeItem).mockImplementation((key) => { delete mockStorage[key]; });
    vi.mocked(localStorage.clear).mockImplementation(() => { mockStorage = {}; });
});

describe('authService', () => {
    it('signUp should post to /auth/signup and return data', async () => {
        const mockTokens = { accessToken: 'a', refreshToken: 'r', expiresIn: 3600 };
        vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockTokens });
        const result = await authService.signUp({ username: 'test', email: 'test@test.com', password: 'password' });
        expect(apiClient.post).toHaveBeenCalledWith('/auth/signup', { username: 'test', email: 'test@test.com', password: 'password' });
        expect(result).toEqual(mockTokens);
    });

    it('signIn should post to /auth/signin and return data', async () => {
        const mockTokens = { accessToken: 'a', refreshToken: 'r', expiresIn: 3600 };
        vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockTokens });
        const result = await authService.signIn({ username: 'test', password: 'password' });
        expect(apiClient.post).toHaveBeenCalledWith('/auth/signin', { username: 'test', password: 'password' });
        expect(result).toEqual(mockTokens);
    });

    it('refresh should post to /auth/refresh and return data', async () => {
        const mockTokens = { accessToken: 'new_a', refreshToken: 'new_r', expiresIn: 3600 };
        vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockTokens });
        const result = await authService.refresh('old_r');
        expect(apiClient.post).toHaveBeenCalledWith('/auth/refresh', { refreshToken: 'old_r' });
        expect(result).toEqual(mockTokens);
    });

    it('signOut should post to /auth/signout', async () => {
        vi.mocked(apiClient.post).mockResolvedValueOnce({});
        await authService.signOut('some_refresh');
        expect(apiClient.post).toHaveBeenCalledWith('/auth/signout', { refreshToken: 'some_refresh' });
    });
});

describe('tokenStorage', () => {
    it('saves and retrieves tokens correctly', () => {
        const tokens = { accessToken: 'acc', refreshToken: 'ref', expiresIn: 3600 };
        tokenStorage.save(tokens);
        expect(tokenStorage.getAccessToken()).toBe('acc');
        expect(tokenStorage.getRefreshToken()).toBe('ref');
        expect(localStorage.getItem('luma_token_expiry')).toBeDefined();
    });

    it('clears tokens correctly', () => {
        const tokens = { accessToken: 'acc', refreshToken: 'ref', expiresIn: 3600 };
        tokenStorage.save(tokens);
        tokenStorage.clear();
        expect(tokenStorage.getAccessToken()).toBeNull();
        expect(tokenStorage.getRefreshToken()).toBeNull();
        expect(localStorage.getItem('luma_token_expiry')).toBeNull();
    });

    it('checks expiration correctly', () => {
        expect(tokenStorage.isExpired()).toBe(true); // empty

        tokenStorage.save({ accessToken: 'a', refreshToken: 'r', expiresIn: 1000 }); // far future
        expect(tokenStorage.isExpired()).toBe(false);

        tokenStorage.save({ accessToken: 'a', refreshToken: 'r', expiresIn: -100 }); // past
        expect(tokenStorage.isExpired()).toBe(true);
    });
});

