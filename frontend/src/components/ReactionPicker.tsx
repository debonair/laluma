import React from 'react';
import './ReactionPicker.css';

interface ReactionPickerProps {
    onSelect: (type: string) => void;
    onClose: () => void;
}

const REACTIONS = [
    { type: 'like', emoji: '❤️', label: 'Like' },
    { type: 'love', emoji: '😍', label: 'Love' },
    { type: 'haha', emoji: '😂', label: 'Haha' },
    { type: 'wow', emoji: '😲', label: 'Wow' },
    { type: 'sad', emoji: '😢', label: 'Sad' },
    { type: 'angry', emoji: '😡', label: 'Angry' },
];

const ReactionPicker: React.FC<ReactionPickerProps> = ({ onSelect, onClose }) => {
    return (
        <div className="reaction-picker-container" onClick={(e) => e.stopPropagation()}>
            {REACTIONS.map((reaction) => (
                <button
                    key={reaction.type}
                    className="reaction-option"
                    onClick={() => {
                        onSelect(reaction.type);
                        onClose();
                    }}
                    title={reaction.label}
                >
                    <span className="reaction-emoji">{reaction.emoji}</span>
                </button>
            ))}
        </div>
    );
};

export default ReactionPicker;
