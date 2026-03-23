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
import CrisisSignpost from '../components/CrisisSignpost';

import './Discover.css';

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
                    await fetchDiscoverData(latitude, longitude, 50);
                } catch (err) {
                    console.error('Failed to update location', err);
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

    const initiateChat = (recipientId: string) => {
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
                    <div className="card discover-location-prompt">
                        <div className="discover-location-icon">📍</div>
                        <h2>Find Moms Locally</h2>
                        <p>
                            Share your location securely to discover and connect with other mothers right in your area. We use this to show you relevant profiles nearby.
                        </p>
                        <button
                            onClick={handleShareLocation}
                            disabled={isLocating}
                            className="btn-primary discover-enable-location-btn"
                        >
                            {isLocating ? 'Locating...' : 'Enable Location'}
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="discover-section-header">
                            <p className="discover-section-title">Moms near you</p>
                            <button onClick={handleShareLocation} className="update-location-btn">
                                Update Location
                            </button>
                        </div>

                        {isLoading ? (
                            <div className="discover-skeleton-container">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="skeleton discover-skeleton-item"></div>
                                ))}
                            </div>
                        ) : (
                            <>
                                {pendingRequests.length > 0 && (
                                    <div className="incoming-waves">
                                        <h2>Incoming Waves 👋</h2>
                                        <div className="request-list">
                                            {pendingRequests.map(req => (
                                                <div key={req.id} className="card request-card">
                                                    <div className="requester-info" onClick={() => navigate(`/users/${req.requesterId}`)}>
                                                        <div 
                                                            className="requester-avatar" 
                                                            style={{ '--avatar-url': req.requester.profileImageUrl ? `url(${req.requester.profileImageUrl.startsWith('/') ? SERVER_URL + req.requester.profileImageUrl : req.requester.profileImageUrl})` : 'none' } as React.CSSProperties}
                                                        >
                                                            {!req.requester.profileImageUrl && (req.requester.displayName || req.requester.username || 'U').charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className="requester-name">
                                                                {req.requester.displayName || req.requester.username}
                                                                {req.requester.isVerified && <BadgeCheck className="verified-icon-small" />}
                                                            </div>
                                                            <div className="text-small">wants to connect</div>
                                                        </div>
                                                    </div>
                                                    <div className="request-actions">
                                                        <button onClick={() => handleRespondRequest(req.id, 'declined')} className="btn-ghost request-btn">Ignore</button>
                                                        <button onClick={() => handleRespondRequest(req.id, 'accepted')} className="btn-primary request-btn">Wave Back</button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {(discoverContent.events.length > 0 || discoverContent.promotions.length > 0) && (
                                    <div className="discover-events-section">
                                        <div className="discover-section-header">
                                            <h2 className="discover-events-title">Local Events & Promos</h2>
                                        </div>
                                        <div className="discover-horizontal-scroll">
                                            {discoverContent.events.map(event => (
                                                <div
                                                    key={event.id}
                                                    className="scroll-item event-item"
                                                    onClick={() => navigate(`/content/${event.id}`)}
                                                >
                                                    <span className="item-label event-label">📅 EVENT</span>
                                                    <h3 className="item-title">{event.title}</h3>
                                                    {event.eventDate && (
                                                        <div className="item-date">
                                                            {new Date(event.eventDate).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                                                        </div>
                                                    )}
                                                    {event.eventLocation && (
                                                        <div className="item-location">
                                                            📍 {event.eventLocation}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                            {discoverContent.promotions.map(promo => (
                                                <div
                                                    key={promo.id}
                                                    className="scroll-item promo-item"
                                                    onClick={() => navigate(`/content/${promo.id}`)}
                                                >
                                                    <span className="item-label promo-label">🏷️ PROMO</span>
                                                    <h3 className="item-title">{promo.title}</h3>
                                                    {promo.discountValue && (
                                                        <div className="promo-value">
                                                            {promo.discountValue}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <CrisisSignpost />

                                {nearbyUsers.length === 0 ? (
                                    <div className="no-moms-nearby">
                                        <div className="no-moms-icon">🌍</div>
                                        <h3>No moms nearby yet</h3>
                                        <p className="no-moms-text">
                                            Check back later as more mothers join Luma in your area.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="nearby-users-list">
                                        {nearbyUsers.map(resultUser => {
                                            if (resultUser.id === user?.id) return null;

                                            const hasImage = !!resultUser.profile_image_url;

                                            return (
                                                <div
                                                    key={resultUser.id}
                                                    className="card user-nearby-card"
                                                    onClick={() => navigate(`/users/${resultUser.id}`)}
                                                >
                                                    <div className="user-card-image" style={{
                                                        backgroundColor: hasImage ? 'transparent' : 'var(--primary-light)',
                                                        '--card-image-url': hasImage ? `url(${resultUser.profile_image_url?.startsWith('/') ? SERVER_URL + resultUser.profile_image_url : resultUser.profile_image_url})` : 'none'
                                                    } as React.CSSProperties}>
                                                        {!hasImage && (
                                                            <span className="user-card-initials">
                                                                {(resultUser.display_name || resultUser.username).charAt(0).toUpperCase()}
                                                            </span>
                                                        )}

                                                        <div className="user-card-overlay">
                                                            <h3 className="user-card-name">
                                                                {resultUser.display_name || resultUser.username}
                                                                {resultUser.isVerified && <BadgeCheck className="verified-icon-medium" />}
                                                            </h3>
                                                            <p className="user-card-distance">
                                                                <MapPin size={14} /> {resultUser.distance_km} km away
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="user-card-details">
                                                        {resultUser.motherhood_stage && (
                                                            <div className="badge user-card-stage-badge">
                                                                {resultUser.motherhood_stage}
                                                            </div>
                                                        )}

                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                initiateChat(resultUser.id);
                                                            }}
                                                            className="btn-secondary user-card-msg-btn"
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
