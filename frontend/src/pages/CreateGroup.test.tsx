import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CreateGroup from './CreateGroup';
import { renderWithProviders } from '../test/testUtils';
import { useGroup } from '../context/GroupContext';
import { useNavigate } from 'react-router-dom';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
    const actual = await importOriginal<typeof import('react-router-dom')>();
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

describe('CreateGroup', () => {
    const mockCreateGroup = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();

        // Track the create call locally for assertions
        vi.mocked(useGroup).mockReturnValue({
            groups: [],
            userGroups: [],
            feed: [],
            isLoading: false,
            error: null,
            joinGroup: vi.fn(),
            leaveGroup: vi.fn(),
            createGroup: mockCreateGroup,
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

        // Mock geolocation API
        const mockGeolocation = {
            getCurrentPosition: vi.fn().mockImplementation((success) =>
                Promise.resolve(success({
                    coords: {
                        latitude: 30.2672,
                        longitude: -97.7431
                    }
                }))
            ),
        };
        (globalThis.navigator as any).geolocation = mockGeolocation;
    });

    const renderComponent = () => {
        return renderWithProviders(<CreateGroup />, { route: '/create-group' });
    };

    it('renders the form inputs properly', () => {
        renderComponent();
        expect(screen.getByLabelText(/Group Name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/City/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Country/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Create Group/i })).toBeInTheDocument();
    });

    it('submits basic group information successfully', async () => {
        const user = userEvent.setup();
        renderComponent();

        const nameInput = screen.getByLabelText(/Group Name/i);
        const descInput = screen.getByLabelText(/Description/i);

        await user.type(nameInput, 'Austin Moms');
        await user.type(descInput, 'A cool place for moms in ATX');

        const submitButton = screen.getByRole('button', { name: /Create Group/i });
        await user.click(submitButton);

        await waitFor(() => {
            expect(mockCreateGroup).toHaveBeenCalledWith(
                'Austin Moms',
                'A cool place for moms in ATX',
                undefined,
                expect.objectContaining({
                    city: undefined,
                    country: undefined,
                    latitude: undefined,
                    longitude: undefined
                })
            );
            expect(mockNavigate).toHaveBeenCalledWith('/groups');
        });
    });

    it('allows fetching and submitting precise geolocation coordinates', async () => {
        const user = userEvent.setup();
        renderComponent();

        const nameInput = screen.getByLabelText(/Group Name/i);
        const descInput = screen.getByLabelText(/Description/i);

        await user.type(nameInput, 'Tech Parents');
        await user.type(descInput, 'Tech parents networking group');

        const geoButton = screen.getByText(/Pin My Exact Coordinates/i);
        await user.click(geoButton);

        await waitFor(() => {
            expect(screen.getByText(/Exact Location Pinned/i)).toBeInTheDocument();
        });

        const submitButton = screen.getByRole('button', { name: /Create Group/i });
        await user.click(submitButton);

        await waitFor(() => {
            expect(mockCreateGroup).toHaveBeenCalledWith(
                'Tech Parents',
                'Tech parents networking group',
                undefined,
                expect.objectContaining({
                    latitude: 30.2672,
                    longitude: -97.7431
                })
            );
        });
    });
});
