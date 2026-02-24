import React, { useEffect, useState } from 'react';
import BottomNav from '../components/BottomNav';
import { useNavigate } from 'react-router-dom';
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
            <div className="page-header" style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg)' }}>
                <h1>My Bookmarks</h1>
                <p>Your saved articles and videos</p>
            </div>

            {bookmarks.length === 0 ? (
                <div className="empty-state">
                    <p>You haven't bookmarked any content yet.</p>
                    <button onClick={() => navigate('/my-luma')} className="browse-btn">
                        Browse Content
                    </button>
                </div>
            ) : (
                <main className="content-grid">
                    {bookmarks.map((item) => (
                        <div
                            key={item.id}
                            className="content-card"
                            onClick={() => handleContentClick(item.id)}
                        >
                            <div className="card-image">
                                {item.thumbnailUrl ? (
                                    <img src={item.thumbnailUrl} alt={item.title} />
                                ) : (
                                    <div className="placeholder-image">
                                        {item.category[0]}
                                    </div>
                                )}
                                {item.isPremium && (
                                    <span className={`premium-badge ${item.premiumTier}`}>
                                        {item.premiumTier === 'premium_plus' ? 'Premium+' : 'Premium'}
                                    </span>
                                )}
                            </div>
                            <div className="card-content">
                                <span className="category-tag">{item.category}</span>
                                <h3>{item.title}</h3>
                                <p>{item.excerpt}</p>
                                <div className="card-footer">
                                    <span className="author">{item.authorName}</span>
                                    <div className="stats">
                                        <span>❤️ {item.likesCount}</span>
                                        <span>💬 {item.commentsCount}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </main>
            )}
            <BottomNav />
        </div>
    );
};

export default MyBookmarks;
