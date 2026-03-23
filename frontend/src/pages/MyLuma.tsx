import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import Header from '../components/Header';
import './MyLuma.css';
import { SERVER_URL } from '../services/api';

interface Content {
    id: string;
    title: string;
    excerpt: string;
    category: string;
    authorName: string;
    isPremium: boolean;
    premiumTier?: string;
    isFeatured: boolean;
    thumbnailUrl?: string;
    contentType?: 'article' | 'video' | 'mixed' | 'event' | 'promotion';
    videoUrl?: string;
    discountCode?: string;
    discountValue?: string;
    eventDate?: string;
    eventLocation?: string;
    viewCount: number;
    likesCount: number;
    commentsCount: number;
    publishedAt: string;
}

const CATEGORIES = ['All', 'Wellness', 'Breastfeeding', 'Parenting', 'Teen Parenting'];

const MyLuma: React.FC = () => {
    const [content, setContent] = useState<Content[]>([]);
    const [featuredContent, setFeaturedContent] = useState<Content[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const navigate = useNavigate();

    const fetchContent = React.useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({ status: 'approved' });
            if (selectedCategory !== 'All') {
                params.set('category', selectedCategory);
            }
            const response = await fetch(`${SERVER_URL}/api/content?${params.toString()}`);
            const data = await response.json();
            setContent(data.content || []);
        } catch (error) {
            console.error('Error fetching content:', error);
        } finally {
            setLoading(false);
        }
    }, [selectedCategory]);

    const fetchFeaturedContent = React.useCallback(async () => {
        try {
            const response = await fetch(`${SERVER_URL}/api/content?isFeatured=true&status=approved&limit=3`);
            const data = await response.json();
            setFeaturedContent(data.content || []);
        } catch (error) {
            console.error('Error fetching featured content:', error);
        }
    }, []);

    useEffect(() => {
        fetchContent();
        fetchFeaturedContent();
    }, [fetchContent, fetchFeaturedContent]);

    const handleContentClick = (id: string) => {
        navigate(`/my-luma/${id}`);
    };

    return (
        <div className="page-container">
            <Header 
                title="My Luma" 
                subtitle="Your personal discovery hub"
            />

            <main className="page-content">
                {/* Quick Actions Row */}
                <div className="quick-actions-row" style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
                    <button className="card card-btn" onClick={() => navigate('/my-luma/events')} style={{ flex: '0 0 auto', padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', border: 'none', backgroundColor: 'var(--card-bg)' }}>
                        <span style={{ fontSize: '1.2rem' }}>📅</span>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>My Events</span>
                    </button>
                    <button className="card card-btn" onClick={() => navigate('/my-luma/bookmarks')} style={{ flex: '0 0 auto', padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', border: 'none', backgroundColor: 'var(--card-bg)' }}>
                        <span style={{ fontSize: '1.2rem' }}>🔖</span>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Bookmarks</span>
                    </button>
                    <button className="card card-btn" onClick={() => navigate('/my-luma/drafts')} style={{ flex: '0 0 auto', padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', border: 'none', backgroundColor: 'var(--card-bg)' }}>
                        <span style={{ fontSize: '1.2rem' }}>📝</span>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Drafts</span>
                    </button>
                </div>

                {/* Featured Content Area */}
                {featuredContent.length > 0 && selectedCategory === 'All' && (
                    <section className="featured-section" style={{ marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>Editor's Picks</h2>
                        <div className="featured-scroll" style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                            {featuredContent.map((item) => (
                                <div
                                    key={item.id}
                                    className="card"
                                    onClick={() => handleContentClick(item.id)}
                                    style={{ flex: '0 0 280px', padding: '1.25rem', border: 'none', backgroundColor: 'var(--primary-color)', color: 'white', cursor: 'pointer' }}
                                >
                                    <div className="featured-card-body" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                        <div className="card-top" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                                            {item.isPremium && <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }}>Premium</span>}
                                            <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }}>{item.category}</span>
                                        </div>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', lineHeight: 1.3 }}>{item.title}</h3>
                                        <p style={{ fontSize: '0.85rem', opacity: 0.9, marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.excerpt}</p>
                                        <div style={{ marginTop: 'auto', fontSize: '0.8rem', fontWeight: 600, opacity: 0.8 }}>
                                            By {item.authorName}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Category Navigation */}
                <nav className="category-pill-nav">
                    {CATEGORIES.map((category) => (
                        <button
                            key={category}
                            className={`pill-btn ${selectedCategory === category ? 'active' : ''}`}
                            onClick={() => setSelectedCategory(category)}
                        >
                            {category}
                        </button>
                    ))}
                </nav>

                {/* Content Layout */}
                {loading ? (
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>Curating your feed...</p>
                    </div>
                ) : (
                    <div className="content-vertical-list" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {content.map((item) => (
                            <article
                                key={item.id}
                                className="card"
                                onClick={() => handleContentClick(item.id)}
                                style={{ padding: '1.25rem', cursor: 'pointer' }}
                            >
                                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <span className="badge badge-primary">{item.category}</span>
                                        {item.isPremium && <span className="badge" style={{ backgroundColor: 'var(--warning-color)', color: '#fff' }}>★ Premium</span>}
                                    </div>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{new Date(item.publishedAt).toLocaleDateString()}</span>
                                </div>

                                <div className="card-body">
                                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem', lineHeight: 1.4 }}>{item.title}</h3>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1rem' }}>{item.excerpt}</p>
                                    
                                    {item.contentType === 'event' && item.eventDate && (
                                        <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-color)', borderRadius: '8px', display: 'flex', gap: '1rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem' }}>
                                            <span>📍 {item.eventLocation || 'Online'}</span>
                                            <span>📅 {new Date(item.eventDate).toLocaleDateString()}</span>
                                        </div>
                                    )}

                                    {item.contentType === 'promotion' && item.discountValue && (
                                        <div style={{ padding: '0.5rem 1rem', background: 'linear-gradient(135deg, var(--primary-color), var(--primary-dark))', color: 'white', borderRadius: '4px', display: 'inline-block', fontWeight: 700, fontSize: '0.8rem', marginBottom: '1rem' }}>
                                            Save {item.discountValue}
                                        </div>
                                    )}
                                </div>

                                <div className="card-footer" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{item.authorName}</span>
                                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                        <span>👁 {item.viewCount}</span>
                                        <span>❤️ {item.likesCount}</span>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                )}

                {!loading && content.length === 0 && (
                    <div className="empty-state">
                        <div className="empty-icon">🍃</div>
                        <h3>Nothing here yet</h3>
                        <p>Try exploring other categories or groups.</p>
                    </div>
                )}
            </main>
            <BottomNav />
        </div>
    );
};

export default MyLuma;
