import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { contentService } from '../services/content.service';
import { useToast } from '../context/ToastContext';
import apiClient from '../services/api';
import BottomNav from '../components/BottomNav';
import Skeleton from '../components/Skeleton';
import { shareContent } from '../utils/share';
import './ContentDetail.css';
import { SERVER_URL } from '../services/api';

interface Content {
    id: string;
    title: string;
    body: string;
    excerpt: string;
    category: string;
    authorId: string;
    authorName: string;
    isPremium: boolean;
    premiumTier?: string;
    videoUrl?: string;
    videoDuration?: number;
    videoThumbnail?: string;
    contentType?: string;
    sponsorName?: string;
    sponsorLogoUrl?: string;
    sponsorLink?: string;
    discountCode?: string;
    discountValue?: string;
    eventDate?: string;
    eventLocation?: string;
    viewCount: number;
    likesCount: number;
    commentsCount: number;
    publishedAt: string;
    userInteractions?: {
        liked: boolean;
        bookmarked: boolean;
    };
    hasAccess?: boolean;
    comments?: Comment[];
}

interface Comment {
    id: string;
    commentText: string;
    createdAt: string;
    author: {
        id: string;
        username: string;
        displayName: string;
        profileImageUrl?: string;
    };
}

const ContentDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [content, setContent] = useState<Content | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [commentText, setCommentText] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);
    const [commentError, setCommentError] = useState<string | null>(null);

    const { addToast } = useToast();

    const fetchContent = React.useCallback(async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const headers: HeadersInit = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await apiClient.get<Content>(`/content/${id}`);
            const data = response.data;
            setContent(data);
            setComments(data.comments || []);
        } catch (error) {
            console.error('Error fetching content:', error);
        } finally {
            setLoading(false);
        }
    }, [id]);

    const trackView = React.useCallback(async () => {
        try {
            await fetch(`${SERVER_URL}/api/content/${id}/view`, {
                method: 'POST'
            });
        } catch (error) {
            console.error('Error tracking view:', error);
        }
    }, [id]);

    useEffect(() => {
        if (id) {
            fetchContent();
            trackView();
        }
    }, [id, fetchContent, trackView]);

    const handleLike = async () => {
        if (!user) {
            navigate('/signin');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const method = content?.userInteractions?.liked ? 'DELETE' : 'POST';

            await fetch(`${SERVER_URL}/api/content/${id}/like`, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            fetchContent();
        } catch (error) {
            console.error('Error liking content:', error);
        }
    };

    const handleBookmark = async () => {
        if (!user) {
            navigate('/signin');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const method = content?.userInteractions?.bookmarked ? 'DELETE' : 'POST';

            await fetch(`${SERVER_URL}/api/content/${id}/bookmark`, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            fetchContent();
        } catch (error) {
            console.error('Error bookmarking content:', error);
        }
    };

    const handleSubmitComment = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            navigate('/signin');
            return;
        }

        if (!commentText.trim()) return;

        try {
            setSubmittingComment(true);
            setCommentError(null);
            const token = localStorage.getItem('token');

            const res = await fetch(`${SERVER_URL}/api/content/${id}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ commentText })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to submit comment');
            }

            setCommentText('');
            fetchContent();
        } catch (error) {
            console.error('Error submitting comment:', error);
            const msg = error instanceof Error ? error.message : 'Failed to submit comment';
            setCommentError(msg);
        } finally {
            setSubmittingComment(false);
        }
    };

    const handleHideComment = async (commentId: string) => {
        if (!confirm('Are you sure you want to remove this comment?')) return;

        try {
            await contentService.moderateComment(commentId, 'hidden');
            // Remove from local state
            setComments(prev => prev.filter(c => c.id !== commentId));
        } catch (error) {
            console.error('Error removing comment:', error);
            addToast('Failed to remove comment', 'error');
        }
    };

    if (loading) {
        return (
            <div className="page-container" style={{ padding: '0' }}>
                <Skeleton height={300} borderRadius="0" />
                <div style={{ padding: '1.5rem' }}>
                    <Skeleton height={40} width="80%" style={{ marginBottom: '1rem' }} />
                    <Skeleton height={20} width="40%" style={{ marginBottom: '2rem' }} />
                    <Skeleton height={100} style={{ marginBottom: '1rem' }} />
                    <Skeleton height={100} style={{ marginBottom: '1rem' }} />
                </div>
            </div>
        );
    }

    if (!content) {
        return (
            <div className="content-detail-error">
                <h2>Content not found</h2>
                <button onClick={() => navigate('/my-luma')}>Back to My Luma</button>
            </div>
        );
    }

    return (

        <div className="page-container">
            <main className="page-content">
                <div className="content-detail">
                    <button className="btn-neutral" onClick={() => navigate('/my-luma')} style={{ width: 'auto', marginBottom: '2rem', padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                        ← Back to My Luma
                    </button>

                    <article className="content-article">
                        <header className="article-header">
                            <div className="article-meta">
                                <span className="category-badge">{content.category}</span>
                                {content.isPremium && (
                                    <span className="premium-badge">
                                        {content.premiumTier === 'premium_plus' ? 'Premium+' : 'Premium'}
                                    </span>
                                )}
                            </div>

                            <h1>{content.title}</h1>

                            <div className="article-info">
                                <span className="author">By {content.authorName}</span>
                                <span className="date">
                                    {content.publishedAt ? new Date(content.publishedAt).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    }) : ''}
                                </span>
                            </div>

                            <div className="article-stats">
                                <span>👁 {content.viewCount} views</span>
                                <span>❤️ {content.likesCount} likes</span>
                                <span>💬 {content.commentsCount} comments</span>
                            </div>

                            {content.contentType === 'event' && (
                                <div style={{ marginTop: '1.5rem', padding: '1.5rem', backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '12px' }}>
                                    <h3 style={{ margin: '0 0 1rem 0', color: '#1E3A8A', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>📅 Event Details</h3>
                                    {content.eventDate && (
                                        <div style={{ marginBottom: '0.5rem', color: '#1E40AF', fontWeight: 500 }}>
                                            <strong>When:</strong> {new Date(content.eventDate).toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                                        </div>
                                    )}
                                    {content.eventLocation && (
                                        <div style={{ color: '#1E40AF', fontWeight: 500 }}>
                                            <strong>Where:</strong> {content.eventLocation}
                                        </div>
                                    )}
                                </div>
                            )}

                            {content.contentType === 'promotion' && (
                                <div style={{ marginTop: '1.5rem', padding: '1.5rem', backgroundColor: '#FEFCE8', border: '1px solid #FEF08A', borderRadius: '12px', textAlign: 'center' }}>
                                    <h3 style={{ margin: '0 0 0.5rem 0', color: '#854D0E' }}>🏷️ Special Promotion</h3>
                                    {content.discountValue && (
                                        <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary-color)', marginBottom: '1rem' }}>
                                            {content.discountValue}
                                        </div>
                                    )}
                                    {content.discountCode && (
                                        <div style={{ display: 'inline-block', padding: '0.75rem 1.5rem', backgroundColor: '#FFFFFF', border: '2px dashed #CA8A04', borderRadius: '8px', fontSize: '1.25rem', fontWeight: 700, color: '#854D0E', letterSpacing: '2px' }}>
                                            {content.discountCode}
                                        </div>
                                    )}
                                </div>
                            )}
                        </header>

                        {/* Sponsor Section */}
                        {content.sponsorName && (
                            <div className="sponsor-section">
                                <span className="sponsor-label">Sponsored by</span>
                                {content.sponsorLink ? (
                                    <a href={content.sponsorLink} target="_blank" rel="noopener noreferrer" className="sponsor-link">
                                        {content.sponsorLogoUrl && (
                                            <img src={content.sponsorLogoUrl} alt={content.sponsorName} />
                                        )}
                                        <span>{content.sponsorName}</span>
                                    </a>
                                ) : (
                                    <div className="sponsor-info">
                                        {content.sponsorLogoUrl && (
                                            <img src={content.sponsorLogoUrl} alt={content.sponsorName} />
                                        )}
                                        <span>{content.sponsorName}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Video Player */}
                        {content.videoUrl && (content.contentType === 'video' || content.contentType === 'mixed') && (
                            <div className="video-container">
                                <video controls className="content-video">
                                    <source src={`${SERVER_URL}${content.videoUrl}`} type="video/mp4" />
                                    Your browser does not support video playback.
                                </video>
                            </div>
                        )}

                        {content.contentType !== 'video' && (
                            <div className="article-body">
                                {content.hasAccess ? (
                                    <div dangerouslySetInnerHTML={{ __html: (content.body || '').replace(/\n/g, '<br/>') }} />
                                ) : (
                                    <div className="locked-content">
                                        <div className="locked-message" style={{
                                            padding: '3rem',
                                            textAlign: 'center',
                                            backgroundColor: '#F3F4F6',
                                            borderRadius: '12px',
                                            margin: '2rem 0'
                                        }}>
                                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
                                            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                                                This content is locked
                                            </h3>
                                            <p style={{ color: '#6B7280', marginBottom: '1.5rem' }}>
                                                Upgrade to <strong>{content.premiumTier === 'premium_plus' ? 'Premium+' : 'Premium'}</strong> to continue reading this article and access other exclusive content.
                                            </p>
                                            <button
                                                className="btn-primary"
                                                onClick={() => navigate('/subscription')}
                                                style={{
                                                    background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--primary-hover) 100%)',
                                                    padding: '0.75rem 2rem',
                                                    fontSize: '1rem'
                                                }}
                                            >
                                                Unlock Now
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="article-actions">
                            <button
                                className={`action-button ${content.userInteractions?.liked ? 'active' : ''}`}
                                onClick={handleLike}
                            >
                                ❤️ {content.userInteractions?.liked ? 'Liked' : 'Like'}
                            </button>
                            <button
                                className={`action-button ${content.userInteractions?.bookmarked ? 'active' : ''}`}
                                onClick={handleBookmark}
                            >
                                🔖 {content.userInteractions?.bookmarked ? 'Saved' : 'Save'}
                            </button>
                            <button
                                className="action-button"
                                onClick={() => shareContent(
                                    content.title,
                                    content.excerpt,
                                    window.location.href
                                )}
                            >
                                📤 Share
                            </button>
                        </div>
                    </article>

                    {/* Comments Section */}
                    <section className="comments-section" style={{ paddingBottom: '80px', position: 'relative' }}>
                        <h2>Comments ({content.commentsCount})</h2>

                        <div className="comments-list">
                            {comments.map((comment) => (
                                <div key={comment.id} className="comment">
                                    <div className="comment-header">
                                        <div className="comment-author">
                                            {comment.author.profileImageUrl && (
                                                <img src={comment.author.profileImageUrl} alt={comment.author.displayName} />
                                            )}
                                            <span
                                                className="author-name"
                                                onClick={(e) => { e.stopPropagation(); if (comment.author?.id) navigate(`/users/${comment.author.id}`); }}
                                                style={{ cursor: comment.author?.id ? 'pointer' : 'default', textDecoration: comment.author?.id ? 'underline' : 'none', textUnderlineOffset: '2px' }}
                                            >
                                                {comment.author.displayName || comment.author.username}
                                            </span>
                                        </div>
                                        <span className="comment-date">
                                            {new Date(comment.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="comment-text">{comment.commentText}</p>

                                    {/* Moderation Controls */}
                                    {user && (user.id === comment.author.id || user.id === content.authorId) && (
                                        <button
                                            className="moderation-btn"
                                            onClick={() => handleHideComment(comment.id)}
                                            style={{
                                                marginTop: '8px',
                                                fontSize: '12px',
                                                color: '#EF4444',
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                padding: 0
                                            }}
                                        >
                                            🗑️ Remove
                                        </button>
                                    )}
                                </div>
                            ))}

                            {comments.length === 0 && (
                                <p className="no-comments">No comments yet. Be the first to comment!</p>
                            )}
                        </div>

                        {/* Sticky Add Comment Input */}
                        {user ? (
                            <form
                                className="comment-form"
                                onSubmit={handleSubmitComment}
                                style={{
                                    position: 'sticky',
                                    bottom: '-1.5rem', /* Align with content container padding */
                                    background: 'var(--bg-color)',
                                    padding: '1rem 0',
                                    margin: '0',
                                    borderTop: '1px solid var(--border-color)',
                                    zIndex: 10,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.5rem'
                                }}
                            >
                                {commentError && (
                                    <div style={{
                                        background: 'rgba(255, 107, 107, 0.1)',
                                        border: '1px solid rgba(255, 107, 107, 0.3)',
                                        borderRadius: '10px',
                                        padding: '0.75rem 1rem',
                                        color: '#ff4444',
                                        fontSize: '0.9rem',
                                        textAlign: 'center'
                                    }}>
                                        {commentError}
                                    </div>
                                )}
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <textarea
                                        value={commentText}
                                        onChange={(e) => setCommentText(e.target.value)}
                                        placeholder="Share your thoughts..."
                                        rows={1}
                                        style={{
                                            flex: 1,
                                            padding: '0.75rem 1rem',
                                            borderRadius: '1.5rem',
                                            border: '1px solid var(--border-color)',
                                            boxShadow: '0 2px 5px rgba(0,0,0,0.02)',
                                            resize: 'none',
                                            margin: 0
                                        }}
                                        disabled={submittingComment}
                                    />
                                    <button
                                        type="submit"
                                        disabled={submittingComment || !commentText.trim()}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: commentText.trim() ? 'var(--primary-color)' : 'var(--text-secondary)',
                                            fontWeight: 600,
                                            cursor: commentText.trim() ? 'pointer' : 'not-allowed',
                                            opacity: submittingComment ? 0.5 : 1,
                                            padding: '0.5rem',
                                            fontSize: '1rem'
                                        }}
                                    >
                                        {submittingComment ? '⏳' : '↑'}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="comment-login-prompt" style={{
                                position: 'sticky',
                                bottom: '-1.5rem',
                                background: 'var(--bg-color)',
                                padding: '1rem 0',
                                borderTop: '1px solid var(--border-color)',
                                zIndex: 10
                            }}>
                                <p>Please <a href="/signin">sign in</a> to comment</p>
                            </div>
                        )}
                    </section>
                </div>
            </main>
            <BottomNav />
        </div>
    );
};

export default ContentDetail;
