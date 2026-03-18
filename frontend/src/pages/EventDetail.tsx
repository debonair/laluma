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
                <main style={{ padding: '2rem', textAlign: 'center' }}>
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
                <main style={{ padding: '2rem', textAlign: 'center' }}>
                    <p style={{ color: '#ef4444' }}>{error || 'Event not found'}</p>
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
                    <div style={{
                        margin: '0 1.5rem 1rem',
                        display: 'inline-block',
                        backgroundColor: event.registrationStatus === 'waitlisted' ? 'var(--warning-color, #f59e0b)' : 'var(--success-color)',
                        color: 'white',
                        padding: '0.5rem 1rem',
                        borderRadius: '20px',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                    }}>
                        {event.registrationStatus === 'waitlisted' 
                            ? `⏳ Waitlisted${event.waitlistPosition ? ` (Pos: ${event.waitlistPosition})` : ''}` 
                            : '✓ You\'re Registered'}
                    </div>
                )}
            </Header>

            <main style={{ paddingBottom: '80px' }}>

                {/* Event Details */}
                <div style={{ padding: '1.5rem' }}>
                    {/* Date & Time */}
                    <div style={{
                        marginBottom: '1.5rem',
                        padding: '1.25rem',
                        backgroundColor: 'var(--bg-secondary, #f5f5f5)',
                        borderRadius: '12px',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '1.5rem' }}>🕒</span>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                                    {formatDateTime(event.startTime)}
                                </div>
                                {event.endTime && (
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                        Ends: {formatDateTime(event.endTime)}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Location */}
                    {(event.location || event.address || event.city) && (
                        <div style={{
                            marginBottom: '1.5rem',
                            padding: '1.25rem',
                            backgroundColor: 'var(--bg-secondary, #f5f5f5)',
                            borderRadius: '12px',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <span style={{ fontSize: '1.5rem' }}>📍</span>
                                <div>
                                    {event.location && (
                                        <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                                            {event.location}
                                        </div>
                                    )}
                                    {event.address && (
                                        <div style={{ color: 'var(--text-secondary)' }}>
                                            {event.address}
                                        </div>
                                    )}
                                    {(event.city || event.country) && (
                                        <div style={{ color: 'var(--text-secondary)' }}>
                                            {[event.city, event.country].filter(Boolean).join(', ')}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Capacity Info */}
                    <div style={{
                        marginBottom: '1.5rem',
                        padding: '1.25rem',
                        backgroundColor: 'var(--bg-secondary, #f5f5f5)',
                        borderRadius: '12px',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{ fontSize: '1.5rem' }}>👥</span>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                                    {event.registeredCount} / {event.capacity} Registered
                                </div>
                                <div style={{
                                    color: event.spotsLeft <= 5 ? 'var(--error-color)' : 'var(--success-color)',
                                    fontSize: '0.9rem',
                                    fontWeight: 600,
                                }}>
                                    {isFull
                                        ? 'Event is full'
                                        : `${event.spotsLeft} spots left`}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Registration Deadline */}
                    {event.registrationDeadline && (
                        <div style={{
                            marginBottom: '1.5rem',
                            padding: '1rem',
                            backgroundColor: '#fff7ed',
                            border: '1px solid #fed7aa',
                            borderRadius: '12px',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <span style={{ fontSize: '1.25rem' }}>⏰</span>
                                <div style={{ color: '#c2410c', fontWeight: 600 }}>
                                    Registration deadline: {formatDateTime(event.registrationDeadline)}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Description */}
                    <div style={{ marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>
                            About this event
                        </h2>
                        <div style={{
                            whiteSpace: 'pre-wrap',
                            lineHeight: 1.6,
                            color: 'var(--text-primary)',
                        }}>
                            {event.description}
                        </div>
                    </div>

                    {/* Action Button */}
                    {!isPast && (
                        <div style={{
                            position: 'sticky',
                            bottom: '80px',
                            padding: '1rem',
                            backgroundColor: 'white',
                            borderTop: '1px solid var(--border-color)',
                        }}>
                            {event.isRegistered ? (
                                <button
                                    disabled
                                    style={{
                                        width: '100%',
                                        padding: '1rem',
                                        backgroundColor: 'var(--success-color)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '12px',
                                        fontWeight: 700,
                                        fontSize: '1.1rem',
                                        cursor: 'not-allowed',
                                    }}
                                >
                                    ✓ You're Registered!
                                </button>
                            ) : (
                                <button
                                    style={{
                                        width: '100%',
                                        padding: '1rem',
                                        backgroundColor: isFull ? 'var(--text-secondary)' : 'var(--primary-color)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '12px',
                                        fontWeight: 700,
                                        fontSize: '1.1rem',
                                        cursor: registering ? 'not-allowed' : 'pointer',
                                        opacity: registering ? 0.7 : 1,
                                    }}
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
