import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthProvider, useAuth } from './AuthContext';
import { userService } from '../services/user.service';
import { authService, tokenStorage } from '../services/auth.service';

vi.unmock('./AuthContext');

vi.mock('../services/user.service', () => ({
    userService: {
        getCurrentUser: vi.fn(),
        updateProfile: vi.fn()
    }
}));

vi.mock('../services/auth.service', () => ({
    authService: {
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn()
    },
    tokenStorage: {
        getAccessToken: vi.fn(),
        getRefreshToken: vi.fn(),
        isTokenValid: vi.fn(),
        isExpired: vi.fn(),
        clear: vi.fn()
    }
}));

const TestComponent = () => {
    const { user, isAuthenticated, isLoading, error } = useAuth()!;
    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;
    return (
        <div>
            {isAuthenticated ? `Authenticated: ${user?.username}` : 'Not Authenticated'}
        </div>
    );
};

describe('AuthContext', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('starts in loading state then becomes unauthenticated if no token', async () => {
        vi.mocked(tokenStorage.isTokenValid).mockReturnValue(false);
        vi.mocked(tokenStorage.getAccessToken).mockReturnValue(null);

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        await waitFor(() => {
            expect(screen.getByText('Not Authenticated')).toBeInTheDocument();
        });
    });

    it('authenticates user if token is valid', async () => {
        vi.mocked(tokenStorage.isTokenValid).mockReturnValue(true);
        vi.mocked(tokenStorage.getAccessToken).mockReturnValue('fake-token');
        vi.mocked(userService.getCurrentUser).mockResolvedValue({
            id: '1',
            username: 'testuser',
            email: 'test@example.com',
            has_completed_onboarding: true,
            role: 'user',
            created_at: new Date().toISOString()
        });

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        expect(screen.getByText('Loading...')).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText('Authenticated: testuser')).toBeInTheDocument();
        });

        expect(userService.getCurrentUser).toHaveBeenCalled();
    });
});
