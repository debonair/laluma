import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';

const LocationSettings: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { updateProfile } = useAuth();

    // Get onboarding data from previous screens
    const { motherhoodStage, lookingFor } = location.state || {};

    // Default state or derived from existing user data if available
    const [radius, setRadius] = useState<number>(10);
    const [anywhere, setAnywhere] = useState<boolean>(false);

    const handleRadiusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setRadius(Number(e.target.value));
    };

    const handleAnywhereToggle = () => {
        setAnywhere(!anywhere);
    };

    const handleContinue = async () => {
        try {
            // Save ALL onboarding data including motherhood stage and looking for
            await updateProfile({
                motherhoodStage,
                lookingFor,
                location: {
                    radius,
                    anywhere
                },
                hasCompletedOnboarding: true
            });
            navigate('/');
        } catch (error) {
            console.error('Failed to save onboarding data:', error);
            // Still navigate even if there's an error
            navigate('/');
        }
    };

    return (
        <div className="page-container">
            <Header 
                title="Your Connections" 
                subtitle="Where do you want to connect?"
                showBack={true}
                onBack={() => navigate(-1)}
            />
            <main className="page-content">

                <div className="card" style={{ animation: 'slideUpFade 0.4s ease-out forwards' }}>
                    <div style={{ marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <label style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Distance Radius</label>
                            <span style={{ color: 'var(--primary-color)', fontWeight: 700, fontSize: '1.1rem' }}>
                                {anywhere ? 'Anywhere' : `${radius} km`}
                            </span>
                        </div>

                        <input
                            type="range"
                            min="1"
                            max="100"
                            value={radius}
                            onChange={handleRadiusChange}
                            disabled={anywhere}
                            className="input-field"
                            style={{
                                width: '100%',
                                padding: '0',
                                height: '6px',
                                background: 'rgba(0,0,0,0.05)',
                                borderRadius: '3px',
                                appearance: 'none',
                                opacity: anywhere ? 0.4 : 1,
                                cursor: anywhere ? 'not-allowed' : 'pointer'
                            }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.75rem', fontWeight: 500 }}>
                            <span>1km</span>
                            <span>100km</span>
                        </div>
                    </div>

                    <div
                        onClick={handleAnywhereToggle}
                        className={`card ${anywhere ? 'active' : ''}`}
                        style={{ 
                            cursor: 'pointer', 
                            display: 'flex', 
                            gap: '1rem', 
                            padding: '1.25rem',
                            border: anywhere ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                            backgroundColor: anywhere ? 'var(--primary-light)' : 'transparent',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <div style={{ 
                            width: '24px', 
                            height: '24px', 
                            borderRadius: '50%', 
                            border: '2px solid var(--primary-color)', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            backgroundColor: '#fff'
                        }}>
                            {anywhere && <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--primary-color)' }} />}
                        </div>
                        <div>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>Connect with people from anywhere</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>I'm open to long-distance connections</div>
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: 'auto', width: '100%', paddingTop: '2rem' }}>
                    <button
                        className="btn-primary"
                        onClick={handleContinue}
                    >
                        Continue
                    </button>
                </div>
            </main>
        </div>
    );
};

export default LocationSettings;
