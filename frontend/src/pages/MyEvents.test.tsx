import { screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MyEvents from './MyEvents';
import { renderWithProviders } from '../test/testUtils';
import * as EventServiceModule from '../services/event.service';

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

vi.mock('../services/event.service', () => ({
    getMyEvents: vi.fn(),
    cancelEventRegistration: vi.fn()
}));

describe('MyEvents Page', () => {
    const mockEvents: any[] = [
        {
            id: 'event-1',
            title: 'Registered Event',
            startTime: new Date().toISOString(),
            registrationStatus: 'registered',
            location: 'Location 1'
        },
        {
            id: 'event-2',
            title: 'Waitlisted Event',
            startTime: new Date().toISOString(),
            registrationStatus: 'waitlisted',
            waitlistPosition: 5
        }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(EventServiceModule.getMyEvents).mockResolvedValue(mockEvents);
    });

    const renderComponent = () => renderWithProviders(<MyEvents />, { route: '/my-events' });

    it('renders registered and waitlisted events', async () => {
        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('Registered Event')).toBeInTheDocument();
            expect(screen.getByText('Waitlisted Event')).toBeInTheDocument();
        });

        expect(screen.getByText('Confirmed Spots')).toBeInTheDocument();
        expect(screen.getByText('Waitlist Queue')).toBeInTheDocument();
        expect(screen.getByText('#5')).toBeInTheDocument();
    });

    it('opens confirmation modal when clicking cancel on registered event', async () => {
        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('Registered Event')).toBeInTheDocument();
        });

        const cancelBtn = screen.getByTitle('Cancel Registration');
        fireEvent.click(cancelBtn);

        expect(screen.getByText('Cancel Registration?')).toBeInTheDocument();
        expect(screen.getByText(/We'll miss you!/)).toBeInTheDocument();
    });

    it('opens confirmation modal when clicking cancel on waitlisted event', async () => {
        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('Waitlisted Event')).toBeInTheDocument();
        });

        const leaveBtn = screen.getByTitle('Leave Waitlist');
        fireEvent.click(leaveBtn);

        expect(screen.getByText('Leave Waitlist?')).toBeInTheDocument();
        expect(screen.getByText(/We understand plans change/)).toBeInTheDocument();
    });

    it('calls cancelEventRegistration when confirming cancellation', async () => {
        vi.mocked(EventServiceModule.cancelEventRegistration).mockResolvedValue({} as any);
        
        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('Registered Event')).toBeInTheDocument();
        });

        const cancelBtn = screen.getByTitle('Cancel Registration');
        fireEvent.click(cancelBtn);

        const confirmBtn = screen.getByText('Cancel Registration'); // Button in modal
        fireEvent.click(confirmBtn);

        await waitFor(() => {
            expect(EventServiceModule.cancelEventRegistration).toHaveBeenCalledWith('event-1');
            expect(EventServiceModule.getMyEvents).toHaveBeenCalledTimes(2); // Initial + refresh
        });
    });

    it('renders empty state when no events', async () => {
        vi.mocked(EventServiceModule.getMyEvents).mockResolvedValue([]);
        
        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('No events yet')).toBeInTheDocument();
            expect(screen.getByText(/Your calendar looks empty/)).toBeInTheDocument();
        });
    });
});
