import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
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
        <div className="page-container" style={{ backgroundColor: 'var(--bg-color)' }}>
            <div className="page-header" style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>My Luma</h1>
                <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0', fontSize: '0.9rem' }}>
                    Your creations and activities
                </p>
            </div>

            <main className="page-content">
                {/* Featured Content Carousel */}
                {featuredContent.length > 0 && (
                    <div className="featured-section">
                        <h2>Featured Articles</h2>
                        <div className="featured-carousel">
                            {featuredContent.map((item) => (
                                <div
                                    key={item.id}
                                    className="featured-card"
                                    onClick={() => handleContentClick(item.id)}
                                >
                                    <div className="featured-card-content">
                                        <div className="featured-badges">
                                            {item.isPremium && (
                                                <span className="premium-badge">
                                                    {item.premiumTier === 'premium_plus' ? 'Premium+' : 'Premium'}
                                                </span>
                                            )}
                                            <span className="category-badge">{item.category}</span>
                                        </div>
                                        <h3>{item.title}</h3>
                                        <p>{item.excerpt}</p>
                                        <div className="featured-meta">
                                            <span className="author">By {item.authorName}</span>
                                            <span className="stats">
                                                <span>👁 {item.viewCount}</span>
                                                <span>❤️ {item.likesCount}</span>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Category Filter */}
                <div className="category-filter">
                    {CATEGORIES.map((category) => (
                        <button
                            key={category}
                            className={selectedCategory === category ? 'active' : ''}
                            onClick={() => setSelectedCategory(category)}
                        >
                            {category}
                        </button>
                    ))}
                </div>

                {/* Content Grid */}
                {loading ? (
                    <div className="loading">
                        <div className="spinner"></div>
                        <p>Loading content...</p>
                    </div>
                ) : (
                    <div className="content-grid">
                        {content.map((item) => (
                            <div
                                key={item.id}
                                className="content-card"
                                onClick={() => handleContentClick(item.id)}
                            >
                                {item.isPremium && (
                                    <div className="premium-overlay">
                                        <span className="premium-badge">
                                            {item.premiumTier === 'premium_plus' ? 'Premium+' : 'Premium'}
                                        </span>
                                    </div>
                                )}

                                <div className="content-card-header">
                                    <span className="category-tag">{item.category}</span>
                                    {(item.contentType === 'video' || item.contentType === 'mixed') && (
                                        <span className="video-tag">🎬 Video</span>
                                    )}
                                    {item.contentType === 'event' && (
                                        <span className="event-tag" style={{ backgroundColor: '#DBEAFE', color: '#1E3A8A', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>📅 Event</span>
                                    )}
                                    {item.contentType === 'promotion' && (
                                        <span className="promo-tag" style={{ backgroundColor: '#FEF08A', color: '#92400E', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>🏷️ Promo</span>
                                    )}
                                </div>

                                <h3 className="content-title">{item.title}</h3>

                                {item.contentType === 'promotion' && item.discountValue && (
                                    <div style={{ padding: '0.5rem', margin: '0.5rem 0', backgroundColor: 'var(--primary-color)', color: 'white', fontWeight: 800, textAlign: 'center', border: '2px solid black' }}>
                                        {item.discountValue}
                                    </div>
                                )}

                                {item.contentType === 'event' && item.eventDate && (
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 600 }}>
                                        📍 {item.eventLocation || 'Location TBD'} | 🕒 {new Date(item.eventDate).toLocaleDateString()}
                                    </div>
                                )}

                                <p className="content-excerpt">{item.excerpt}</p>

                                <div className="content-footer">
                                    <span className="author-name">{item.authorName}</span>
                                    <div className="content-stats">
                                        <span>👁 {item.viewCount}</span>
                                        <span>❤️ {item.likesCount}</span>
                                        <span>💬 {item.commentsCount}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {!loading && content.length === 0 && (
                    <div className="empty-state">
                        <p>No content available in this category</p>
                    </div>
                )}
            </main>
            <BottomNav />
        </div>
    );
};

export default MyLuma;
