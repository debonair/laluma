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
        } catch {
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
                            <div key={i} className="card" style={{ height: '160px', opacity: 0.5 }}></div>
                        ))}
                    </div>
                ) : events.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '5rem 1.5rem', animation: 'fadeIn 0.5s ease' }}>
                        <div style={{ 
                            fontSize: '4rem', 
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
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>No events yet</h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem', fontSize: '1.1rem', maxWidth: '300px', margin: '0 auto 2.5rem' }}>
                            Your calendar looks empty. Let's find some amazing events for you!
                        </p>
                        <button 
                            onClick={() => navigate('/discover')}
                            className="btn-primary"
                            style={{ width: 'auto', padding: '1rem 2.5rem' }}
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
                                    <h2 style={{ fontSize: '0.85rem', fontWeight: 800, margin: 0, color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Confirmed Spots
                                    </h2>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {registeredEvents.map((event: EventDetails) => (
                                        <div 
                                            key={event.id}
                                            onClick={() => navigate(`/event/${event.id}`)}
                                            className="card"
                                            style={{
                                                padding: '1.5rem',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>{event.title}</h3>
                                                <button 
                                                    onClick={(e: React.MouseEvent) => handleCancelClick(e, event.id, event.title, 'registered')}
                                                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '6px', borderRadius: '50%', transition: 'all 0.2s' }}
                                                    className="icon-hover-effect"
                                                    title="Cancel Registration"
                                                >
                                                    <XCircle size={20} />
                                                </button>
                                            </div>
                                            
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', marginBottom: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <Calendar size={14} style={{ opacity: 0.7 }} />
                                                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formatDate(event.startTime)}</span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <Clock size={14} style={{ opacity: 0.7 }} />
                                                    <span>{formatTime(event.startTime)}</span>
                                                </div>
                                                {event.location && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <MapPin size={14} style={{ opacity: 0.7 }} />
                                                        <span>{event.location}</span>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div className="badge badge-success" style={{ padding: '6px 12px', fontWeight: 700 }}>
                                                    Confirmed
                                                </div>
                                                <div style={{ color: 'var(--primary-color)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}>
                                                    View Details <ChevronRight size={14} />
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
                                    <Clock size={18} color="var(--warning-color)" />
                                    <h2 style={{ fontSize: '0.85rem', fontWeight: 800, margin: 0, color: 'var(--warning-color)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Waitlist Queue
                                    </h2>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {waitlistedEvents.map((event: EventDetails) => (
                                        <div 
                                            key={event.id}
                                            onClick={() => navigate(`/event/${event.id}`)}
                                            className="card"
                                            style={{
                                                padding: '1.25rem',
                                                borderStyle: 'dashed',
                                                borderColor: 'var(--warning-color)',
                                                opacity: 0.9,
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{event.title}</h3>
                                                <button 
                                                    onClick={(e: React.MouseEvent) => handleCancelClick(e, event.id, event.title, 'waitlisted')}
                                                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '6px' }}
                                                    className="icon-hover-effect"
                                                    title="Leave Waitlist"
                                                >
                                                    <XCircle size={18} />
                                                </button>
                                            </div>
                                            
                                            <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <Calendar size={14} style={{ opacity: 0.7 }} />
                                                    <span>{formatDate(event.startTime)}</span>
                                                </div>
                                            </div>
 
                                            <div style={{ 
                                                padding: '0.85rem 1rem', 
                                                backgroundColor: 'var(--warning-light)', 
                                                borderRadius: '12px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <AlertCircle size={16} color="var(--warning-color)" />
                                                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--warning-dark)' }}>Queue Position</span>
                                                </div>
                                                <span className="badge badge-warning" style={{ fontSize: '0.9rem', padding: '4px 10px' }}>
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
