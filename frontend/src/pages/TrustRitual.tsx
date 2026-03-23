import React from 'react';
import { useNavigate } from 'react-router-dom';

import './Welcome.css';

const TrustRitual: React.FC = () => {
    const navigate = useNavigate();

    const handleCommit = () => {
        navigate('/onboarding');
    };

    return (
        <div className="page-container with-gradient">
            <main className="welcome-screen">
                <div className="trust-icon">🛡️</div>
                <h1 className="welcome-hero-text">Our Promise to You</h1>
                
                <div className="trust-sections">
                    <section className="trust-section">
                        <h3>Peer-Powered Safety</h3>
                        <p>
                            Luma is a community of mothers watching out for each other. 
                            Our anonymous posts are designed for safe venting, not hiding harmful behavior.
                        </p>
                    </section>

                    <section className="trust-section">
                        <h3>One-Tap Protection</h3>
                        <p>
                            See something that doesn't feel right? Tap 🚩 on any post. 
                            It vanishes from your view instantly and goes to our moderation team.
                        </p>
                    </section>
                </div>

                <div className="trust-commitment-box">
                    <p className="trust-commitment-text">
                        I commit to keeping Luma a supportive and safe haven for all mothers.
                    </p>
                    <button onClick={handleCommit} className="btn-primary">
                        I Commit & Continue
                    </button>
                </div>

                <p className="trust-footer-note">
                    By continuing, you agree to our Community Guidelines.
                </p>
            </main>
        </div>
    );
};

export default TrustRitual;
