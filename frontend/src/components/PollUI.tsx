import React, { useState, useEffect } from 'react';
import { pollsService } from '../services/polls.service';
import type { Poll } from '../services/posts.service';
import { useToast } from '../context/ToastContext';

import './PollUI.css';

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
        <div className="poll-container">
            <h4>{localPoll.question}</h4>
            
            <div className="poll-options-list">
                {localPoll.options.map((option) => {
                    const isVotedFor = localPoll.userVoteOptionId === option.id;
                    const isVotingThis = votingId === option.id;

                    return (
                        <button
                            key={option.id}
                            onClick={() => handleVote(option.id)}
                            disabled={!!votingId}
                            className={`poll-option-button ${isVotedFor ? 'voted' : ''}`}
                        >
                            {/* Progress bar background */}
                            {localPoll.hasVoted && (
                                <div 
                                    className="poll-progress-bg"
                                    style={{ width: `${option.percentage}%` }} 
                                />
                            )}

                            <span className="poll-option-content">
                                {option.text}
                                {isVotedFor && <span aria-label="Selected" className="poll-check">✓</span>}
                                {isVotingThis && <span className="animate-pulse">...</span>}
                            </span>

                            {localPoll.hasVoted && (
                                <div className="poll-stats">
                                    <span className="poll-percentage">
                                        {option.percentage}%
                                    </span>
                                    <span className="poll-vote-count">
                                        {option.votes} {option.votes === 1 ? 'vote' : 'votes'}
                                    </span>
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            <div className="poll-footer">
                <span>Total: {localPoll.totalVotes} {localPoll.totalVotes === 1 ? 'person' : 'people'} voted</span>
                {localPoll.hasVoted && (
                    <span className="poll-recorded-badge">
                        Vote Recorded
                    </span>
                )}
            </div>
        </div>
    );
};

export default PollUI;
