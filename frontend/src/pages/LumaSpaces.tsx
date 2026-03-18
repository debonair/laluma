/**
 * LumaSpaces - Event Discovery & Browsing Page (Story 7.3)
 * 
 * Members can browse upcoming events with:
 * - Paginated, date-ordered list of events
 * - Filter by date range (upcoming, this week, this month)
 * - Filter by proximity/location
 * - Visual flag for registered events
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { discoverEvents, type DiscoveredEvent, type DiscoverEventsParams } from '../services/event.service';
// import { useAuth } from '../context/AuthContext';
import { userService, type UserProfile } from '../services/user.service';

type DateFilter = 'upcoming' | 'this_week' | 'this_month';

import Header from '../components/Header';

const LumaSpaces: React.FC = () => {
    const navigate = useNavigate();
    // const { user } = useAuth();

    const [events, setEvents] = useState<DiscoveredEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [dateFilter, setDateFilter] = useState<DateFilter>('upcoming');
    const [useLocation, setUseLocation] = useState(false);
    const [radius, setRadius] = useState(50); // km

    // Pagination
    const [page, setPage] = useState(0);
    const [total, setTotal] = useState(0);
    const pageSize = 20;

    // Load user location preference
    useEffect(() => {
        let cancelled = false;
        const loadUserLocation = async () => {
            try {
                const profile: UserProfile = await userService.getCurrentUser();
                if (cancelled) return;
                // Check if user has location set (latitude/longitude exist on the location object)
                const hasLocation = profile.location?.latitude && profile.location?.longitude;
                if (hasLocation) {
                    setUseLocation(true);
                }
            } catch (err) {
                console.log('Could not load user location preference');
            }
        };
        loadUserLocation();
        return () => { cancelled = true; };
    }, []);

    const loadEvents = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const params: DiscoverEventsParams = {
                dateFilter,
                skip: page * pageSize,
                take: pageSize,
            };

            if (useLocation) {
                // In a real app, we'd get this from user preferences or geolocation API
                // For now, we'll just pass the flag and let backend use user's stored location
                params.radius = radius;
            }

            const result = await discoverEvents(params);
            setEvents(result.events);
            setTotal(result.total);
        } catch (err) {
            console.error('Failed to load events:', err);
            setError('Failed to load events. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [dateFilter, useLocation, radius, page]);

    useEffect(() => {
        loadEvents();
    }, [loadEvents]);

    const handleFilterChange = (filter: DateFilter) => {
        setDateFilter(filter);
        setPage(0);
    };

    const handleEventClick = (eventId: string) => {
        navigate(`/event/${eventId}`);
    };

    const formatEventDate = (dateStr: string) => {
        if (!dateStr) return 'Date TBD';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return 'Invalid date';
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        });
    };

    const totalPages = Math.ceil(total / pageSize);

    return (
        <div className="luma-spaces-page">
            <main style={{ paddingBottom: '80px' }}>
            <Header 
                title="Luma Spaces" 
                subtitle="Discover events happening near you"
                rightAction={
                    <button
                        onClick={() => navigate('/my-luma/events')}
                        className="btn-secondary"
                        style={{ width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                    >
                        My Events
                    </button>
                }
            />

                {/* Filters */}
                <div style={{ padding: '0 1rem 1rem 1rem', borderBottom: '1px solid var(--border-color)' }}>
                    {/* Date Filter */}
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'block' }}>
                            When
                        </label>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {(['upcoming', 'this_week', 'this_month'] as DateFilter[]).map((filter) => (
                                <button
                                    key={filter}
                                    onClick={() => handleFilterChange(filter)}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        borderRadius: '20px',
                                        border: 'none',
                                        backgroundColor: dateFilter === filter ? 'var(--primary-color)' : 'var(--bg-secondary)',
                                        color: dateFilter === filter ? 'white' : 'var(--text-primary)',
                                        fontWeight: 600,
                                        fontSize: '0.85rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    {filter === 'upcoming' ? '📅 Upcoming' :
                                        filter === 'this_week' ? '📆 This Week' :
                                            '🗓️ This Month'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Location Filter */}
                    <div>
                        <label style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'block' }}>
                            Location
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={useLocation}
                                    onChange={(e) => setUseLocation(e.target.checked)}
                                    style={{ width: '18px', height: '18px', accentColor: 'var(--primary-color)' }}
                                />
                                <span style={{ fontWeight: 500 }}>Show events near me</span>
                            </label>
                            {useLocation && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Within</span>
                                    <select
                                        value={radius}
                                        onChange={(e) => setRadius(Number(e.target.value))}
                                        style={{
                                            padding: '0.4rem 0.75rem',
                                            borderRadius: '8px',
                                            border: '1px solid var(--border-color)',
                                            backgroundColor: 'var(--bg-primary)',
                                            fontWeight: 500,
                                        }}
                                    >
                                        <option value={10}>10 km</option>
                                        <option value={25}>25 km</option>
                                        <option value={50}>50 km</option>
                                        <option value={100}>100 km</option>
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Events List */}
                <div style={{ padding: '1rem' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                            Loading events...
                        </div>
                    ) : error ? (
                        <div style={{ textAlign: 'center', padding: '3rem' }}>
                            <p style={{ color: '#ef4444', marginBottom: '1rem' }}>{error}</p>
                            <button
                                onClick={loadEvents}
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    backgroundColor: 'var(--primary-color)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                }}
                            >
                                Try Again
                            </button>
                        </div>
                    ) : events.length === 0 ? (
                        <div style={{
                            textAlign: 'center',
                            padding: '3rem',
                            backgroundColor: 'var(--bg-secondary)',
                            borderRadius: '12px',
                        }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📍</div>
                            <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>No events found</h3>
                            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                                {useLocation
                                    ? `No events within ${radius}km. Try increasing the radius or changing the date filter.`
                                    : 'No upcoming events match your filters. Try changing the date filter.'}
                            </p>
                        </div>
                    ) : (
                        <>
                            <div style={{
                                fontSize: '0.85rem',
                                color: 'var(--text-secondary)',
                                marginBottom: '1rem',
                                fontWeight: 500,
                            }}>
                                {total} event{total !== 1 ? 's' : ''} found
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {events.map((event) => (
                                    <div
                                        key={event.id}
                                        onClick={() => handleEventClick(event.id)}
                                        style={{
                                            padding: '1.25rem',
                                            backgroundColor: 'white',
                                            borderRadius: '12px',
                                            border: '1px solid var(--border-color)',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            boxShadow: event.isRegistered ? '0 0 0 2px var(--success-color)' : 'none',
                                            position: 'relative',
                                        }}
                                    >
                                        {/* Registered Badge */}
                                        {event.isRegistered && (
                                            <div style={{
                                                position: 'absolute',
                                                top: '-8px',
                                                right: '12px',
                                                backgroundColor: 'var(--success-color)',
                                                color: 'white',
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '12px',
                                                fontSize: '0.7rem',
                                                fontWeight: 700,
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px',
                                            }}>
                                                ✓ Registered
                                            </div>
                                        )}

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                                            <div style={{ flex: 1 }}>
                                                <h3 style={{
                                                    margin: '0 0 0.5rem 0',
                                                    fontSize: '1.1rem',
                                                    fontWeight: 700,
                                                    color: 'var(--text-primary)',
                                                }}>
                                                    {event.title}
                                                </h3>

                                                <div style={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '0.35rem',
                                                    fontSize: '0.9rem',
                                                }}>
                                                    <div style={{ color: 'var(--primary-color)', fontWeight: 600 }}>
                                                        🕒 {formatEventDate(event.startTime)}
                                                    </div>

                                                    {(event.location || event.city) && (
                                                        <div style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
                                                            📍 {event.location || event.city}{event.country ? `, ${event.country}` : ''}
                                                        </div>
                                                    )}

                                                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                                        👥 {event.registeredCount} / {event.capacity} registered
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={{
                                                fontSize: '1.5rem',
                                                color: 'var(--text-secondary)',
                                            }}>
                                                →
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    marginTop: '2rem',
                                }}>
                                    <button
                                        onClick={() => setPage(p => Math.max(0, p - 1))}
                                        disabled={page === 0}
                                        style={{
                                            padding: '0.5rem 1rem',
                                            borderRadius: '8px',
                                            border: '1px solid var(--border-color)',
                                            backgroundColor: page === 0 ? 'var(--bg-secondary)' : 'white',
                                            color: page === 0 ? 'var(--text-secondary)' : 'var(--text-primary)',
                                            cursor: page === 0 ? 'not-allowed' : 'pointer',
                                            fontWeight: 600,
                                        }}
                                    >
                                        Previous
                                    </button>

                                    <span style={{
                                        padding: '0.5rem 1rem',
                                        fontWeight: 600,
                                        color: 'var(--text-secondary)',
                                    }}>
                                        Page {page + 1} of {totalPages}
                                    </span>

                                    <button
                                        onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                        disabled={page >= totalPages - 1}
                                        style={{
                                            padding: '0.5rem 1rem',
                                            borderRadius: '8px',
                                            border: '1px solid var(--border-color)',
                                            backgroundColor: page >= totalPages - 1 ? 'var(--bg-secondary)' : 'white',
                                            color: page >= totalPages - 1 ? 'var(--text-secondary)' : 'var(--text-primary)',
                                            cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer',
                                            fontWeight: 600,
                                        }}
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>

            <BottomNav />
        </div>
    );
};

export default LumaSpaces;
