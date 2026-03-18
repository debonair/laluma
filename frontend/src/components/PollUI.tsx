import React, { useState, useEffect } from 'react';
import { pollsService } from '../services/polls.service';
import type { Poll } from '../services/posts.service';
import { useToast } from '../context/ToastContext';

interface PollUIProps {
    poll: Poll;
    onVote?: (updatedPoll: Poll) => void;
}

const PollUI: React.FC<PollUIProps> = ({ poll: initialPoll, onVote }) => {
    const [localPoll, setLocalPoll] = useState<Poll>(initialPoll);
    const [votingId, setVotingId] = useState<string | null>(null);
    const { addToast } = useToast();

    // Keep pulse with changes from props
    useEffect(() => {
        setLocalPoll(initialPoll);
    }, [initialPoll]);

    const handleVote = async (optionId: string) => {
        // We allow changing votes now
        setVotingId(optionId);
        try {
            await pollsService.votePoll(localPoll.id, optionId);
            const updatedPoll = await pollsService.getPoll(localPoll.id);
            setLocalPoll(updatedPoll);
            // Notify parent so it can sync its overall posts state
            if (onVote) {
                onVote(updatedPoll);
            }
        } catch (error: any) {
            addToast(error.response?.data?.message || 'Failed to record vote', 'error');
        } finally {
            setVotingId(null);
        }
    };

    return (
        <div className="poll-container" style={{
            background: 'var(--bg-secondary)',
            borderRadius: '1rem',
            padding: '1.25rem',
            border: '1px solid var(--border-color)',
            marginTop: '1rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
            <h4 style={{ margin: '0 0 1.25rem 0', fontSize: '1.1rem', fontWeight: 600 }}>{localPoll.question}</h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {localPoll.options.map((option) => {
                    const isVotedFor = localPoll.userVoteOptionId === option.id;
                    const isVotingThis = votingId === option.id;

                    return (
                        <button
                            key={option.id}
                            onClick={() => handleVote(option.id)}
                            disabled={!!votingId}
                            className="poll-option-button"
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                width: '100%',
                                padding: '0.75rem 1rem',
                                border: '1px solid',
                                borderColor: isVotedFor ? 'var(--primary-color)' : 'var(--border-color)',
                                borderRadius: '0.75rem',
                                background: isVotedFor ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-primary)',
                                cursor: 'pointer',
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                        >
                            {/* Progress bar background */}
                            {localPoll.hasVoted && (
                                <div style={{
                                    position: 'absolute',
                                    left: 0,
                                    top: 0,
                                    bottom: 0,
                                    width: `${option.percentage}%`,
                                    background: isVotedFor ? 'rgba(59, 130, 246, 0.15)' : 'rgba(0, 0, 0, 0.03)',
                                    zIndex: 0,
                                    transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                                }} />
                            )}

                            <span style={{ 
                                fontWeight: 500, 
                                color: isVotedFor ? 'var(--primary-color)' : 'var(--text-primary)',
                                zIndex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}>
                                {option.text}
                                {isVotedFor && <span aria-label="Selected" style={{ color: '#10b981' }}>✓</span>}
                                {isVotingThis && <span className="animate-pulse">...</span>}
                            </span>

                            {localPoll.hasVoted && (
                                <div style={{ 
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'flex-end',
                                    zIndex: 1 
                                }}>
                                    <span style={{ 
                                        fontSize: '0.85rem', 
                                        fontWeight: 700,
                                        color: isVotedFor ? 'var(--primary-color)' : 'var(--text-primary)'
                                    }}>
                                        {option.percentage}%
                                    </span>
                                    <span style={{ 
                                        fontSize: '0.7rem', 
                                        color: 'var(--text-secondary)'
                                    }}>
                                        {option.votes} {option.votes === 1 ? 'vote' : 'votes'}
                                    </span>
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            <div style={{ 
                marginTop: '1.25rem', 
                paddingTop: '0.75rem',
                borderTop: '1px dashed var(--border-color)',
                fontSize: '0.9rem', 
                color: 'var(--text-primary)', 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                fontWeight: 600
            }}>
                <span>Total: {localPoll.totalVotes} {localPoll.totalVotes === 1 ? 'person' : 'people'} voted</span>
                {localPoll.hasVoted && (
                    <span style={{ 
                        fontSize: '0.75rem', 
                        fontWeight: 400, 
                        color: 'var(--primary-color)',
                        background: 'rgba(59, 130, 246, 0.1)',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '0.4rem'
                    }}>
                        Vote Recorded
                    </span>
                )}
            </div>
        </div>
    );
};

export default PollUI;
