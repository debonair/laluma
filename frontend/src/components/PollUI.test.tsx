import { screen, waitFor, fireEvent } from '@testing-library/react';
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

// Use global mock from setup if available, but ensure we can control it
vi.mock('../context/ToastContext', () => ({
    useToast: vi.fn(() => ({
        addToast: vi.fn(),
        toasts: [],
        removeToast: vi.fn()
    }))
}));

describe('PollUI', () => {
    const mockOnVote = vi.fn();
    const mockAddToast = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useToast).mockReturnValue({
            addToast: mockAddToast,
            toasts: [],
            removeToast: vi.fn()
        } as any);
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
        expect(screen.queryByText('50%')).not.toBeInTheDocument();
        expect(screen.queryByText('✓')).not.toBeInTheDocument();
    });

    it('displays percentages and the checkmark if the user has already voted', () => {
        const votedPoll = getMockPoll({
            hasVoted: true,
            userVoteOptionId: 'opt-1'
        });
        renderComponent(votedPoll);

        expect(screen.getAllByText('50%').length).toBe(2);
        expect(screen.getByText(/Red/)).toBeInTheDocument();
        expect(screen.getByText('✓')).toBeInTheDocument();
    });

    it('successful voting updates state and allows changing vote', async () => {
        const initialPoll = getMockPoll();

        const firstUpdate = getMockPoll({
            hasVoted: true,
            userVoteOptionId: 'opt-2',
            options: [
                { id: 'opt-1', text: 'Red', votes: 5, percentage: 45 },
                { id: 'opt-2', text: 'Blue', votes: 6, percentage: 55 }
            ],
            totalVotes: 11
        });

        const secondUpdate = getMockPoll({
            hasVoted: true,
            userVoteOptionId: 'opt-1',
            options: [
                { id: 'opt-1', text: 'Red', votes: 6, percentage: 55 },
                { id: 'opt-2', text: 'Blue', votes: 5, percentage: 45 }
            ],
            totalVotes: 11
        });

        vi.mocked(pollsService.votePoll).mockResolvedValue(undefined as any);
        vi.mocked(pollsService.getPoll)
            .mockResolvedValueOnce(firstUpdate)
            .mockResolvedValueOnce(secondUpdate);

        renderComponent(initialPoll);

        const blueButton = screen.getByText('Blue').closest('button');
        if (!blueButton) throw new Error('Button not found');
        fireEvent.click(blueButton);

        await waitFor(() => {
            expect(pollsService.votePoll).toHaveBeenCalledWith('poll-123', 'opt-2');
            expect(screen.getByText(/55%/)).toBeInTheDocument();
        });

        // Now change vote to Red
        const redButton = screen.getByText('Red').closest('button');
        if (!redButton) throw new Error('Button not found');
        fireEvent.click(redButton);

        await waitFor(() => {
            expect(pollsService.votePoll).toHaveBeenCalledWith('poll-123', 'opt-1');
            expect(screen.getByText('✓')).toBeInTheDocument();
        });
    });

    it('handles voting error gracefully by showing a toast', async () => {
        const initialPoll = getMockPoll();

        vi.mocked(pollsService.votePoll).mockRejectedValueOnce({
            response: { data: { message: 'Network error' } }
        });

        renderComponent(initialPoll);

        const redButton = screen.getByText('Red').closest('button');
        if (!redButton) throw new Error('Button not found');
        fireEvent.click(redButton);

        await waitFor(() => {
            expect(mockAddToast).toHaveBeenCalledWith('Network error', 'error');
            expect(mockOnVote).not.toHaveBeenCalled();
        });
    });
});
