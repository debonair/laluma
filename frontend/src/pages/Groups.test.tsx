import { screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Groups from './Groups';
import { renderWithProviders } from '../test/testUtils';
import * as GroupContextModule from '../context/GroupContext';

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

const mockUseGroup = vi.mocked(GroupContextModule.useGroup);

const mockGroups = [
    { id: 'g1', name: 'General Mom Chat', description: 'Just general chat', isPrivate: false },
    { id: 'g2', name: 'Austin Moms', description: 'Moms in Austin TX', isPrivate: false },
    { id: 'g3', name: 'Toddler Tips', description: 'Tips for toddlers', isPrivate: false }
];

const mockUserGroups = [
    mockGroups[0]
];

describe('Groups Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        mockUseGroup.mockReturnValue({
            groups: mockGroups,
            userGroups: mockUserGroups as any,
            feed: [],
            isLoading: false,
            error: null,
            joinGroup: vi.fn().mockResolvedValue(undefined),
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

        const mockGeolocation = {
            getCurrentPosition: vi.fn().mockImplementation((success) =>
                success({ coords: { latitude: 50, longitude: -80 } })
            )
        };
        (global as any).navigator.geolocation = mockGeolocation;
    });

    const renderComponent = () => renderWithProviders(<Groups />, { route: '/groups' });

    it('renders My Groups tab by default and only shows user groups', () => {
        renderComponent();

        // Assert we start on My Groups
        expect(screen.getByText('General Mom Chat')).toBeInTheDocument();
        // The other groups should not be visible
        expect(screen.queryByText('Austin Moms')).not.toBeInTheDocument();
    });

    it('switches to Discover tab and shows unjoined groups', () => {
        renderComponent();

        fireEvent.click(screen.getByRole('button', { name: /Discover/i }));

        expect(screen.getByText('Austin Moms')).toBeInTheDocument();
        expect(screen.getByText('Toddler Tips')).toBeInTheDocument();
        // Should NOT show 'General Mom Chat' because it's already joined
        expect(screen.queryByText('General Mom Chat')).not.toBeInTheDocument();
    });

    it('filters groups by search term', () => {
        renderComponent();

        // Switch to discover so we see 'Austin Moms' and 'Toddler Tips'
        fireEvent.click(screen.getByRole('button', { name: /Discover/i }));

        const searchInput = screen.getByPlaceholderText('Search groups...');
        fireEvent.change(searchInput, { target: { value: 'Austin' } });

        expect(screen.getByText('Austin Moms')).toBeInTheDocument();
        expect(screen.queryByText('Toddler Tips')).not.toBeInTheDocument();
    });

    it('allows joining a group from the Discover tab', async () => {
        const joinMock = mockUseGroup().joinGroup;
        renderComponent();

        fireEvent.click(screen.getByRole('button', { name: /Discover/i }));

        // Find the Join button for the group
        const joinButtons = screen.getAllByRole('button', { name: /Join/i });
        fireEvent.click(joinButtons[0]); // Click first join button

        await waitFor(() => {
            expect(joinMock).toHaveBeenCalledWith('g2'); // g2 is the first unjoined group (Austin Moms)
        });
    });

    it('requests geolocation and calls refreshGroups when Near Me is saved', async () => {
        const refreshMock = mockUseGroup().refreshGroups;
        renderComponent();

        fireEvent.click(screen.getByRole('button', { name: /Discover/i }));

        const nearMeBtn = screen.getByRole('button', { name: /Near Me/i });
        fireEvent.click(nearMeBtn);

        const applyFiltersBtn = screen.getByRole('button', { name: /Search Location/i });
        fireEvent.click(applyFiltersBtn);

        await waitFor(() => {
            expect((global as any).navigator.geolocation.getCurrentPosition).toHaveBeenCalled();
            expect(refreshMock).toHaveBeenCalledWith({
                city: undefined,
                latitude: 50,
                longitude: -80,
                radius: 50
            });
        });
    });

    it('falls back to city filter if geolocation fails', async () => {
        const refreshMock = mockUseGroup().refreshGroups;
        (global as any).navigator.geolocation.getCurrentPosition = vi.fn().mockImplementation((_, errorCallback) => {
            errorCallback(new Error('User denied'));
        });

        renderComponent();

        fireEvent.click(screen.getByRole('button', { name: /Discover/i }));

        const cityInput = screen.getByPlaceholderText('City (e.g. Austin)');
        fireEvent.change(cityInput, { target: { value: 'Denver' } });

        const nearMeBtn = screen.getByRole('button', { name: /Near Me/i });
        fireEvent.click(nearMeBtn);

        const applyFiltersBtn = screen.getByRole('button', { name: /Search Location/i });
        fireEvent.click(applyFiltersBtn);

        await waitFor(() => {
            expect(refreshMock).toHaveBeenCalledWith({ city: 'Denver' });
        });
    });

    it('applies only city filter if Near Me is not active', async () => {
        const refreshMock = mockUseGroup().refreshGroups;
        renderComponent();

        fireEvent.click(screen.getByRole('button', { name: /Discover/i }));

        const cityInput = screen.getByPlaceholderText('City (e.g. Austin)');
        fireEvent.change(cityInput, { target: { value: 'Austin' } });

        const applyFiltersBtn = screen.getByRole('button', { name: /Search Location/i });
        fireEvent.click(applyFiltersBtn);

        await waitFor(() => {
            expect(refreshMock).toHaveBeenCalledWith({ city: 'Austin' });
        });
    });

    it('navigates to create group page when clicking the + button', () => {
        renderComponent();

        fireEvent.click(screen.getByRole('button', { name: /\+/i }));

        expect(mockNavigate).toHaveBeenCalledWith('/groups/create');
    });

    it('navigates to group detail when a group card is clicked', () => {
        renderComponent();

        // Group name 'General Mom Chat' should be readable, let's find its container.
        const groupElement = screen.getByText('General Mom Chat').closest('.group-card') || screen.getByText('General Mom Chat');
        fireEvent.click(groupElement);

        expect(mockNavigate).toHaveBeenCalledWith('/groups/g1');
    });
});
