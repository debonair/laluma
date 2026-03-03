import React, { useState } from 'react';
import BottomNav from '../components/BottomNav';
import { useGroup } from '../context/GroupContext';
import { useNavigate } from 'react-router-dom';

const CreateGroup: React.FC = () => {
    const { createGroup } = useGroup();
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [city, setCity] = useState('');
    const [country, setCountry] = useState('');
    const [latitude, setLatitude] = useState<number | undefined>(undefined);
    const [longitude, setLongitude] = useState<number | undefined>(undefined);
    const [loadingLocation, setLoadingLocation] = useState(false);

    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser');
            return;
        }
        setLoadingLocation(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLatitude(position.coords.latitude);
                setLongitude(position.coords.longitude);
                setLoadingLocation(false);
            },
            () => {
                setError('Unable to retrieve your location');
                setLoadingLocation(false);
            }
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (name && description) {
            setIsSubmitting(true);
            setError(null);
            try {
                await createGroup(name, description, undefined, {
                    city: city || undefined,
                    country: country || undefined,
                    latitude,
                    longitude
                });
                navigate('/groups');
            } catch (err) {
                console.error("Failed to create group:", err);
                const msg = err instanceof Error ? err.message : "Failed to create group. Please try again.";
                setError(msg);
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <button onClick={() => navigate(-1)} className="btn-link" style={{ marginRight: '1rem' }}>
                    ←
                </button>
                <h1>Create New Group</h1>
            </div>

            <main className="page-content">
                <form onSubmit={handleSubmit} className="auth-form">
                    {/* Error */}
                    {error && (
                        <div style={{
                            background: 'rgba(255, 107, 107, 0.1)',
                            border: '1px solid rgba(255, 107, 107, 0.3)',
                            borderRadius: '10px',
                            padding: '0.75rem 1rem',
                            color: '#ff4444',
                            fontSize: '0.9rem',
                            marginBottom: '1.25rem',
                            textAlign: 'center'
                        }}>
                            {error}
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="name">Group Name</label>
                        <input
                            type="text"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            placeholder="e.g. Morning Yoga Moms"
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="description">Description</label>
                        <textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                            rows={4}
                            placeholder="What is this group about?"
                            style={{ width: '100%', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '1rem' }}
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="form-group" style={{ marginBottom: '1.5rem', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '12px', backgroundColor: 'var(--card-bg)', boxShadow: 'var(--shadow-sm)' }}>
                        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>Location (Optional)</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                            Add a location to help local moms find your group.
                        </p>

                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                            <div style={{ flex: 1 }}>
                                <label htmlFor="city" style={{ fontSize: '0.9rem' }}>City</label>
                                <input
                                    type="text"
                                    id="city"
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                    placeholder="e.g. Austin"
                                    disabled={isSubmitting}
                                    style={{ padding: '0.75rem' }}
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label htmlFor="country" style={{ fontSize: '0.9rem' }}>Country</label>
                                <input
                                    type="text"
                                    id="country"
                                    value={country}
                                    onChange={(e) => setCountry(e.target.value)}
                                    placeholder="e.g. US"
                                    disabled={isSubmitting}
                                    style={{ padding: '0.75rem' }}
                                />
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleGetLocation}
                            disabled={loadingLocation || isSubmitting}
                            className={`btn-secondary ${latitude && longitude ? 'active' : ''}`}
                            style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                backgroundColor: latitude && longitude ? '#dcfce7' : undefined,
                                borderColor: latitude && longitude ? '#22c55e' : undefined,
                                color: latitude && longitude ? '#15803d' : undefined,
                            }}
                        >
                            <span>📍</span>
                            {loadingLocation ? 'Detecting...' :
                                (latitude && longitude ? 'Exact Location Pinned ✓' : 'Pin My Exact Coordinates')}
                        </button>
                    </div>

                    <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem' }} disabled={isSubmitting}>
                        {isSubmitting ? 'Creating...' : 'Create Group'}
                    </button>
                </form>
            </main>
            <BottomNav />
        </div>
    );
};

export default CreateGroup;
