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

                <div className="content-card" style={{ animation: 'slideUpFade 0.4s ease-out forwards' }}>
                    <div style={{ marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <label style={{ fontWeight: 600 }}>Distance Radius</label>
                            <span style={{ color: 'var(--primary-color)', fontWeight: 700 }}>
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
                            style={{
                                width: '100%',
                                accentColor: 'var(--primary-color)',
                                opacity: anywhere ? 0.5 : 1,
                                cursor: anywhere ? 'not-allowed' : 'pointer'
                            }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-light)', marginTop: '0.5rem' }}>
                            <span>1km</span>
                            <span>100km</span>
                        </div>
                    </div>

                    <div
                        onClick={handleAnywhereToggle}
                        className={`toggle-card ${anywhere ? 'active' : ''}`}
                    >
                        <div className="toggle-radio">
                            {anywhere && <div className="toggle-radio-inner" />}
                        </div>
                        <div className="toggle-content">
                            <span className="toggle-title">Connect with people from anywhere</span>
                            <span className="toggle-subtitle">I'm open to long-distance connections</span>
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
