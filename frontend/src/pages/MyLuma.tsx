import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import './MyLuma.css';

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
    contentType?: string;
    videoUrl?: string;
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
            const response = await fetch(`http://localhost:3000/api/content?${params.toString()}`);
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
            const response = await fetch('http://localhost:3000/api/content?isFeatured=true&status=approved&limit=3');
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
        <div className="my-luma">
            <div className="my-luma-header">
                <h1>My Luma</h1>
                <p>Expert advice, tips, and support for every stage of motherhood</p>
            </div>

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
                            </div>

                            <h3 className="content-title">{item.title}</h3>
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
            {/* Spacer for bottom nav */}
            <div style={{ height: '60px' }}></div>
            <BottomNav />
        </div>
    );
};

export default MyLuma;
