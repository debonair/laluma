import { screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import GroupDetail from './GroupDetail';
import { renderWithProviders } from '../test/testUtils';
import { useGroup } from '../context/GroupContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import apiClient from '../services/api';
import { getMockGroup } from '../test/factories';

// We map react-router-dom to expose useParams and generic useNavigate globally
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useParams: vi.fn(),
        useNavigate: () => vi.fn()
    };
});

// Mock api client for direct requests like members fetch
vi.mock('../services/api', () => ({
    default: {
        get: vi.fn(),
        delete: vi.fn(),
        patch: vi.fn(),
    }
}));

import { useParams } from 'react-router-dom';

describe('GroupDetail', () => {
    const mockGetGroup = vi.fn();
    const mockGetGroupPosts = vi.fn();
    const mockJoinGroup = vi.fn();
    const mockLeaveGroup = vi.fn();
    const mockCreatePost = vi.fn();
    const mockAddComment = vi.fn();
    const mockLikePost = vi.fn();

    const mockAddToast = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();

        vi.mocked(useParams).mockReturnValue({ id: 'g1' });

        vi.mocked(useAuth).mockReturnValue({
            user: { id: 'u1', username: 'tester' },
            isAuthenticated: true,
        } as any);

        vi.mocked(useToast).mockReturnValue({
            addToast: mockAddToast
        } as any);

        vi.mocked(useGroup).mockReturnValue({
            getGroup: mockGetGroup,
            getGroupPosts: mockGetGroupPosts,
            joinGroup: mockJoinGroup,
            leaveGroup: mockLeaveGroup,
            createPost: mockCreatePost,
            addComment: mockAddComment,
            likePost: mockLikePost,
        } as any);

        // Mock members API call explicitly
        vi.mocked(apiClient.get).mockResolvedValue({ data: [] });
    });

    it('renders skeleton loading state initially', () => {
        mockGetGroup.mockReturnValue(new Promise(() => { })); // Never resolves to see loading
        const { container } = renderWithProviders(<GroupDetail />);
        expect(container.querySelector('.skeleton')).toBeInTheDocument();
    });

    it('renders "Group Not Found" when getting group fails', async () => {
        mockGetGroup.mockResolvedValueOnce(null);
        renderWithProviders(<GroupDetail />);

        await waitFor(() => {
            expect(screen.getByText('Group Not Found')).toBeInTheDocument();
        });
    });

    it('renders group information correctly when found', async () => {
        const mockGroup = getMockGroup({ name: 'Awesome Moms' });
        mockGetGroup.mockResolvedValueOnce(mockGroup);
        mockGetGroupPosts.mockResolvedValue([]);

        renderWithProviders(<GroupDetail />);

        await waitFor(() => {
            expect(screen.getByText('Awesome Moms')).toBeInTheDocument();
            expect(screen.getByText(mockGroup.description)).toBeInTheDocument();
        });
    });

    it('toggles member view and fetches members', async () => {
        const mockGroup = getMockGroup({ name: 'Test Group', is_member: true });
        mockGetGroup.mockResolvedValueOnce(mockGroup);
        mockGetGroupPosts.mockResolvedValue([]);

        vi.mocked(apiClient.get).mockResolvedValue({
            data: [{ id: 'm1', userId: 'u2', username: 'user2', role: 'member' }]
        });

        renderWithProviders(<GroupDetail />);

        await waitFor(() => {
            expect(screen.getByText('Test Group')).toBeInTheDocument();
        });

        const viewMembersBtn = screen.getByRole('button', { name: /View Members/i });
        fireEvent.click(viewMembersBtn);

        await waitFor(() => {
            expect(apiClient.get).toHaveBeenCalledWith('/groups/g1/members');
            expect(screen.getByText('user2')).toBeInTheDocument();
        });
    });

    it('posts standard post with group context', async () => {
        const mockGroup = getMockGroup({ is_member: true });
        mockGetGroup.mockResolvedValueOnce(mockGroup);
        mockGetGroupPosts.mockResolvedValue([]);

        renderWithProviders(<GroupDetail />);

        await waitFor(() => {
            expect(screen.getByText(mockGroup.name)).toBeInTheDocument();
        });

        const input = screen.getByPlaceholderText(/Share something with the group/i);
        fireEvent.change(input, { target: { value: 'Hello world!' } });

        const postButton = screen.getByRole('button', { name: /Post/i });
        fireEvent.click(postButton);

        await waitFor(() => {
            expect(mockCreatePost).toHaveBeenCalledWith('g1', {
                content: 'Hello world!',
                isAnonymous: false
            });
        });
    });

    it('joins and leaves the group toggling state', async () => {
        let isMember = false;

        const mockGroup = getMockGroup({ is_member: false });
        mockGetGroup.mockImplementation(() => Promise.resolve({ ...mockGroup, is_member: isMember }));
        mockGetGroupPosts.mockResolvedValue([]);

        renderWithProviders(<GroupDetail />);

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /Join Group/i })).toBeInTheDocument();
        });

        // Click join
        isMember = true;
        fireEvent.click(screen.getByRole('button', { name: /Join Group/i }));

        await waitFor(() => {
            expect(mockJoinGroup).toHaveBeenCalledWith('g1');
            expect(screen.getByRole('button', { name: /Leave Group/i })).toBeInTheDocument();
        });

        // Click leave
        isMember = false;
        fireEvent.click(screen.getByRole('button', { name: /Leave Group/i }));

        await waitFor(() => {
            expect(mockLeaveGroup).toHaveBeenCalledWith('g1');
            expect(screen.getByRole('button', { name: /Join Group/i })).toBeInTheDocument();
        });
    });
});
