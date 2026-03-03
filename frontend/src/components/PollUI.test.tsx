import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PollUI from './PollUI';
import { renderWithProviders } from '../test/testUtils';
import { getMockPoll } from '../test/factories';
import { pollsService } from '../services/polls.service';
import { useToast } from '../context/ToastContext';

vi.mock('../services/polls.service', () => ({
    pollsService: {
        votePoll: vi.fn(),
        getPoll: vi.fn()
    }
}));

describe('PollUI', () => {
    const mockOnVote = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    const renderComponent = (poll = getMockPoll()) => {
        return renderWithProviders(
            <PollUI poll={poll} onVote={mockOnVote} />
        );
    };

    it('renders the poll question and options correctly', () => {
        renderComponent();
        expect(screen.getByText('What is your favorite color?')).toBeInTheDocument();
        expect(screen.getByText('Red')).toBeInTheDocument();
        expect(screen.getByText('Blue')).toBeInTheDocument();
        expect(screen.getByText('10 votes')).toBeInTheDocument();
    });

    it('does not display percentages or checkmarks if the user has not voted', () => {
        renderComponent();
        // Since it's dynamically appended with %, we check the absence of the 50% text
        expect(screen.queryByText('50%')).not.toBeInTheDocument();
        expect(screen.queryByText('✓')).not.toBeInTheDocument();
    });

    it('displays percentages and the checkmark if the user has already voted', () => {
        const votedPoll = getMockPoll({
            hasVoted: true,
            userVoteOptionId: 'opt-1'
        });
        renderComponent(votedPoll);

        expect(screen.getAllByText('50%').length).toBe(2); // Both options are 50%
        expect(screen.getByText(/Red\s*✓/)).toBeInTheDocument();
    });

    it('successful voting disables further voting and updates state', async () => {
        const user = userEvent.setup();
        const initialPoll = getMockPoll();

        // Mock the backend responding with the updated poll
        const updatedPoll = getMockPoll({
            hasVoted: true,
            userVoteOptionId: 'opt-2',
            options: [
                { id: 'opt-1', text: 'Red', votes: 5, percentage: 45 },
                { id: 'opt-2', text: 'Blue', votes: 6, percentage: 55 }
            ],
            totalVotes: 11
        });

        vi.mocked(pollsService.votePoll).mockResolvedValueOnce(undefined);
        vi.mocked(pollsService.getPoll).mockResolvedValueOnce(updatedPoll);

        renderComponent(initialPoll);

        const blueButton = screen.getByRole('button', { name: /Blue/ });
        await user.click(blueButton);

        await waitFor(() => {
            expect(pollsService.votePoll).toHaveBeenCalledWith('poll-123', 'opt-2');
            expect(pollsService.getPoll).toHaveBeenCalledWith('poll-123');
            expect(mockOnVote).toHaveBeenCalled();
            expect(screen.getByText('11 votes')).toBeInTheDocument();
            expect(screen.getByText('55%')).toBeInTheDocument();
        });
    });

    it('handles voting error gracefully by showing a toast', async () => {
        const user = userEvent.setup();
        const initialPoll = getMockPoll();

        // Setup error response
        vi.mocked(pollsService.votePoll).mockRejectedValueOnce({
            response: { data: { message: 'You cannot vote twice' } }
        });

        // We need to inspect the addToast call from our mocked context
        let mockAddToast: ReturnType<typeof vi.fn>;

        // Render it, and then extract the instance of the mock hook from the component
        // Since we are validating toast, Let's mock it at the module level just for this scope to inspect it
        vi.mocked(useToast).mockReturnValue({
            addToast: vi.fn(),
            toasts: [],
            removeToast: vi.fn()
        } as any);

        renderComponent(initialPoll);
        const { addToast } = vi.mocked(useToast)();

        const redButton = screen.getByRole('button', { name: /Red/ });
        await user.click(redButton);

        await waitFor(() => {
            expect(addToast).toHaveBeenCalledWith('You cannot vote twice', 'error');
            expect(mockOnVote).not.toHaveBeenCalled();
        });
    });
});
