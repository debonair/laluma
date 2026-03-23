import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';

import './LocationSettings.css';

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

                <div className="card location-settings-card">
                    <div className="location-radius-section">
                        <div className="location-radius-header">
                            <label className="location-radius-label">Distance Radius</label>
                            <span className="location-radius-value">
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
                            className="location-radius-slider"
                        />
                        <div className="location-radius-footer">
                            <span>1km</span>
                            <span>100km</span>
                        </div>
                    </div>

                    <div
                        onClick={handleAnywhereToggle}
                        className={`location-anywhere-toggle ${anywhere ? 'active' : ''}`}
                    >
                        <div className="location-toggle-radio">
                            {anywhere && <div className="location-toggle-radio-inner" />}
                        </div>
                        <div>
                            <div className="location-anywhere-title">Connect with people from anywhere</div>
                            <div className="location-anywhere-desc">I'm open to long-distance connections</div>
                        </div>
                    </div>
                </div>

                <div className="location-footer">
                    <button
                        className="btn-primary w-full"
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
