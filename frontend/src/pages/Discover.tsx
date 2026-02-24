import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService, type UserNearbyResult } from '../services/user.service';
import { contentService } from '../services/content.service';
import type { Content } from '../types/content';
import BottomNav from '../components/BottomNav';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { MessageCircle, MapPin, Search as SearchIcon } from 'lucide-react';

const Discover: React.FC = () => {
    const [nearbyUsers, setNearbyUsers] = useState<UserNearbyResult[]>([]);
    const [discoverContent, setDiscoverContent] = useState<{ promotions: Content[], events: Content[] }>({ promotions: [], events: [] });
    const [isLoading, setIsLoading] = useState(true);
    const [isLocating, setIsLocating] = useState(false);
    const [locationShared, setLocationShared] = useState(false);

    const { user } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();

    const fetchDiscoverData = async (lat?: number, lon?: number, radius?: number) => {
        setIsLoading(true);
        try {
            const [users, content] = await Promise.all([
                userService.getNearbyUsers(),
                contentService.getDiscover({ latitude: lat, longitude: lon, radius })
            ]);
            setNearbyUsers(users);
            setDiscoverContent(content);
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

    return (
        <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: 'var(--bg-color)' }}>
            <header className="page-header" style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', position: 'sticky', top: 0, backgroundColor: 'var(--bg-color)', zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Discover</h1>
                <button onClick={() => navigate('/search')} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: '0.5rem' }}>
                    <SearchIcon size={24} />
                </button>
            </header>

            <main className="page-content" style={{ padding: '1rem', flex: 1, overflowY: 'auto' }}>
                {!locationShared ? (
                    <div style={{ textAlign: 'center', padding: '3rem 1rem', backgroundColor: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--border-color)', marginTop: '2rem' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📍</div>
                        <h3 style={{ marginBottom: '1rem', fontSize: '1.5rem', fontWeight: 700 }}>Find Moms Locally</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: '2rem', lineHeight: 1.5 }}>
                            Share your location securely to discover and connect with other mothers right in your area. We use this to show you relevant profiles nearby.
                        </p>
                        <button
                            onClick={handleShareLocation}
                            disabled={isLocating}
                            style={{
                                padding: '1rem 2rem',
                                backgroundColor: 'var(--primary-color)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '100px',
                                fontWeight: 700,
                                fontSize: '1rem',
                                cursor: isLocating ? 'not-allowed' : 'pointer',
                                opacity: isLocating ? 0.7 : 1,
                                width: '100%',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                            }}
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
                                    <div key={i} className="skeleton" style={{ height: '300px', width: '100%', border: '4px solid #000' }}></div>
                                ))}
                            </div>
                        ) : (
                            <>
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
                                            margin: '0 -1rem',
                                            padding: '0 1rem 1rem 1rem',
                                            scrollSnapType: 'x mandatory',
                                            WebkitOverflowScrolling: 'touch'
                                        }}>
                                            {discoverContent.events.map(event => (
                                                <div
                                                    key={event.id}
                                                    onClick={() => navigate(`/content/${event.id}`)}
                                                    style={{
                                                        minWidth: '280px',
                                                        backgroundColor: 'var(--card-bg)',
                                                        border: '4px solid #000',
                                                        padding: '1rem',
                                                        boxShadow: '4px 4px 0px 0px #000',
                                                        scrollSnapAlign: 'start',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        gap: '0.5rem',
                                                        transition: 'transform 0.1s linear, box-shadow 0.1s linear'
                                                    }}
                                                    onMouseDown={(e) => {
                                                        e.currentTarget.style.transform = 'translate(4px, 4px)';
                                                        e.currentTarget.style.boxShadow = '0px 0px 0px 0px #000';
                                                    }}
                                                    onMouseUp={(e) => {
                                                        e.currentTarget.style.transform = 'initial';
                                                        e.currentTarget.style.boxShadow = '4px 4px 0px 0px #000';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.transform = 'initial';
                                                        e.currentTarget.style.boxShadow = '4px 4px 0px 0px #000';
                                                    }}
                                                >
                                                    <span style={{
                                                        backgroundColor: '#FF6B6B',
                                                        color: '#000',
                                                        border: '2px solid #000',
                                                        padding: '0.25rem 0.5rem',
                                                        fontWeight: 800,
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
                                                        backgroundColor: '#FCC419',
                                                        border: '4px solid #000',
                                                        padding: '1rem',
                                                        boxShadow: '4px 4px 0px 0px #000',
                                                        scrollSnapAlign: 'start',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        gap: '0.5rem',
                                                        transition: 'transform 0.1s linear, box-shadow 0.1s linear'
                                                    }}
                                                    onMouseDown={(e) => {
                                                        e.currentTarget.style.transform = 'translate(4px, 4px)';
                                                        e.currentTarget.style.boxShadow = '0px 0px 0px 0px #000';
                                                    }}
                                                    onMouseUp={(e) => {
                                                        e.currentTarget.style.transform = 'initial';
                                                        e.currentTarget.style.boxShadow = '4px 4px 0px 0px #000';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.transform = 'initial';
                                                        e.currentTarget.style.boxShadow = '4px 4px 0px 0px #000';
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
                                                    style={{
                                                        borderRadius: '24px',
                                                        backgroundColor: 'var(--card-bg)',
                                                        border: '1px solid var(--border-color)',
                                                        overflow: 'hidden',
                                                        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                                                        transition: 'transform 0.2s',
                                                        cursor: 'pointer'
                                                    }}
                                                    onClick={() => navigate(`/users/${resultUser.id}`)}
                                                    onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                                                    onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                                >
                                                    <div style={{
                                                        height: '240px',
                                                        width: '100%',
                                                        backgroundColor: hasImage ? 'transparent' : 'var(--primary-light)',
                                                        backgroundImage: hasImage ? `url(http://localhost:3000${resultUser.profile_image_url})` : 'none',
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
                                                            padding: '1rem'
                                                        }}>
                                                            <h3 style={{ margin: 0, color: 'white', fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                {resultUser.display_name || resultUser.username}
                                                            </h3>
                                                            <p style={{ margin: '0.25rem 0 0 0', color: 'rgba(255,255,255,0.9)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                                <MapPin size={14} /> {resultUser.distance_km} km away
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div style={{ padding: '1.25rem', backgroundColor: 'var(--card-bg)' }}>
                                                        {resultUser.motherhood_stage && (
                                                            <div style={{ display: 'inline-block', padding: '0.35rem 0.75rem', backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '100px', fontSize: '0.85rem', fontWeight: 600, marginBottom: '1rem' }}>
                                                                {resultUser.motherhood_stage}
                                                            </div>
                                                        )}

                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                initiateChat(resultUser.id);
                                                            }}
                                                            style={{
                                                                width: '100%',
                                                                padding: '0.85rem',
                                                                backgroundColor: 'var(--bg-color)',
                                                                color: 'var(--primary-color)',
                                                                border: '2px solid var(--primary-color)',
                                                                borderRadius: '100px',
                                                                fontWeight: 700,
                                                                fontSize: '1rem',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                gap: '0.5rem',
                                                                cursor: 'pointer',
                                                                transition: 'background-color 0.2s, color 0.2s'
                                                            }}
                                                            onMouseOver={(e) => {
                                                                e.currentTarget.style.backgroundColor = 'var(--primary-color)';
                                                                e.currentTarget.style.color = 'white';
                                                            }}
                                                            onMouseOut={(e) => {
                                                                e.currentTarget.style.backgroundColor = 'var(--bg-color)';
                                                                e.currentTarget.style.color = 'var(--primary-color)';
                                                            }}
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
