import { screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Home from './Home';
import { renderWithProviders } from '../test/testUtils';
import * as AuthContextModule from '../context/AuthContext';
import * as GroupContextModule from '../context/GroupContext';
import * as reactRouterDom from 'react-router-dom';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate
    };
});

vi.mock('../components/BottomNav', () => ({
    default: () => <div data-testid="mock-bottom-nav">Bottom Nav</div>
}));

const mockUseAuth = vi.mocked(AuthContextModule.useAuth);
const mockUseGroup = vi.mocked(GroupContextModule.useGroup);

describe('Home', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseAuth.mockReturnValue({
            user: { id: '1', username: 'testuser', email: 'test@example.com', displayName: 'Test User' },
            isAuthenticated: true,
            isLoading: false,
            error: null,
            clearError: vi.fn(),
            signIn: vi.fn(),
            signUp: vi.fn(),
            signOut: vi.fn(),
            updateProfile: vi.fn()
        } as any);

        mockUseGroup.mockReturnValue({
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
    });

    it('renders the header with user name and dashboard info', () => {
        renderWithProviders(<Home />);
        expect(screen.getByRole('heading', { name: /Welcome, Test User!/i })).toBeInTheDocument();
        expect(screen.getByText('Your Dashboard')).toBeInTheDocument();
    });

    it('displays the empty state when the feed is empty', () => {
        renderWithProviders(<Home />);
        expect(screen.getByText('Your Feed is Quiet')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Discover Communities/i })).toBeInTheDocument();
    });

    it('renders feed items when feed has data', () => {
        mockUseGroup.mockReturnValue({
            ...mockUseGroup(),
            feed: [
                {
                    id: 'post-1',
                    content: 'This is a test post',
                    created_at: new Date().toISOString(),
                    author: { id: 'u1', username: 'user1', isVerified: true },
                    group: { id: 'g1', name: 'Test Group' }
                }
            ]
        } as any);

        renderWithProviders(<Home />);

        expect(screen.queryByText('Your Feed is Quiet')).not.toBeInTheDocument();
        expect(screen.getByText('This is a test post')).toBeInTheDocument();
        expect(screen.getByText('user1')).toBeInTheDocument();
        expect(screen.getByText(/in Test Group/i)).toBeInTheDocument();
    });

    it('navigates to messages when clicking the Messages button', () => {
        renderWithProviders(<Home />);
        const messageBtn = screen.getByTitle('Messages');
        fireEvent.click(messageBtn);
        expect(mockNavigate).toHaveBeenCalledWith('/messages');
    });

    it('displays the admin panel if the user has app-admin role', () => {
        mockUseAuth.mockReturnValue({
            ...mockUseAuth(),
            user: { id: '1', username: 'admin', email: 'admin@example.com', roles: ['app-admin'] }
        } as any);

        renderWithProviders(<Home />);
        expect(screen.getByText('Admin Tools')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /Open Admin Dashboard/i }));
        expect(mockNavigate).toHaveBeenCalledWith('/admin');
    });

    it('calls signOut when clicking the sign out button', () => {
        const signOutMock = vi.fn();
        mockUseAuth.mockReturnValue({
            ...mockUseAuth(),
            signOut: signOutMock
        } as any);

        renderWithProviders(<Home />);
        const signOutBtn = screen.getByRole('button', { name: /Sign Out/i });
        fireEvent.click(signOutBtn);
        expect(signOutMock).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('/signin');
    });
});
