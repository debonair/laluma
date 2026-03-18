import React from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import Header from '../components/Header';
import { ChevronRight, MessageCircle, Users } from 'lucide-react';
import apiClient from '../services/api';

const SocialHub: React.FC = () => {
    const navigate = useNavigate();
    const [unreadMessages, setUnreadMessages] = React.useState(0);

    React.useEffect(() => {
        const fetchUnread = async () => {
            try {
                const response = await apiClient.get<{ unreadCount: number }>('/messages/unread-count');
                setUnreadMessages(response.data.unreadCount);
            } catch (error) {
                console.error('Failed to fetch unread count', error);
            }
        };
        fetchUnread();
    }, []);

    const hubItems = [
        {
            title: 'Messages',
            subtitle: 'Direct chats with other moms',
            icon: MessageCircle,
            path: '/messages',
            color: 'var(--brand-gradient)',
            badge: unreadMessages
        },
        {
            title: 'Groups',
            subtitle: 'Join communities and discussions',
            icon: Users,
            path: '/groups',
            color: 'var(--accent-gradient)',
            badge: 0
        }
    ];

    return (
        <div className="page-container" style={{ backgroundColor: 'var(--bg-color)', minHeight: '100vh' }}>
            <Header 
                title="Community" 
                subtitle="Chat, share and grow together"
            />

            <main className="page-content" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.25rem' }}>
                    {hubItems.map((item) => (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            style={{
                                padding: '1.5rem',
                                background: 'var(--card-bg)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '24px',
                                boxShadow: 'var(--shadow-soft)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1.5rem',
                                textAlign: 'left',
                                cursor: 'pointer',
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                width: '100%',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                        >
                            <div style={{ 
                                width: '56px', 
                                height: '56px', 
                                borderRadius: '16px', 
                                background: item.color,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                flexShrink: 0,
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                            }}>
                                <item.icon size={28} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Syne, sans-serif' }}>{item.title}</h3>
                                <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500 }}>{item.subtitle}</p>
                            </div>
                            {item.badge > 0 && (
                                <div style={{
                                    position: 'absolute',
                                    top: '1rem',
                                    right: '2.5rem',
                                    backgroundColor: 'var(--error-color)',
                                    color: 'white',
                                    borderRadius: '50%',
                                    width: '20px',
                                    height: '20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.7rem',
                                    fontWeight: 'bold',
                                    border: '2px solid white',
                                    zIndex: 2
                                }}>
                                    {item.badge}
                                </div>
                            )}
                            <div style={{ color: 'var(--border-color)' }}>
                                <ChevronRight size={24} />
                            </div>
                        </button>
                    ))}
                </div>
            </main>
            <BottomNav />
        </div>
    );
};

export default SocialHub;
