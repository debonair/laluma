/**
 * EventDetail - Event Details Page (Story 7.3)
 * 
 * Shows full event information with registration status
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import Header from '../components/Header';
import { getEventDetails, registerForEvent, type EventDetails } from '../services/event.service';

import './EventDetail.css';

const EventDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [event, setEvent] = useState<EventDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [registering, setRegistering] = useState(false);

    useEffect(() => {
        const loadEvent = async () => {
            if (!id) return;

            try {
                setLoading(true);
                const data = await getEventDetails(id);
                setEvent(data);
            } catch (err) {
                console.error('Failed to load event:', err);
                setError('Failed to load event details');
            } finally {
                setLoading(false);
            }
        };

        loadEvent();
    }, [id]);

    const formatDateTime = (dateStr: string) => {
        if (!dateStr) return 'Date TBD';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return 'Invalid date';
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        });
    };

    if (loading) {
        return (
            <div className="event-detail-page">
                <Header title="Loading..." showBack={true} />
                <main className="loading-container">
                    <p>Loading event...</p>
                </main>
                <BottomNav />
            </div>
        );
    }

    if (error || !event) {
        return (
            <div className="event-detail-page">
                <Header title="Error" showBack={true} onBack={() => navigate('/spaces')} />
                <main className="error-container">
                    <p className="error-text">{error || 'Event not found'}</p>
                    <button
                        onClick={() => navigate('/spaces')}
                        className="btn-primary"
                        style={{ padding: '0.75rem 1.5rem' }}
                    >
                        Back to Luma Spaces
                    </button>
                </main>
                <BottomNav />
            </div>
        );
    }

    const isFull = event.registeredCount >= event.capacity;
    const isPast = new Date(event.startTime) < new Date();

    return (
        <div className="event-detail-page">
            <Header 
                title={event.title} 
                showBack={true}
                onBack={() => navigate('/spaces')}
            >
                {/* Registration Status Badge */}
                {event.isRegistered && (
                    <div className={`registration-status ${event.registrationStatus === 'waitlisted' ? 'waitlisted' : 'registered'}`}>
                        {event.registrationStatus === 'waitlisted' 
                            ? `⏳ Waitlisted${event.waitlistPosition ? ` (Pos: ${event.waitlistPosition})` : ''}` 
                            : '✓ You\'re Registered'}
                    </div>
                )}
            </Header>

            <main className="event-detail-main">
                {/* Event Details */}
                <div className="event-detail-container">
                    {/* Date & Time */}
                    <div className="detail-section">
                        <div className="detail-item with-margin">
                            <span className="detail-icon">🕒</span>
                            <div>
                                <div className="detail-title">
                                    {formatDateTime(event.startTime)}
                                </div>
                                {event.endTime && (
                                    <div className="detail-subtitle">
                                        Ends: {formatDateTime(event.endTime)}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Location */}
                    {(event.location || event.address || event.city) && (
                        <div className="detail-section">
                            <div className="detail-item">
                                <span className="detail-icon">📍</span>
                                <div>
                                    {event.location && (
                                        <div className="detail-title">
                                            {event.location}
                                        </div>
                                    )}
                                    {event.address && (
                                        <div className="detail-subtitle">
                                            {event.address}
                                        </div>
                                    )}
                                    {(event.city || event.country) && (
                                        <div className="detail-subtitle">
                                            {[event.city, event.country].filter(Boolean).join(', ')}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Capacity Info */}
                    <div className="detail-section">
                        <div className="detail-item">
                            <span className="detail-icon">👥</span>
                            <div>
                                <div className="detail-title">
                                    {event.registeredCount} / {event.capacity} Registered
                                </div>
                                <div className={`capacity-status ${event.spotsLeft <= 5 ? 'low' : 'available'}`}>
                                    {isFull
                                        ? 'Event is full'
                                        : `${event.spotsLeft} spots left`}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Registration Deadline */}
                    {event.registrationDeadline && (
                        <div className="deadline-box">
                            <div className="deadline-content">
                                <span className="deadline-icon">⏰</span>
                                <div>
                                    Registration deadline: {formatDateTime(event.registrationDeadline)}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Description */}
                    <div className="about-section">
                        <h2>About this event</h2>
                        <div className="about-text">
                            {event.description}
                        </div>
                    </div>

                    {/* Action Button */}
                    {!isPast && (
                        <div className="sticky-action-bar">
                            {event.isRegistered ? (
                                <button className="register-btn success" disabled>
                                    ✓ You're Registered!
                                </button>
                            ) : (
                                <button
                                    className={`register-btn ${registering || (isFull && !event.isRegistered) ? 'disabled' : 'primary'}`}
                                    disabled={registering}
                                    onClick={async () => {
                                        if (!id) return;
                                        try {
                                            setRegistering(true);
                                            const result = await registerForEvent(id);
                                            alert(result.message);
                                            // Reload event details to update registration status
                                            const updated = await getEventDetails(id);
                                            setEvent(updated);
                                        } catch (err) {
                                            alert(err instanceof Error ? err.message : 'Failed to register');
                                        } finally {
                                            setRegistering(false);
                                        }
                                    }}
                                >
                                    {registering ? 'Processing...' : (isFull ? 'Join Waitlist' : 'Register for Event')}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </main>

            <BottomNav />
        </div>
    );
};

export default EventDetail;
