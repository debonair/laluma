import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService, type UserSearchResult, type UserNearbyResult } from '../services/user.service';
import BottomNav from '../components/BottomNav';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { SERVER_URL } from '../services/api';
import './Search.css';

const Search: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'search' | 'nearby'>('search');

    // Search Tab State
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<UserSearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    // Nearby Tab State
    const [nearbyUsers, setNearbyUsers] = useState<UserNearbyResult[]>([]);
    const [isLoadingNearby, setIsLoadingNearby] = useState(false);
    const [isLocating, setIsLocating] = useState(false);

    const { user } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();
    const [locationShared, setLocationShared] = useState(false);

    // Debounced search effect
    useEffect(() => {
        if (activeTab !== 'search') return;

        const delayDebounceFn = setTimeout(async () => {
            if (query.trim().length === 0) {
                setResults([]);
                setHasSearched(false);
                setIsSearching(false);
                return;
            }

            setIsSearching(true);
            try {
                const users = await userService.searchUsers(query);
                setResults(users);
                setHasSearched(true);
            } catch (error) {
                console.error('Failed to search users:', error);
            } finally {
                setIsSearching(false);
            }
        }, 500); // 500ms debounce

        return () => clearTimeout(delayDebounceFn);
    }, [query, activeTab]);

    const fetchNearbyUsers = async () => {
        setIsLoadingNearby(true);
        try {
            const users = await userService.getNearbyUsers();
            setNearbyUsers(users);
        } catch (error) {
            console.error('Failed to fetch nearby users', error);
        } finally {
            setIsLoadingNearby(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'nearby') {
            fetchNearbyUsers();
        }
    }, [activeTab]);

    const handleShareLocation = () => {
        if (!navigator.geolocation) {
            addToast('Geolocation is not supported by your browser', 'error');
            setIsLocating(false);
            return;
        }
        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    await userService.updateCurrentUser({
                        location: { latitude, longitude, radius: 50 }
                    });
                    setLocationShared(true);
                    await fetchNearbyUsers();
                } catch (err) {
                    console.error('Failed to update location preferences:', err);
                    addToast('Failed to save your location.', 'error');
                } finally {
                    setIsLocating(false);
                }
            },
            (error) => {
                console.error('Geolocation error:', error);
                addToast('Unable to retrieve your location. Please check your browser permissions.', 'error');
                setIsLocating(false);
            }
        );
    };

    const hasLocationConfigured = locationShared;

    return (
        <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--bg-color)' }}>
            <Header 
                title="Discover" 
                subtitle={activeTab === 'search' ? "Find other mothers by name" : "Moms in your community"}
            >
                <div style={{ padding: '0 1rem 1rem' }}>
                    <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '1rem' }}>
                        <button
                            onClick={() => setActiveTab('search')}
                            style={{
                                flex: 1,
                                padding: '0.75rem',
                                background: 'none',
                                border: 'none',
                                borderBottom: activeTab === 'search' ? '2px solid var(--primary-color)' : '2px solid transparent',
                                color: activeTab === 'search' ? 'var(--primary-color)' : 'var(--text-secondary)',
                                fontWeight: activeTab === 'search' ? 600 : 400,
                                cursor: 'pointer'
                            }}
                        >
                            Search Name
                        </button>
                        <button
                            onClick={() => setActiveTab('nearby')}
                            style={{
                                flex: 1,
                                padding: '0.75rem',
                                background: 'none',
                                border: 'none',
                                borderBottom: activeTab === 'nearby' ? '2px solid var(--primary-color)' : '2px solid transparent',
                                color: activeTab === 'nearby' ? 'var(--primary-color)' : 'var(--text-secondary)',
                                fontWeight: activeTab === 'nearby' ? 600 : 400,
                                cursor: 'pointer'
                            }}
                        >
                            Moms Near Me
                        </button>
                    </div>

                    {activeTab === 'search' && (
                        <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '12px', fontSize: '1.2rem' }}>🔍</div>
                            <input
                                type="search"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search by name or username..."
                                style={{
                                    width: '100%',
                                    padding: '0.75rem 1rem 0.75rem 40px',
                                    borderRadius: '12px',
                                    border: '1px solid var(--border-color)',
                                    backgroundColor: 'var(--card-bg)',
                                    fontSize: '1rem',
                                    color: 'var(--text-primary)',
                                    outline: 'none',
                                    transition: 'border-color 0.2s, box-shadow 0.2s',
                                }}
                            />
                        </div>
                    )}
                </div>
            </Header>

            <main className="page-content" style={{ padding: 0, flex: 1, overflowY: 'auto' }}>
                <div style={{ padding: '0 1rem' }}>

                    {activeTab === 'search' && (
                        <>
                            {isSearching ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingTop: '1rem' }}>
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="skeleton" style={{ height: '84px', width: '100%', borderRadius: '12px', border: '1px solid var(--border-color)' }}></div>
                                    ))}
                                </div>
                            ) : hasSearched && results.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                                    <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>🤷‍♀️</div>
                                    <h3 style={{ marginBottom: '0.5rem' }}>No mothers found</h3>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                        Try searching for a different name.
                                    </p>
                                </div>
                            ) : (
                                <div style={{ paddingTop: '1rem' }}>
                                    {results.map(resultUser => {
                                        if (resultUser.id === user?.id) return null;
                                        return renderUserCard(resultUser, navigate);
                                    })}
                                </div>
                            )}
                        </>
                    )}

                    {activeTab === 'nearby' && (
                        <div style={{ paddingTop: '1rem' }}>
                            {!hasLocationConfigured ? (
                                <div style={{ textAlign: 'center', padding: '3rem 1rem', backgroundColor: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📍</div>
                                    <h3 style={{ marginBottom: '1rem' }}>Find Moms Locally</h3>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>
                                        Share your location securely to discover and connect with other mothers right in your area.
                                    </p>
                                    <button
                                        onClick={handleShareLocation}
                                        disabled={isLocating}
                                        style={{
                                            padding: '0.75rem 1.5rem',
                                            backgroundColor: 'var(--primary-color)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            fontWeight: 600,
                                            cursor: isLocating ? 'not-allowed' : 'pointer',
                                            opacity: isLocating ? 0.7 : 1
                                        }}
                                    >
                                        {isLocating ? 'Locating...' : 'Share My Location'}
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {isLoadingNearby ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            {[1, 2, 3, 4].map(i => (
                                                <div key={i} className="skeleton" style={{ height: '84px', width: '100%', borderRadius: '12px', border: '1px solid var(--border-color)' }}></div>
                                            ))}
                                        </div>
                                    ) : nearbyUsers.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                                            <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>🌍</div>
                                            <h3 style={{ marginBottom: '0.5rem' }}>No moms nearby yet</h3>
                                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                                                Check back later as more mothers join Luma in your area.
                                            </p>
                                            <button onClick={handleShareLocation} style={{ background: 'none', border: 'none', color: 'var(--primary-color)', textDecoration: 'underline', cursor: 'pointer' }}>
                                                Update my location again
                                            </button>
                                        </div>
                                    ) : (
                                        <div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                                <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Moms within 50km</h3>
                                                <button onClick={handleShareLocation} style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontSize: '0.85rem', cursor: 'pointer' }}>
                                                    ↻ Refresh Location
                                                </button>
                                            </div>

                                            {nearbyUsers.map(resultUser => {
                                                if (resultUser.id === user?.id) return null;
                                                return renderUserCard(resultUser, navigate, resultUser.distance_km);
                                            })}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                </div>
            </main>

            <BottomNav />
        </div>
    );
};

// Extracted card renderer to reuse across both tabs
const renderUserCard = (resultUser: UserSearchResult | UserNearbyResult, navigate: ReturnType<typeof useNavigate>, distanceKm?: number) => {
    return (
        <div
            key={resultUser.id}
            onClick={() => navigate(`/users/${resultUser.id}`)}
            style={{
                display: 'flex',
                alignItems: 'center',
                padding: '1rem',
                marginBottom: '0.5rem',
                borderRadius: '12px',
                backgroundColor: 'var(--card-bg)',
                border: '1px solid var(--border-color)',
                cursor: 'pointer',
                transition: 'transform 0.1s, box-shadow 0.1s',
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
            <div 
                className="search-user-avatar" 
                style={{ 
                    backgroundImage: resultUser.profile_image_url 
                        ? `url(${resultUser.profile_image_url.startsWith('/') ? SERVER_URL + resultUser.profile_image_url : resultUser.profile_image_url})` 
                        : 'none' 
                }}
            >
                {!resultUser.profile_image_url && (resultUser.display_name || resultUser.username).charAt(0).toUpperCase()}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
                <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center' }}>
                    {resultUser.display_name || resultUser.username}
                    {distanceKm !== undefined && (
                        <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 400 }}>
                            📍 {distanceKm}km
                        </span>
                    )}
                </h4>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    @{resultUser.username}
                    {resultUser.motherhood_stage && (
                        <span style={{ marginLeft: '0.5rem', padding: '2px 6px', backgroundColor: 'var(--primary-light)', color: 'var(--primary-dark)', borderRadius: '12px', fontSize: '0.75rem' }}>
                            {resultUser.motherhood_stage}
                        </span>
                    )}
                </p>
            </div>

            <div style={{ color: 'var(--primary-color)', marginLeft: '1rem' }}>
                ›
            </div>
        </div>
    );
}

export default Search;
