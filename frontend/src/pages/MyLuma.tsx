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
                <div className="quick-actions-row">
                    <button className="action-pill" onClick={() => navigate('/my-luma/events')}>
                        <span className="action-icon">📅</span>
                        <span className="action-label">My Events</span>
                    </button>
                    <button className="action-pill" onClick={() => navigate('/my-luma/bookmarks')}>
                        <span className="action-icon">🔖</span>
                        <span className="action-label">Bookmarks</span>
                    </button>
                    <button className="action-pill" onClick={() => navigate('/my-luma/drafts')}>
                        <span className="action-icon">📝</span>
                        <span className="action-label">Drafts</span>
                    </button>
                </div>

                {/* Featured Content Area */}
                {featuredContent.length > 0 && selectedCategory === 'All' && (
                    <section className="featured-section">
                        <h2 className="section-title">Editor's Picks</h2>
                        <div className="featured-scroll">
                            {featuredContent.map((item) => (
                                <div
                                    key={item.id}
                                    className="featured-glass-card"
                                    onClick={() => handleContentClick(item.id)}
                                >
                                    <div className="featured-card-body">
                                        <div className="card-top">
                                            {item.isPremium && <span className="badge badge-premium">Premium</span>}
                                            <span className="badge badge-category">{item.category}</span>
                                        </div>
                                        <h3 className="featured-title">{item.title}</h3>
                                        <p className="featured-excerpt">{item.excerpt}</p>
                                        <div className="featured-footer">
                                            <span className="author">By {item.authorName}</span>
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
                    <div className="content-vertical-list">
                        {content.map((item) => (
                            <article
                                key={item.id}
                                className="content-card modern-card"
                                onClick={() => handleContentClick(item.id)}
                            >
                                <div className="card-header">
                                    <span className="badge badge-category">{item.category}</span>
                                    {item.isPremium && <span className="badge badge-premium">★</span>}
                                    <span className="timestamp">{new Date(item.publishedAt).toLocaleDateString()}</span>
                                </div>

                                <div className="card-body">
                                    <h3 className="card-title">{item.title}</h3>
                                    <p className="card-excerpt">{item.excerpt}</p>
                                    
                                    {item.contentType === 'event' && item.eventDate && (
                                        <div className="event-info">
                                            <span className="event-loc">📍 {item.eventLocation || 'Online'}</span>
                                            <span className="event-time">🕒 {new Date(item.eventDate).toLocaleDateString()}</span>
                                        </div>
                                    )}

                                    {item.contentType === 'promotion' && item.discountValue && (
                                        <div className="promo-banner">
                                            Save {item.discountValue}
                                        </div>
                                    )}
                                </div>

                                <div className="card-footer">
                                    <span className="author">{item.authorName}</span>
                                    <div className="card-stats">
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
