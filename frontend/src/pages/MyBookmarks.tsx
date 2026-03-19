import React, { useEffect, useState } from 'react';
import BottomNav from '../components/BottomNav';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { contentService } from '../services/content.service';
import type { Content } from '../types/content';
import './MyBookmarks.css'; // We'll reuse MyLuma styles or create specific ones

const MyBookmarks: React.FC = () => {
    const [bookmarks, setBookmarks] = useState<Content[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchBookmarks = async () => {
            try {
                const data = await contentService.getBookmarks();
                setBookmarks(data);
            } catch (error) {
                console.error('Error fetching bookmarks:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchBookmarks();
    }, []);

    const handleContentClick = (id: string) => {
        navigate(`/my-luma/${id}`);
    };

    if (loading) {
        return <div className="loading-state">Loading your saved content...</div>;
    }

    return (
        <div className="page-container">
            <Header 
                title="My Bookmarks" 
                subtitle="Your saved articles and videos"
                showBack={true}
                onBack={() => navigate(-1)}
            />

            {bookmarks.length === 0 ? (
                <div className="empty-state" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>🔖</div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>No bookmarks yet</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Save articles and videos you want to revisit later.</p>
                    <button onClick={() => navigate('/my-luma')} className="btn-primary" style={{ width: 'auto', padding: '0.75rem 2rem' }}>
                        Browse Content
                    </button>
                </div>
            ) : (
                <main style={{ padding: '0 1rem 2rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.25rem' }}>
                        {bookmarks.map((item) => (
                            <div
                                key={item.id}
                                className="card"
                                onClick={() => handleContentClick(item.id)}
                                style={{ cursor: 'pointer', overflow: 'hidden', padding: '0' }}
                            >
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    {item.thumbnailUrl && (
                                        <div style={{ height: '160px', overflow: 'hidden' }}>
                                            <img src={item.thumbnailUrl} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                    )}
                                    <div style={{ padding: '1.25rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                            <span className="badge badge-primary">{item.category}</span>
                                            {item.isPremium && <span className="badge badge-success">★ Premium</span>}
                                        </div>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem', lineHeight: 1.4 }}>{item.title}</h3>
                                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.excerpt}</p>
                                        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>{item.authorName}</span>
                                            <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                <span>❤️ {item.likesCount}</span>
                                                <span>💬 {item.commentsCount}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </main>
            )}
            <BottomNav />
        </div>
    );
};

export default MyBookmarks;
