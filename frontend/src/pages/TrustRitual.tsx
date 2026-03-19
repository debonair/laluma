import React from 'react';
import { useNavigate } from 'react-router-dom';

const TrustRitual: React.FC = () => {
    const navigate = useNavigate();

    const handleCommit = () => {
        navigate('/onboarding');
    };

    return (
        <div className="page-container with-gradient">
            <main className="page-content" style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                textAlign: 'center',
                padding: '2rem'
            }}>
                <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🛡️</div>
                <h1 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Our Promise to You</h1>
                
                <div style={{ 
                    maxWidth: '400px', 
                    marginBottom: '2.5rem', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '1.5rem' 
                }}>
                    <section>
                        <h3 style={{ color: 'var(--primary-color)', marginBottom: '0.5rem' }}>Peer-Powered Safety</h3>
                        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                            Luma is a community of mothers watching out for each other. 
                            Our anonymous posts are designed for safe venting, not hiding harmful behavior.
                        </p>
                    </section>

                    <section>
                        <h3 style={{ color: 'var(--primary-color)', marginBottom: '0.5rem' }}>One-Tap Protection</h3>
                        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                            See something that doesn't feel right? Tap 🚩 on any post. 
                            It vanishes from your view instantly and goes to our moderation team.
                        </p>
                    </section>
                </div>

                <div style={{ 
                    background: 'rgba(255, 255, 255, 0.1)', 
                    padding: '1.5rem', 
                    borderRadius: '1rem', 
                    marginBottom: '2rem',
                    border: '1px solid var(--border-color)'
                }}>
                    <p style={{ fontWeight: 600, marginBottom: '1rem' }}>
                        I commit to keeping Luma a supportive and safe haven for all mothers.
                    </p>
                    <button onClick={handleCommit} className="btn-primary" style={{ width: '100%' }}>
                        I Commit & Continue
                    </button>
                </div>

                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    By continuing, you agree to our Community Guidelines.
                </p>
            </main>
        </div>
    );
};

export default TrustRitual;
