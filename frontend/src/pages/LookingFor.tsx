import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const LookingFor: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const motherhoodStage = location.state?.motherhoodStage;
    const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

    const options = [
        "Friendship & Connection",
        "Emotional Support",
        "Parenting advice",
        "Local Meetup",
        "Online Community",
        "Just browsing for now"
    ];

    const handleSelect = (option: string) => {
        if (selectedOptions.includes(option)) {
            setSelectedOptions(selectedOptions.filter(item => item !== option));
        } else {
            setSelectedOptions([...selectedOptions, option]);
        }
    };

    const handleContinue = () => {
        if (selectedOptions.length > 0) {
            // Pass both motherhood stage and looking for to next screen
            navigate('/location-settings', {
                state: {
                    motherhoodStage,
                    lookingFor: selectedOptions
                }
            });
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>What are you looking for?</h1>
            </div>
            <main className="page-content">
                <p className="auth-subtitle">
                    Select all that apply
                </p>

                <div className="choice-list">
                    {options.map((option) => (
                        <div
                            key={option}
                            className={`choice-item ${selectedOptions.includes(option) ? 'selected' : ''}`}
                            onClick={() => handleSelect(option)}
                        >
                            {option}
                        </div>
                    ))}
                </div>

                <div style={{ marginTop: 'auto' }}>
                    <button
                        className="btn-primary"
                        onClick={handleContinue}
                        disabled={selectedOptions.length === 0}
                    >
                        Continue
                    </button>
                </div>
            </main>
        </div>
    );
};

export default LookingFor;
