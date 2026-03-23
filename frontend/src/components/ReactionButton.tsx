import React, { useState, useRef, useEffect } from 'react';
import ReactionPicker from './ReactionPicker';

interface ReactionButtonProps {
    postId: string;
    isLiked: boolean;
    likesCount: number;
    userReactionType: string | null;
    onReact: (postId: string, reactionType: string) => void;
    onToggleDefault: (postId: string) => void;
}

const ReactionButton: React.FC<ReactionButtonProps> = ({
    postId,
    isLiked,
    likesCount,
    userReactionType,
    onReact,
    onToggleDefault,
}) => {
    const [showPicker, setShowPicker] = useState(false);
    const holdTimeout = useRef<number | null>(null);

    const handleTouchStart = () => {
        holdTimeout.current = setTimeout(() => {
            setShowPicker(true);
        }, 500); // 500ms long press
    };

    const handleTouchEnd = () => {
        if (holdTimeout.current) {
            clearTimeout(holdTimeout.current);
        }
    };

    useEffect(() => {
        return () => {
            if (holdTimeout.current) clearTimeout(holdTimeout.current);
        };
    }, []);

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (showPicker) {
            setShowPicker(false);
        } else {
            onToggleDefault(postId);
        }
    };

    const handleMouseEnter = () => {
        if (!('ontouchstart' in window)) {
            setShowPicker(true);
        }
    };

    const handleMouseLeave = () => {
        if (!('ontouchstart' in window)) {
            setShowPicker(false);
        }
    };

    const emojiDisplay = () => {
        if (!isLiked) return '❤️';
        switch (userReactionType) {
            case 'love': return '😍';
            case 'haha': return '😂';
            case 'wow': return '😲';
            case 'sad': return '😢';
            case 'angry': return '😡';
            default: return '❤️';
        }
    };

    return (
        <div style={{ position: 'relative' }} onMouseLeave={handleMouseLeave}>
            <button
                className="icon-btn"
                onMouseEnter={handleMouseEnter}
                onClick={handleClick}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onContextMenu={(e) => {
                    e.preventDefault();
                    setShowPicker(true);
                }}
                style={{
                    color: isLiked ? 'var(--primary-color)' : 'var(--text-secondary)',
                    background: isLiked ? 'rgba(243, 63, 94, 0.1)' : 'transparent',
                    borderRadius: '50%',
                    padding: '0.5rem',
                    transition: 'all 0.2s ease',
                    transform: isLiked ? 'scale(1.05)' : 'scale(1)',
                }}
            >
                {emojiDisplay()}
                <span style={{ marginLeft: '0.25rem', fontSize: '0.9rem' }}>{likesCount}</span>
            </button>
            {showPicker && (
                <ReactionPicker
                    onSelect={(type) => {
                        onReact(postId, type);
                        setShowPicker(false);
                    }}
                    onClose={() => setShowPicker(false)}
                />
            )}
        </div>
    );
};

export default ReactionButton;
