import React, { useState } from 'react';
import { pollsService } from '../services/polls.service';
import type { Poll } from '../services/posts.service';
import { useToast } from '../context/ToastContext';

interface PollUIProps {
    poll: Poll;
    onVote?: () => void;
}

const PollUI: React.FC<PollUIProps> = ({ poll: initialPoll, onVote }) => {
    const [poll, setPoll] = useState<Poll>(initialPoll);
    const [isVoting, setIsVoting] = useState(false);
    const { addToast } = useToast();

    const handleVote = async (optionId: string) => {
        if (poll.hasVoted || isVoting) return;

        try {
            setIsVoting(true);
            await pollsService.votePoll(poll.id, optionId);
            const updatedPoll = await pollsService.getPoll(poll.id);
            setPoll(updatedPoll);
            if (onVote) onVote();
        } catch (error: any) {
            addToast(error.response?.data?.message || error.message || 'Failed to vote', 'error');
        } finally {
            setIsVoting(false);
        }
    };

    return (
        <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
            <h4 style={{ marginBottom: '1rem', fontWeight: 600, fontSize: '1.05rem', color: 'var(--text-primary)' }}>{poll.question}</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {poll.options.map(opt => (
                    <div key={opt.id} style={{ position: 'relative', overflow: 'hidden', borderRadius: '0.5rem', border: '1px solid var(--border-color)', background: 'var(--card-bg)' }}>
                        {poll.hasVoted && (
                            <div style={{
                                position: 'absolute',
                                left: 0,
                                top: 0,
                                bottom: 0,
                                width: `${opt.percentage}%`,
                                background: opt.id === poll.userVoteOptionId ? 'rgba(139, 92, 246, 0.2)' : 'rgba(107, 114, 128, 0.1)',
                                zIndex: 0,
                                transition: 'width 0.5s ease-out'
                            }} />
                        )}
                        <button
                            onClick={() => handleVote(opt.id)}
                            disabled={poll.hasVoted || isVoting}
                            style={{
                                width: '100%',
                                padding: '0.75rem 1rem',
                                background: 'transparent',
                                border: 'none',
                                textAlign: 'left',
                                position: 'relative',
                                zIndex: 1,
                                cursor: poll.hasVoted ? 'default' : 'pointer',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                color: 'var(--text-primary)'
                            }}
                        >
                            <span style={{ fontWeight: opt.id === poll.userVoteOptionId ? 600 : 400 }}>
                                {opt.text} {opt.id === poll.userVoteOptionId && '✓'}
                            </span>
                            {poll.hasVoted && (
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                    {opt.percentage}%
                                </span>
                            )}
                        </button>
                    </div>
                ))}
            </div>
            <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'right' }}>
                {poll.totalVotes} vote{poll.totalVotes !== 1 ? 's' : ''}
            </div>
        </div>
    );
};

export default PollUI;
