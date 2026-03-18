import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyEvents, cancelEventRegistration, type EventDetails } from '../services/event.service';
import BottomNav from '../components/BottomNav';
import Header from '../components/Header';
import ConfirmationModal from '../components/ConfirmationModal';
import { useToast } from '../context/ToastContext';
import { useSocket } from '../context/SocketContext';
import { Calendar, MapPin, Clock, ChevronRight, XCircle, AlertCircle, Sparkles } from 'lucide-react';

const MyEvents: React.FC = () => {
    const [events, setEvents] = useState<EventDetails[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        eventId: string;
        title: string;
        status: string;
    }>({
        isOpen: false,
        eventId: '',
        title: '',
        status: ''
    });

    const navigate = useNavigate();
    const { addToast } = useToast();
    const { socket } = useSocket();

    const fetchMyEvents = async () => {
        setIsLoading(true);
        try {
            const data = await getMyEvents();
            setEvents(data);
        } catch (error) {
            console.error('Failed to fetch my events:', error);
            addToast('Failed to load your events', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMyEvents();
    }, []);

    useEffect(() => {
        if (!socket) return;

        const handleUpdate = () => {
            fetchMyEvents();
        };

        socket.on('registration_update', handleUpdate);
        return () => {
            socket.off('registration_update', handleUpdate);
        };
    }, [socket]);

    const handleCancelClick = (e: React.MouseEvent, eventId: string, title: string, status: string) => {
        e.stopPropagation();
        setModalConfig({
            isOpen: true,
            eventId,
            title,
            status
        });
    };

    const handleConfirmCancel = async () => {
        const { eventId, status } = modalConfig;
        try {
            await cancelEventRegistration(eventId);
            addToast(`Successfully ${status === 'waitlisted' ? 'left waitlist' : 'cancelled registration'}`, 'success');
            setModalConfig(prev => ({ ...prev, isOpen: false }));
            fetchMyEvents(); // Refresh list
        } catch (error) {
            addToast('Failed to update registration', 'error');
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit'
        });
    };

    const registeredEvents = events.filter(e => e.registrationStatus === 'registered' || e.registrationStatus === 'confirmed');
    const waitlistedEvents = events.filter(e => e.registrationStatus === 'waitlisted');

    return (
        <div className="page-container" style={{ backgroundColor: 'var(--bg-color)', minHeight: '100vh', paddingBottom: '80px' }}>
            <Header 
                title="My Events" 
                showBack={true}
                onBack={() => navigate(-1)}
            />

            <main className="page-content" style={{ padding: '1.5rem 1rem', maxWidth: '800px', margin: '0 auto' }}>
                {isLoading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {[1, 2, 3].map(i => (
                            <div key={i} className="skeleton" style={{ height: '160px', borderRadius: '24px' }}></div>
                        ))}
                    </div>
                ) : events.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '5rem 1.5rem', animation: 'fadeIn 0.5s ease' }}>
                        <div style={{ 
                            fontSize: '4.5rem', 
                            marginBottom: '1.5rem', 
                            background: 'var(--primary-light)', 
                            width: '100px', 
                            height: '100px', 
                            borderRadius: '50%', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            margin: '0 auto 2rem' 
                        }}>
                            📅
                        </div>
                        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.75rem', fontFamily: 'Syne, sans-serif' }}>No events yet</h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem', fontSize: '1.1rem', maxWidth: '300px', margin: '0 auto 2.5rem' }}>
                            Your calendar looks empty. Let's find some amazing events for you!
                        </p>
                        <button 
                            onClick={() => navigate('/discover')}
                            className="btn-primary"
                            style={{ padding: '1rem 2.5rem', borderRadius: '100px', fontSize: '1rem', boxShadow: '0 8px 20px rgba(37, 84, 40, 0.2)' }}
                        >
                            Browse Events
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                        {registeredEvents.length > 0 && (
                            <section>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
                                    <Sparkles size={18} color="var(--primary-color)" />
                                    <h2 style={{ fontSize: '0.9rem', fontWeight: 800, margin: 0, color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                        Confirmed Spots
                                    </h2>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                    {registeredEvents.map((event: EventDetails) => (
                                        <div 
                                            key={event.id}
                                            onClick={() => navigate(`/event/${event.id}`)}
                                            className="content-card"
                                            style={{
                                                padding: '1.5rem',
                                                borderRadius: '24px',
                                                position: 'relative',
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                                <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, fontFamily: 'Syne, sans-serif' }}>{event.title}</h3>
                                                <button 
                                                    onClick={(e: React.MouseEvent) => handleCancelClick(e, event.id, event.title, 'registered')}
                                                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '6px', borderRadius: '50%', transition: 'all 0.2s' }}
                                                    className="icon-hover-effect"
                                                    title="Cancel Registration"
                                                >
                                                    <XCircle size={22} />
                                                </button>
                                            </div>
                                            
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', marginBottom: '1.25rem', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <Calendar size={16} className="icon-subtle" />
                                                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formatDate(event.startTime)}</span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <Clock size={16} className="icon-subtle" />
                                                    <span>{formatTime(event.startTime)}</span>
                                                </div>
                                                {event.location && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <MapPin size={16} className="icon-subtle" />
                                                        <span>{event.location}</span>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div style={{ 
                                                    backgroundColor: 'rgba(34, 197, 94, 0.1)', 
                                                    color: '#16a34a', 
                                                    padding: '6px 16px', 
                                                    borderRadius: '100px', 
                                                    fontSize: '0.8rem', 
                                                    fontWeight: 700,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px'
                                                }}>
                                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#16a34a' }}></div>
                                                    Confirmed
                                                </div>
                                                <div style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem' }}>
                                                    View Details <ChevronRight size={16} />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {waitlistedEvents.length > 0 && (
                            <section>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
                                    <Clock size={18} color="var(--gold-color)" />
                                    <h2 style={{ fontSize: '0.9rem', fontWeight: 800, margin: 0, color: 'var(--gold-color)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                        Waitlist Queue
                                    </h2>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                    {waitlistedEvents.map((event: EventDetails) => (
                                        <div 
                                            key={event.id}
                                            onClick={() => navigate(`/event/${event.id}`)}
                                            className="content-card"
                                            style={{
                                                padding: '1.5rem',
                                                borderRadius: '24px',
                                                borderStyle: 'dashed',
                                                backgroundColor: 'rgba(255, 255, 255, 0.5)'
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                                <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-secondary)', fontFamily: 'Syne, sans-serif' }}>{event.title}</h3>
                                                <button 
                                                    onClick={(e: React.MouseEvent) => handleCancelClick(e, event.id, event.title, 'waitlisted')}
                                                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '6px' }}
                                                    title="Leave Waitlist"
                                                >
                                                    <XCircle size={22} />
                                                </button>
                                            </div>
                                            
                                            <div style={{ display: 'flex', gap: '1.25rem', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <Calendar size={16} />
                                                    <span>{formatDate(event.startTime)}</span>
                                                </div>
                                            </div>

                                            <div style={{ 
                                                marginTop: '1.5rem', 
                                                padding: '1rem', 
                                                backgroundColor: 'rgba(213, 145, 39, 0.08)', 
                                                borderRadius: '16px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                border: '1px solid rgba(213, 145, 39, 0.2)'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <AlertCircle size={18} color="var(--gold-color)" />
                                                    <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>Your Queue Position</span>
                                                </div>
                                                <span style={{ 
                                                    backgroundColor: 'var(--gold-color)', 
                                                    color: 'white', 
                                                    padding: '4px 12px', 
                                                    borderRadius: '8px', 
                                                    fontWeight: 800,
                                                    fontSize: '1rem'
                                                }}>
                                                    #{event.waitlistPosition || '-'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                )}
            </main>
            <BottomNav />

            <ConfirmationModal 
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
                onConfirm={handleConfirmCancel}
                variant="danger"
                title={modalConfig.status === 'waitlisted' ? 'Leave Waitlist?' : 'Cancel Registration?'}
                description={
                    modalConfig.status === 'waitlisted'
                        ? `Change of plans? No problem. If you leave the waitlist for "${modalConfig.title}", we'll open this potential spot for another member of the community.`
                        : `We understand plans change. If you cancel your registration for "${modalConfig.title}", we'll make sure your spot goes to someone on the waitlist who can't wait to attend.`
                }
                confirmText={modalConfig.status === 'waitlisted' ? 'Leave Waitlist' : 'Cancel Registration'}
                cancelText="Keep my spot"
            />
        </div>
    );
};

export default MyEvents;
