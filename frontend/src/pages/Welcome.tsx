import React from 'react';
import { useNavigate } from 'react-router-dom';

import './Welcome.css';

const Welcome: React.FC = () => {
    const navigate = useNavigate();

    const handleNext = () => {
        navigate('/trust-ritual');
    };

    return (
        <div className="page-container with-gradient">
            <main className="welcome-screen">
                <h1 className="welcome-hero-text">
                    A safe, supportive space for mothers to join you on your journey.
                </h1>
                <p className="welcome-subtext">
                    You don’t have to do motherhood alone.
                </p>
                <button onClick={handleNext} className="btn-primary">
                    Continue
                </button>
            </main>
        </div>
    );
};

export default Welcome;
