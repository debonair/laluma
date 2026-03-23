import React from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import Header from '../components/Header';
import { Compass, MapPin, Users, BookOpen } from 'lucide-react';

import './ExploreHub.css';

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
        <div className="explore-hub-container page-container">
            <Header 
                title="Explore" 
                subtitle="Find your tribe and local resources"
            />

            <main className="explore-hub-content page-content">
                <div className="hub-grid">
                    {hubItems.map((item) => (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className="hub-item-btn"
                        >
                            <div 
                                className="hub-icon-container"
                                style={{ background: item.color }}
                            >
                                <item.lucideIcon size={28} />
                            </div>
                            <div className="hub-text-container">
                                <h3 className="hub-item-title">{item.title}</h3>
                                <p className="hub-item-subtitle">{item.subtitle}</p>
                            </div>
                            <div className="hub-arrow-indicator">
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
