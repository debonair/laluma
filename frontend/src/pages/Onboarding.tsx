import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Onboarding: React.FC = () => {
    const navigate = useNavigate();
    const [selectedOption, setSelectedOption] = useState<string | null>(null);

    const options = [
        "A new mom",
        "A mom of young children",
        "Parenting through the ages",
        "Empty nest mom",
        "Its a mixed bag"
    ];

    const handleSelect = (option: string) => {
        setSelectedOption(option);
    };

    const handleContinue = () => {
        if (selectedOption) {
            // Pass motherhood stage to next screen
            navigate('/looking-for', {
                state: { motherhoodStage: selectedOption }
            });
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Tell us about you</h1>
            </div>
            <main className="page-content">
                <p className="auth-subtitle">
                    I am...
                </p>

                <div className="choice-list">
                    {options.map((option) => (
                        <div
                            key={option}
                            className={`choice-item ${selectedOption === option ? 'selected' : ''}`}
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
                        disabled={!selectedOption}
                    >
                        Continue
                    </button>
                </div>
            </main>
        </div>
    );
};

export default Onboarding;
