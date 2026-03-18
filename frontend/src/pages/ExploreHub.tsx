import React from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import Header from '../components/Header';
import { Compass, MapPin, Users, BookOpen } from 'lucide-react';

const ExploreHub: React.FC = () => {
    const navigate = useNavigate();

    const hubItems = [
        {
            title: 'Nearby Moms',
            subtitle: 'Connect with moms in your area',
            icon: '🌍',
            lucideIcon: Compass,
            path: '/discover',
            color: 'var(--brand-gradient)'
        },
        {
            title: 'My Luma',
            subtitle: 'Your activity, events & bookmarks',
            icon: '✨',
            lucideIcon: Users,
            path: '/my-luma',
            color: 'var(--accent-gradient)'
        },
        {
            title: 'Luma Spaces',
            subtitle: 'Find physical locations to meet',
            icon: '📍',
            lucideIcon: MapPin,
            path: '/spaces',
            color: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)'
        },
        {
            title: 'Directory',
            subtitle: 'Trusted local recommendations',
            icon: '📖',
            lucideIcon: BookOpen,
            path: '/directory',
            color: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
        }
    ];

    return (
        <div className="page-container" style={{ backgroundColor: 'var(--bg-color)', minHeight: '100vh' }}>
            <Header 
                title="Explore" 
                subtitle="Find your tribe and local resources"
            />

            <main className="page-content" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.25rem' }}>
                    {hubItems.map((item) => (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            style={{
                                padding: '1.25rem',
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
                                <item.lucideIcon size={28} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Syne, sans-serif' }}>{item.title}</h3>
                                <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500 }}>{item.subtitle}</p>
                            </div>
                            <div style={{ color: 'var(--border-color)', transition: 'transform 0.2s' }} className="hub-arrow">
                                <Compass size={20} />
                            </div>
                        </button>
                    ))}
                </div>
            </main>
            <BottomNav />
        </div>
    );
};

export default ExploreHub;
