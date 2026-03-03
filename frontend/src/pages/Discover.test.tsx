import { screen, waitFor, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Discover from './Discover';
import { renderWithProviders } from '../test/testUtils';
import { contentService } from '../services/content.service';
import { userService } from '../services/user.service';
import { connectionService } from '../services/connection.service';
import * as AuthContextModule from '../context/AuthContext';

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

vi.mock('../services/content.service', () => ({
    contentService: {
        getDiscover: vi.fn()
    }
}));

vi.mock('../services/user.service', () => ({
    userService: {
        getCurrentUser: vi.fn(),
        getNearbyUsers: vi.fn(),
        updateCurrentUser: vi.fn()
    }
}));

vi.mock('../services/connection.service', () => ({
    connectionService: {
        getConnections: vi.fn(),
        requestConnection: vi.fn(),
        respondToRequest: vi.fn()
    }
}));

const mockUseAuth = vi.mocked(AuthContextModule.useAuth);

describe('Discover Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        mockUseAuth.mockReturnValue({
            user: { id: 'user-1' },
        } as any);

        vi.mocked(contentService.getDiscover).mockResolvedValue({
            promotions: [],
            events: []
        });

        vi.mocked(userService.getCurrentUser).mockResolvedValue({
            id: 'user-1',
            username: 'myself'
        } as any);

        vi.mocked(userService.getNearbyUsers).mockResolvedValue([]);
        vi.mocked(connectionService.getConnections).mockResolvedValue([]);
    });

    const renderComponent = () => renderWithProviders(<Discover />, { route: '/discover' });

    it('prompts the user to enable location if they have no location configured', async () => {
        vi.mocked(userService.getCurrentUser).mockResolvedValue({
            id: 'user-1',
            username: 'myself',
            location: null
        } as any);

        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('Discover')).toBeInTheDocument();
        });

        expect(screen.getByText('Find Moms Locally')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Enable Location/i })).toBeInTheDocument();
        expect(userService.getNearbyUsers).toHaveBeenCalled(); // Initially fetches anyway based on the effect
        expect(contentService.getDiscover).toHaveBeenCalledWith({ latitude: undefined, longitude: undefined, radius: undefined });
    });

    it('bypasses the location prompt and fetches specific coordinates if user location is already set', async () => {
        vi.mocked(userService.getCurrentUser).mockResolvedValue({
            id: 'user-1',
            username: 'here',
            location: { latitude: 40, longitude: -70, radius: 25, anywhere: false }
        } as any);

        renderComponent();

        await waitFor(() => {
            expect(contentService.getDiscover).toHaveBeenCalledWith({ latitude: 40, longitude: -70, radius: 25 });
        });

        expect(screen.queryByText('Find Moms Locally')).not.toBeInTheDocument();
    });

    it('requests geolocation and updates user profile when "Enable Location" is clicked', async () => {
        vi.mocked(userService.getCurrentUser).mockResolvedValue({
            id: 'user-1',
            username: 'newbie',
            location: null
        } as any);

        vi.mocked(userService.updateCurrentUser).mockResolvedValue({} as any);

        const mockGeolocation = {
            getCurrentPosition: vi.fn().mockImplementation((success) =>
                Promise.resolve(success({ coords: { latitude: 50, longitude: -80 } }))
            )
        };
        (global as any).navigator.geolocation = mockGeolocation;

        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('Find Moms Locally')).toBeInTheDocument();
        });

        const shareBtn = screen.getByRole('button', { name: /Enable Location/i });
        fireEvent.click(shareBtn);

        await waitFor(() => {
            expect(mockGeolocation.getCurrentPosition).toHaveBeenCalled();
            expect(userService.updateCurrentUser).toHaveBeenCalledWith({
                location: { latitude: 50, longitude: -80, radius: 50 }
            });
            expect(contentService.getDiscover).toHaveBeenCalledWith({ latitude: 50, longitude: -80, radius: 50 });
        });
    });

    it('renders nearby users list successfully', async () => {
        vi.mocked(userService.getCurrentUser).mockResolvedValue({
            id: 'user-1',
            location: { latitude: 40, longitude: -70, radius: 25 }
        } as any);

        vi.mocked(userService.getNearbyUsers).mockResolvedValue([
            { id: 'user-2', username: 'JaneDoe', distance: 5, connectionStatus: 'none', isVerified: true },
            { id: 'user-3', username: 'Mom2022', distance: 12, connectionStatus: 'connected', isVerified: false }
        ] as any);

        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('Moms near you')).toBeInTheDocument();
        });

        expect(screen.getByText('JaneDoe')).toBeInTheDocument();
        expect(screen.getByText('Mom2022')).toBeInTheDocument();

        // Assert we show the correct button states
        expect(screen.getAllByRole('button', { name: /View Profile & Message/i })).toHaveLength(2);
    });

    it('submits connection accept/decline when responding to incoming waves', async () => {
        vi.mocked(userService.getCurrentUser).mockResolvedValue({
            id: 'user-1',
            location: { latitude: 40, longitude: -70, radius: 25 }
        } as any);

        vi.mocked(connectionService.getConnections).mockResolvedValue([
            { id: 'conn-1', status: 'pending', requesterId: 'user-2', recipientId: 'user-1', requester: { username: 'JaneDoe' } },
            { id: 'conn-2', status: 'pending', requesterId: 'user-3', recipientId: 'user-1', requester: { username: 'Mom2022' } }
        ] as any);

        vi.mocked(connectionService.respondToRequest).mockResolvedValue({} as any);

        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('Incoming Waves 👋')).toBeInTheDocument();
        });

        // Test accept on the first item's button (getAllByRole)
        const waveBackButtons = screen.getAllByRole('button', { name: /Wave Back/i });
        fireEvent.click(waveBackButtons[0]);
        await waitFor(() => {
            expect(connectionService.respondToRequest).toHaveBeenCalledWith('conn-1', 'accepted');
        });

        // Test decline on the other remaining item. Since the first item might be removed, 
        // we just query for Ignore on whatever is left.
        const ignoreButtons = screen.getAllByRole('button', { name: /Ignore/i });
        fireEvent.click(ignoreButtons[ignoreButtons.length - 1]);
        await waitFor(() => {
            expect(connectionService.respondToRequest).toHaveBeenCalledWith('conn-2', 'declined');
        });
    });
});
