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

import './LumaSpaces.css';

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
            <main className="luma-spaces-main">
            <Header 
                title="Luma Spaces" 
                subtitle="Discover events happening near you"
                rightAction={
                    <button
                        onClick={() => navigate('/my-luma/events')}
                        className="btn-secondary my-events-btn"
                    >
                        My Events
                    </button>
                }
            />

                {/* Filters */}
                <div className="filters-container">
                    {/* Date Filter */}
                    <div className="filter-group">
                        <label className="filter-label">When</label>
                        <div className="filter-options">
                            {(['upcoming', 'this_week', 'this_month'] as DateFilter[]).map((filter) => (
                                <button
                                    key={filter}
                                    onClick={() => handleFilterChange(filter)}
                                    className={`filter-btn ${dateFilter === filter ? 'active' : ''}`}
                                >
                                    {filter === 'upcoming' ? '📅 Upcoming' :
                                        filter === 'this_week' ? '📆 This Week' :
                                            '🗓️ This Month'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Location Filter */}
                    <div className="filter-group">
                        <label className="filter-label">Location</label>
                        <div className="location-filter-row">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={useLocation}
                                    onChange={(e) => setUseLocation(e.target.checked)}
                                    className="custom-checkbox"
                                />
                                <span>Show events near me</span>
                            </label>
                            {useLocation && (
                                <div className="radius-select-container">
                                    <span className="filter-label" style={{ marginBottom: 0 }}>Within</span>
                                    <select
                                        value={radius}
                                        onChange={(e) => setRadius(Number(e.target.value))}
                                        className="radius-select"
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
                <div className="events-list-container">
                    {loading ? (
                        <div className="loading-container">
                            Loading events...
                        </div>
                    ) : error ? (
                        <div className="error-container">
                            <p className="field-error" style={{ marginBottom: '1rem' }}>{error}</p>
                            <button
                                onClick={loadEvents}
                                className="btn-primary"
                            >
                                Try Again
                            </button>
                        </div>
                    ) : events.length === 0 ? (
                        <div className="empty-container">
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📍</div>
                            <h3 className="hub-item-title" style={{ textAlign: 'center' }}>No events found</h3>
                            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                                {useLocation
                                    ? `No events within ${radius}km. Try increasing the radius or changing the date filter.`
                                    : 'No upcoming events match your filters. Try changing the date filter.'}
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="events-count">
                                {total} event{total !== 1 ? 's' : ''} found
                            </div>

                            <div className="events-grid">
                                {events.map((event) => (
                                    <div
                                        key={event.id}
                                        onClick={() => handleEventClick(event.id)}
                                        className={`event-card ${event.isRegistered ? 'registered' : ''}`}
                                    >
                                        {/* Registered Badge */}
                                        {event.isRegistered && (
                                            <div className="registered-badge">
                                                ✓ Registered
                                            </div>
                                        )}

                                        <div className="event-card-content">
                                            <div className="event-info">
                                                <h3 className="event-title">
                                                    {event.title}
                                                </h3>

                                                <div className="event-details">
                                                    <div className="event-time">
                                                        🕒 {formatEventDate(event.startTime)}
                                                    </div>

                                                    {(event.location || event.city) && (
                                                        <div className="event-location">
                                                            📍 {event.location || event.city}{event.country ? `, ${event.country}` : ''}
                                                        </div>
                                                    )}

                                                    <div className="event-stats">
                                                        👥 {event.registeredCount} / {event.capacity} registered
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="event-arrow">
                                                →
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="pagination-container">
                                    <button
                                        onClick={() => setPage(p => Math.max(0, p - 1))}
                                        disabled={page === 0}
                                        className="pagination-btn"
                                    >
                                        Previous
                                    </button>

                                    <span className="pagination-info">
                                        Page {page + 1} of {totalPages}
                                    </span>

                                    <button
                                        onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                        disabled={page >= totalPages - 1}
                                        className="pagination-btn"
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
