import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

import * as AuthContext from '../context/AuthContext';
import * as ToastContext from '../context/ToastContext';
import * as GroupContext from '../context/GroupContext';
import * as SocketContext from '../context/SocketContext';

/**
 * Reset default global mocks for our Context Providers.
 * These act as universal defaults so components never crash natively when unit tested alone.
 */
export const resetProviderMocks = () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
        user: { id: 'mock-user-1', name: 'Mock User', email: 'mock@example.com' },
        isAuthenticated: true,
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn(),
        isLoading: false,
        clearError: vi.fn()
    } as any);

    vi.mocked(ToastContext.useToast).mockReturnValue({
        addToast: vi.fn(),
        toasts: [],
        removeToast: vi.fn()
    } as any);

    vi.mocked(GroupContext.useGroup).mockReturnValue({
        groups: [],
        userGroups: [],
        feed: [],
        isLoading: false,
        error: null,
        joinGroup: vi.fn(),
        leaveGroup: vi.fn(),
        createGroup: vi.fn(),
        createPost: vi.fn(),
        addComment: vi.fn(),
        likePost: vi.fn(),
        unlikePost: vi.fn(),
        getGroup: vi.fn(),
        getGroupPosts: vi.fn(),
        getPostComments: vi.fn(),
        refreshGroups: vi.fn(),
        refreshFeed: vi.fn(),
        clearError: vi.fn(),
    } as any);

    vi.mocked(SocketContext.useSocket).mockReturnValue({
        socket: null
    } as any);
};

interface CustomRenderOptions extends RenderOptions {
    route?: string;
}

export const renderWithProviders = (
    ui: ReactElement,
    { route = '/', ...renderOptions }: CustomRenderOptions = {}
) => {
    return render(
        <MemoryRouter initialEntries={[route]}>
            {ui}
        </MemoryRouter>,
        renderOptions
    );
};

// Re-export testing library standard exports
export * from '@testing-library/react';
