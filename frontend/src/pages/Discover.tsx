import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService, type UserNearbyResult } from '../services/user.service';
import { contentService } from '../services/content.service';
import { connectionService, type Connection } from '../services/connection.service';
import type { Content } from '../types/content';
import BottomNav from '../components/BottomNav';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { MessageCircle, MapPin, Search as SearchIcon, BadgeCheck } from 'lucide-react';
import { SERVER_URL } from '../services/api';
import Header from '../components/Header';

const Discover: React.FC = () => {
    const [nearbyUsers, setNearbyUsers] = useState<UserNearbyResult[]>([]);
    const [discoverContent, setDiscoverContent] = useState<{ promotions: Content[], events: Content[] }>({ promotions: [], events: [] });
    const [pendingRequests, setPendingRequests] = useState<Connection[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLocating, setIsLocating] = useState(false);
    const [locationShared, setLocationShared] = useState(false);

    const { user } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();

    const fetchDiscoverData = async (lat?: number, lon?: number, radius?: number) => {
        setIsLoading(true);
        try {
            const [users, content, connections] = await Promise.all([
                userService.getNearbyUsers(),
                contentService.getDiscover({ latitude: lat, longitude: lon, radius }),
                connectionService.getConnections().catch(() => [])
            ]);
            setNearbyUsers(users);
            setDiscoverContent(content);
            const currentUser = await userService.getCurrentUser();
            setPendingRequests((connections || []).filter((c: Connection) => c.status === 'pending' && c.recipientId === currentUser.id));
        } catch (error) {
            console.error('Failed to fetch discover data', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // Assume location is shared if we have nearby users or check user location
        // We'll just try to fetch. If the backend returns empty because of no location, we show the prompt.
        const initFetch = async () => {
            try {
                const currentUser = await userService.getCurrentUser();
                if (currentUser.location && currentUser.location.radius) {
                    setLocationShared(true);
                    fetchDiscoverData(currentUser.location.latitude, currentUser.location.longitude, currentUser.location.radius);
                } else {
                    fetchDiscoverData();
                }
            } catch (error) {
                console.error('Failed to init profile:', error);
                setIsLoading(false);
            }
        };
        initFetch();
    }, []);

    const handleShareLocation = () => {
        if (!navigator.geolocation) {
            addToast('Geolocation is not supported by your browser', 'error');
            setIsLocating(false); // Corrected from setIsLoadingLocation
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
                    await fetchDiscoverData(latitude, longitude, 50);
                } catch (err) { // Changed 'error' to 'err'
                    console.error('Failed to update location', err);
                    addToast('Failed to save your location.', 'error');
                } finally {
                    setIsLocating(false);
                }
            },
            (error) => {
                console.error('Geolocation error:', error);
                addToast('Unable to retrieve your location. Please check your browser permissions.', 'error');
                setIsLocating(false); // Corrected from setIsLoadingLocation
            }
        );
    };

    const initiateChat = (recipientId: string) => {
        // Our existing messages framework will automatically create a conversation if we send a message
        // But we want to navigate directly to the conversation view. We don't have a specific endpoint to just 'get or create' without sending right now, 
        // Wait, ConversationDetail fetches history by userId or conversationId? Let's navigate to /users/:id so they can view profile and then chat, 
        // OR we can just add a handler here or in ConversationDetail.
        // Easiest is to navigate to their public profile, which should have a Message button too. Let's just navigate to messages for now, but we need a conversation ID.
        // Actually, let's navigate to their profile, where they can initiate a connection.
        navigate(`/users/${recipientId}`);
    };

    const handleRespondRequest = async (connectionId: string, status: 'accepted' | 'declined') => {
        try {
            await connectionService.respondToRequest(connectionId, status);
            setPendingRequests(prev => prev.filter(c => c.id !== connectionId));
            addToast(`Request ${status}`, 'success');
        } catch (err: any) {
            addToast(err.response?.data?.error || 'Failed to respond', 'error');
        }
    };

    return (
        <div className="page-container">
            <Header 
                title="Discover" 
                subtitle="Connect with moms in your area"
                rightAction={
                    <button 
                        onClick={() => navigate('/search')} 
                        className="icon-btn"
                        title="Search"
                    >
                        <SearchIcon size={24} />
                    </button>
                }
            />

            <main className="page-content">
                {!locationShared ? (
                    <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem', marginTop: '2rem' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📍</div>
                        <h2>Find Moms Locally</h2>
                        <p>
                            Share your location securely to discover and connect with other mothers right in your area. We use this to show you relevant profiles nearby.
                        </p>
                        <button
                            onClick={handleShareLocation}
                            disabled={isLocating}
                            className="btn-primary"
                            style={{ width: '100%', marginTop: '1.5rem' }}
                        >
                            {isLocating ? 'Locating...' : 'Enable Location'}
                        </button>
                    </div>
                ) : (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <p style={{ margin: 0, color: 'var(--text-secondary)', fontWeight: 500 }}>Moms near you</p>
                            <button onClick={handleShareLocation} style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 600 }}>
                                Update Location
                            </button>
                        </div>

                        {isLoading ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="skeleton" style={{ height: '300px', width: '100%', borderRadius: '16px' }}></div>
                                ))}
                            </div>
                        ) : (
                            <>
                                {/* Pending Connection Requests */}
                                {pendingRequests.length > 0 && (
                                    <div style={{ marginBottom: '2rem' }}>
                                        <h2>Incoming Waves 👋</h2>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                            {pendingRequests.map(req => (
                                                <div key={req.id} className="card" style={{
                                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                    padding: '1rem'
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => navigate(`/users/${req.requesterId}`)}>
                                                        <div style={{
                                                            width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--primary-light)',
                                                            backgroundImage: req.requester.profileImageUrl ? `url(${SERVER_URL}${req.requester.profileImageUrl})` : 'none',
                                                            backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--primary-color)'
                                                        }}>
                                                            {!req.requester.profileImageUrl && (req.requester.displayName || req.requester.username || 'U').charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                {req.requester.displayName || req.requester.username}
                                                                {req.requester.isVerified && <BadgeCheck style={{ width: '1rem', height: '1rem', color: 'var(--info-color)' }} />}
                                                            </div>
                                                            <div className="text-small">wants to connect</div>
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        <button onClick={() => handleRespondRequest(req.id, 'declined')} className="btn-ghost" style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}>Ignore</button>
                                                        <button onClick={() => handleRespondRequest(req.id, 'accepted')} className="btn-primary" style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}>Wave Back</button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Local Events & Promos Section */}
                                {(discoverContent.events.length > 0 || discoverContent.promotions.length > 0) && (
                                    <div style={{ marginBottom: '2rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Local Events & Promos</h2>
                                        </div>
                                        <div style={{
                                            display: 'flex',
                                            gap: '1rem',
                                            overflowX: 'auto',
                                            paddingBottom: '1rem',
                                            margin: '0 -1.5rem',
                                            padding: '0 1.5rem 1rem 1.5rem',
                                            scrollSnapType: 'x mandatory',
                                            WebkitOverflowScrolling: 'touch',
                                            maxWidth: '100vw'
                                        }}>
                                            {discoverContent.events.map(event => (
                                                <div
                                                    key={event.id}
                                                    onClick={() => navigate(`/content/${event.id}`)}
                                                    style={{
                                                        minWidth: '280px',
                                                        backgroundColor: 'var(--card-bg)',
                                                        border: '1px solid var(--border-color)',
                                                        padding: '1rem',
                                                        boxShadow: 'var(--shadow-sm)',
                                                        borderRadius: '16px',
                                                        scrollSnapAlign: 'start',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        gap: '0.5rem',
                                                        transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                                                    }}
                                                    onMouseDown={(e) => {
                                                        e.currentTarget.style.transform = 'translateY(1px)';
                                                        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                                                    }}
                                                    onMouseUp={(e) => {
                                                        e.currentTarget.style.transform = 'initial';
                                                        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.transform = 'initial';
                                                        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                                                    }}
                                                >
                                                    <span style={{
                                                        backgroundColor: 'var(--primary-color)',
                                                        color: 'white',
                                                        border: 'none',
                                                        padding: '0.25rem 0.5rem',
                                                        fontWeight: 600,
                                                        fontSize: '0.75rem',
                                                        display: 'inline-block',
                                                        alignSelf: 'flex-start'
                                                    }}>📅 EVENT</span>
                                                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, fontFamily: 'Syne, sans-serif' }}>{event.title}</h3>
                                                    {event.eventDate && (
                                                        <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                                                            {new Date(event.eventDate).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                                                        </div>
                                                    )}
                                                    {event.eventLocation && (
                                                        <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                                                            📍 {event.eventLocation}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                            {discoverContent.promotions.map(promo => (
                                                <div
                                                    key={promo.id}
                                                    onClick={() => navigate(`/content/${promo.id}`)}
                                                    style={{
                                                        minWidth: '280px',
                                                        backgroundColor: 'var(--gold-color)',
                                                        border: '1px solid var(--border-color)',
                                                        padding: '1rem',
                                                        boxShadow: 'var(--shadow-sm)',
                                                        borderRadius: '16px',
                                                        scrollSnapAlign: 'start',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        gap: '0.5rem',
                                                        color: 'white',
                                                        transition: 'transform 0.1s linear, box-shadow 0.1s linear'
                                                    }}
                                                    onMouseDown={(e) => {
                                                        e.currentTarget.style.transform = 'translateY(1px)';
                                                        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                                                    }}
                                                    onMouseUp={(e) => {
                                                        e.currentTarget.style.transform = 'initial';
                                                        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.transform = 'initial';
                                                        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                                                    }}
                                                >
                                                    <span style={{
                                                        backgroundColor: '#000',
                                                        color: 'white',
                                                        padding: '0.25rem 0.5rem',
                                                        fontWeight: 800,
                                                        fontSize: '0.75rem',
                                                        display: 'inline-block',
                                                        alignSelf: 'flex-start'
                                                    }}>🏷️ PROMO</span>
                                                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, fontFamily: 'Syne, sans-serif' }}>{promo.title}</h3>
                                                    {promo.discountValue && (
                                                        <div style={{ fontSize: '1.5rem', fontFamily: 'Syne, sans-serif', fontWeight: 800, margin: '0.5rem 0' }}>
                                                            {promo.discountValue}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {nearbyUsers.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '3rem 1rem', marginTop: '2rem' }}>
                                        <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>🌍</div>
                                        <h3 style={{ marginBottom: '0.5rem', fontSize: '1.25rem' }}>No moms nearby yet</h3>
                                        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: '1rem' }}>
                                            Check back later as more mothers join Luma in your area.
                                        </p>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '2rem' }}>
                                        {nearbyUsers.map(resultUser => {
                                            if (resultUser.id === user?.id) return null;

                                            const hasImage = !!resultUser.profile_image_url;

                                            return (
                                                <div
                                                    key={resultUser.id}
                                                    className="card"
                                                    style={{ overflow: 'hidden', padding: 0 }}
                                                    onClick={() => navigate(`/users/${resultUser.id}`)}
                                                >
                                                    <div style={{
                                                        height: '240px',
                                                        width: '100%',
                                                        backgroundColor: hasImage ? 'transparent' : 'var(--primary-light)',
                                                        backgroundImage: hasImage ? `url(${SERVER_URL}${resultUser.profile_image_url})` : 'none',
                                                        backgroundSize: 'cover',
                                                        backgroundPosition: 'center',
                                                        position: 'relative',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}>
                                                        {!hasImage && (
                                                            <span style={{ fontSize: '5rem', color: 'var(--primary-color)', fontWeight: 'bold' }}>
                                                                {(resultUser.display_name || resultUser.username).charAt(0).toUpperCase()}
                                                            </span>
                                                        )}

                                                        {/* Gradient overlay for text */}
                                                        <div style={{
                                                            position: 'absolute',
                                                            bottom: 0,
                                                            left: 0,
                                                            right: 0,
                                                            height: '100px',
                                                            background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 100%)',
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            justifyContent: 'flex-end',
                                                            padding: '1.25rem'
                                                        }}>
                                                            <h3 style={{ margin: 0, color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                {resultUser.display_name || resultUser.username}
                                                                {resultUser.isVerified && <BadgeCheck style={{ width: '1.25rem', height: '1.25rem', color: 'var(--accent-color)' }} />}
                                                            </h3>
                                                            <p style={{ margin: '0.25rem 0 0 0', color: 'rgba(255,255,255,0.9)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                                <MapPin size={14} /> {resultUser.distance_km} km away
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div style={{ padding: '1.25rem' }}>
                                                        {resultUser.motherhood_stage && (
                                                            <div className="badge" style={{ marginBottom: '1rem' }}>
                                                                {resultUser.motherhood_stage}
                                                            </div>
                                                        )}

                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                initiateChat(resultUser.id);
                                                            }}
                                                            className="btn-secondary"
                                                            style={{ width: '100%' }}
                                                        >
                                                            <MessageCircle size={20} />
                                                            View Profile & Message
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}
            </main>
            <BottomNav />
        </div>
    );
};

export default Discover;
