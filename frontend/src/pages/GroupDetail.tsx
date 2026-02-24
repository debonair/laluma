import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGroup } from '../context/GroupContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import BottomNav from '../components/BottomNav';
import apiClient from '../services/api';
import type { Group } from '../services/groups.service';
import type { Post, Comment } from '../services/posts.service';
import { postsService } from '../services/posts.service';
import { shareContent } from '../utils/share';

interface GroupMember {
    id: string;
    userId: string;
    username: string;
    displayName?: string;
    profileImageUrl?: string;
    role: string;
    joinedAt: string;
}

const GroupDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { getGroup, getGroupPosts, joinGroup, leaveGroup, createPost, addComment, likePost } = useGroup();
    const [group, setGroup] = useState<Group | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [newPostContent, setNewPostContent] = useState('');
    const [commentContent, setCommentContent] = useState<{ [postId: string]: string }>({});
    const [showComments, setShowComments] = useState<{ [postId: string]: boolean }>({});
    const [comments, setComments] = useState<{ [postId: string]: Comment[] }>({});
    const [loadingComments, setLoadingComments] = useState<{ [postId: string]: boolean }>({});
    const [showMembers, setShowMembers] = useState(false);
    const [members, setMembers] = useState<GroupMember[]>([]);
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [submittingPost, setSubmittingPost] = useState(false);
    const [postError, setPostError] = useState<string | null>(null);
    const [submittingComment, setSubmittingComment] = useState<{ [postId: string]: boolean }>({});
    const [commentError, setCommentError] = useState<{ [postId: string]: string | null }>({});
    const { user } = useAuth();
    const { addToast } = useToast();

    // Pull-to-refresh state
    const [pullDistance, setPullDistance] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [startY, setStartY] = useState(0);

    const handleTouchStart = (e: React.TouchEvent) => {
        if (window.scrollY <= 0) {
            setStartY(e.touches[0].clientY);
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (startY > 0 && window.scrollY <= 0) {
            const y = e.touches[0].clientY;
            const distance = Math.max(0, y - startY);
            if (distance > 0 && distance < 100) {
                setPullDistance(distance);
            }
        }
    };

    const handleTouchEnd = async () => {
        if (pullDistance > 60) {
            setIsRefreshing(true);
            if (id) {
                const groupData = await getGroup(id);
                setGroup(groupData);
                if (groupData) {
                    const postsData = await getGroupPosts(id);
                    setPosts(postsData);
                }
            }
            setIsRefreshing(false);
        }
        setStartY(0);
        setPullDistance(0);
    };

    const loadMembers = async () => {
        if (!id) return;
        setLoadingMembers(true);
        try {
            const res = await apiClient.get<GroupMember[]>(`/groups/${id}/members`);
            setMembers(res.data);
        } catch (err) {
            console.error('Failed to load members', err);
        } finally {
            setLoadingMembers(false);
        }
    };

    const handleRemoveMember = async (memberId: string) => {
        if (!id || !confirm('Remove this member?')) return;
        try {
            await apiClient.delete(`/groups/${id}/members/${memberId}`);
            loadMembers();
        } catch (err) {
            console.error(err);
            addToast('Failed to remove member', 'error');
        }
    };

    const handleChangeRole = async (memberId: string, role: string) => {
        if (!id) return;
        try {
            await apiClient.patch(`/groups/${id}/members/${memberId}/role`, { role });
            loadMembers();
        } catch (err) {
            console.error(err);
            addToast('Failed to update role', 'error');
        }
    };

    useEffect(() => {
        const loadGroupData = async () => {
            if (!id) return;
            setLoading(true);
            const groupData = await getGroup(id);
            setGroup(groupData);
            if (groupData) {
                const postsData = await getGroupPosts(id);
                setPosts(postsData);
                // Preemptively load members so we know the user's role for moderation
                try {
                    const res = await apiClient.get<GroupMember[]>(`/groups/${id}/members`);
                    setMembers(res.data);
                } catch (e) { }
            }
            setLoading(false);
        };
        loadGroupData();
    }, [id, getGroup, getGroupPosts]);

    const isMember = group?.is_member || false;

    if (loading && !isRefreshing) {
        return (
            <div className="page-container">
                <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div className="skeleton" style={{ width: '24px', height: '24px', borderRadius: '50%' }}></div>
                    <div className="skeleton" style={{ width: '150px', height: '24px', borderRadius: '4px' }}></div>
                </div>
                <main className="page-content">
                    <div className="content-card skeleton" style={{ height: '200px', width: '100%' }}></div>
                    <div className="content-card skeleton" style={{ height: '120px', width: '100%' }}></div>
                    <div className="content-card skeleton" style={{ height: '120px', width: '100%' }}></div>
                </main>
                <BottomNav />
            </div>
        );
    }

    if (!group) {
        return (
            <div className="page-container">
                <main className="page-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚷</div>
                    <h2 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Group Not Found</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', maxWidth: '300px' }}>
                        The group you're looking for doesn't exist or has been deleted.
                    </p>
                    <button className="btn-primary" onClick={() => navigate('/groups')}>
                        Back to Groups
                    </button>
                </main>
                <BottomNav />
            </div>
        );
    }

    const handleJoinLeave = async () => {
        if (!id) return;
        if (isMember) {
            await leaveGroup(id);
        } else {
            await joinGroup(id);
        }
        // Reload group data
        const groupData = await getGroup(id);
        setGroup(groupData);
    };

    const handlePostSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPostContent.trim() && id) {
            try {
                setSubmittingPost(true);
                setPostError(null);
                await createPost(id, newPostContent);
                setNewPostContent('');
                // Reload posts
                const postsData = await getGroupPosts(id);
                setPosts(postsData);
            } catch (err) {
                console.error("Failed to post:", err);
                const msg = err instanceof Error ? err.message : "Failed to create post. Please try again.";
                setPostError(msg);
            } finally {
                setSubmittingPost(false);
            }
        }
    };

    const loadComments = async (postId: string) => {
        setLoadingComments(prev => ({ ...prev, [postId]: true }));
        try {
            const response = await postsService.getComments(postId);
            setComments(prev => ({ ...prev, [postId]: response.comments }));
        } catch (error) {
            console.error('Error loading comments:', error);
        } finally {
            setLoadingComments(prev => ({ ...prev, [postId]: false }));
        }
    };

    const handleCommentSubmit = async (postId: string) => {
        const content = commentContent[postId];
        if (content && content.trim()) {
            try {
                setSubmittingComment(prev => ({ ...prev, [postId]: true }));
                setCommentError(prev => ({ ...prev, [postId]: null }));
                await addComment(postId, content);
                setCommentContent(prev => ({ ...prev, [postId]: '' }));
                // Reload comments to show new comment
                await loadComments(postId);
                // Reload posts to get updated comment count
                if (id) {
                    const postsData = await getGroupPosts(id);
                    setPosts(postsData);
                }
            } catch (err) {
                console.error("Failed to add comment:", err);
                const msg = err instanceof Error ? err.message : "Failed to post comment.";
                setCommentError(prev => ({ ...prev, [postId]: msg }));
            } finally {
                setSubmittingComment(prev => ({ ...prev, [postId]: false }));
            }
        }
    };

    const toggleComments = async (postId: string) => {
        const isCurrentlyShown = showComments[postId];
        setShowComments(prev => ({ ...prev, [postId]: !prev[postId] }));

        // Load comments when opening for the first time
        if (!isCurrentlyShown && !comments[postId]) {
            await loadComments(postId);
        }
    };

    const handleLike = async (postId: string) => {
        await likePost(postId);
        // Reload posts to get updated like count
        if (id) {
            const postsData = await getGroupPosts(id);
            setPosts(postsData);
        }
    };

    const handleDeletePost = async (postId: string) => {
        if (!confirm('Are you sure you want to delete this post?')) return;
        try {
            await postsService.deletePost(postId);
            if (id) {
                const postsData = await getGroupPosts(id);
                setPosts(postsData);
            }
        } catch (err) {
            console.error("Failed to delete post:", err);
            addToast('Failed to delete post.', 'error');
        }
    };

    return (
        <div
            className="page-container"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button onClick={() => navigate('/groups')} className="btn-link">
                    ←
                </button>
                <h1>{group.name}</h1>
            </div>

            <main className="page-content">
                {/* Pull to refresh spinner */}
                {pullDistance > 0 && (
                    <div style={{
                        height: `${pullDistance}px`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        color: 'var(--text-secondary)',
                        transition: isRefreshing ? 'height 0.3s' : 'none'
                    }}>
                        {isRefreshing ? 'Refreshing...' : pullDistance > 60 ? 'Release to refresh' : 'Pull down to refresh'}
                    </div>
                )}

                {/* Group Header Info */}
                <div className="content-card" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>{group.image_emoji || '👥'}</div>
                    <p style={{ color: 'var(--text-secondary)' }}>{group.description}</p>
                    <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary-color)' }}>
                        {group.member_count} Members
                    </p>
                    <button
                        className={isMember ? 'btn-secondary' : 'btn-primary'}
                        onClick={handleJoinLeave}
                        style={{ marginTop: '1rem' }}
                    >
                        {isMember ? 'Leave Group' : 'Join Group'}
                    </button>
                </div>

                {/* Members Panel */}
                {isMember && (
                    <div className="content-card" style={{ marginBottom: '1.5rem' }}>
                        <button
                            className="btn-ghost"
                            onClick={() => { setShowMembers(prev => !prev); if (!showMembers) loadMembers(); }}
                            style={{ width: '100%', padding: '0.5rem', fontSize: '0.9rem' }}
                        >
                            {showMembers ? '▼ Hide Members' : '▶ View Members'}
                        </button>

                        {showMembers && (
                            <div style={{ marginTop: '0.75rem' }}>
                                {loadingMembers ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.5rem 0' }}>
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="skeleton" style={{ height: '40px', width: '100%', borderRadius: '8px' }}></div>
                                        ))}
                                    </div>
                                ) : (
                                    members.map(m => {
                                        const isCurrentUserAdmin = members.find(me => me.userId === user?.id)?.role === 'admin';
                                        return (
                                            <div key={m.id} style={{
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)'
                                            }}>
                                                <div>
                                                    <span
                                                        onClick={(e) => { e.stopPropagation(); if (m.userId) navigate(`/users/${m.userId}`); }}
                                                        style={{ fontWeight: 600, fontSize: '0.9rem', cursor: m.userId ? 'pointer' : 'default' }}
                                                    >
                                                        {m.displayName || m.username}
                                                    </span>
                                                    <span style={{
                                                        marginLeft: '0.5rem', fontSize: '0.7rem', padding: '1px 6px',
                                                        borderRadius: '8px', backgroundColor: m.role === 'admin' ? '#8B5CF620' : '#6B728020',
                                                        color: m.role === 'admin' ? '#8B5CF6' : '#6B7280'
                                                    }}>
                                                        {m.role}
                                                    </span>
                                                </div>
                                                {isCurrentUserAdmin && m.userId !== user?.id && (
                                                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                                                        <select
                                                            value={m.role}
                                                            onChange={(e) => handleChangeRole(m.userId, e.target.value)}
                                                            style={{ fontSize: '0.75rem', padding: '2px 4px', borderRadius: '4px' }}
                                                        >
                                                            <option value="member">member</option>
                                                            <option value="moderator">moderator</option>
                                                            <option value="admin">admin</option>
                                                        </select>
                                                        <button
                                                            onClick={() => handleRemoveMember(m.userId)}
                                                            style={{
                                                                background: 'none', border: 'none', cursor: 'pointer',
                                                                color: '#EF4444', fontSize: '0.85rem'
                                                            }}
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Create Post */}
                {isMember && (
                    <div className="content-card" style={{ marginBottom: '1.5rem' }}>
                        {postError && (
                            <div style={{
                                background: 'rgba(255, 107, 107, 0.1)',
                                border: '1px solid rgba(255, 107, 107, 0.3)',
                                borderRadius: '10px',
                                padding: '0.75rem 1rem',
                                color: '#ff4444',
                                fontSize: '0.9rem',
                                marginBottom: '1rem',
                                textAlign: 'center'
                            }}>
                                {postError}
                            </div>
                        )}
                        <form onSubmit={handlePostSubmit}>
                            <textarea
                                value={newPostContent}
                                onChange={(e) => setNewPostContent(e.target.value)}
                                placeholder="Share something with the group..."
                                rows={3}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', resize: 'none' }}
                                disabled={submittingPost}
                            />
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={!newPostContent.trim() || submittingPost}
                                    style={{ width: 'auto', padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                                >
                                    {submittingPost ? 'Posting...' : 'Post'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Feed */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {posts.map(post => (
                        <div key={post.id} className="content-card" style={{ padding: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span
                                    onClick={(e) => { e.stopPropagation(); if (post.author?.id) navigate(`/users/${post.author.id}`); }}
                                    style={{ fontWeight: 600, cursor: post.author?.id ? 'pointer' : 'default' }}
                                >
                                    {post.author?.username || 'Unknown'}
                                </span>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                    {new Date(post.created_at).toLocaleDateString()}
                                </span>
                            </div>
                            <p style={{ marginBottom: '1rem' }}>{post.content}</p>

                            <div style={{ display: 'flex', gap: '0.25rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem', marginLeft: '-0.5rem' }}>
                                <button
                                    className="icon-btn"
                                    onClick={() => handleLike(post.id)}
                                    style={{ color: post.is_liked ? 'var(--primary-color)' : 'var(--text-secondary)' }}
                                >
                                    ❤️ <span style={{ marginLeft: '0.25rem', fontSize: '0.9rem' }}>{post.likes_count}</span>
                                </button>
                                <button
                                    className="icon-btn"
                                    onClick={() => toggleComments(post.id)}
                                    style={{ color: 'var(--text-secondary)' }}
                                >
                                    💬 <span style={{ marginLeft: '0.25rem', fontSize: '0.9rem' }}>{post.comments_count}</span>
                                </button>
                                <button
                                    className="icon-btn"
                                    onClick={() => shareContent(
                                        `Post by ${post.author?.username || 'a member'} in ${group?.name}`,
                                        post.content,
                                        `${window.location.origin}/groups/${group?.id}`
                                    )}
                                    style={{ color: 'var(--text-secondary)' }}
                                >
                                    📤 <span style={{ marginLeft: '0.25rem', fontSize: '0.9rem' }}>Share</span>
                                </button>
                                {((post.author?.id === user?.id) || members.some(m => m.userId === user?.id && ['admin', 'moderator'].includes(m.role))) && (
                                    <button
                                        className="icon-btn"
                                        onClick={() => handleDeletePost(post.id)}
                                        style={{ color: '#EF4444', marginLeft: 'auto' }}
                                    >
                                        🗑️ <span style={{ marginLeft: '0.25rem', fontSize: '0.9rem' }}>Delete</span>
                                    </button>
                                )}
                            </div>

                            {/* Comments Section */}
                            {showComments[post.id] && (
                                <div style={{ marginTop: '1rem', paddingLeft: '1rem', borderLeft: '2px solid var(--border-color)' }}>
                                    {loadingComments[post.id] ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                                            {[1, 2].map(i => (
                                                <div key={i} className="skeleton" style={{ height: '50px', width: '100%', borderRadius: '8px' }}></div>
                                            ))}
                                        </div>
                                    ) : (
                                        <>
                                            {/* Display Comments */}
                                            {comments[post.id] && comments[post.id].length > 0 ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                                                    {comments[post.id].map(comment => (
                                                        <div key={comment.id} style={{ fontSize: '0.9rem' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                                                <span
                                                                    onClick={(e) => { e.stopPropagation(); if (comment.author?.id) navigate(`/users/${comment.author.id}`); }}
                                                                    style={{ fontWeight: 600, fontSize: '0.85rem', cursor: comment.author?.id ? 'pointer' : 'default' }}
                                                                >
                                                                    {comment.author?.username || 'Unknown'}
                                                                </span>
                                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                                    {new Date(comment.created_at).toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                            <p style={{ margin: 0, color: 'var(--text-primary)' }}>
                                                                {comment.content}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                                                    No comments yet. Be the first to comment!
                                                </p>
                                            )}
                                        </>
                                    )}

                                    {/* Add Comment Input */}
                                    {isMember && (
                                        <div style={{
                                            position: 'sticky',
                                            bottom: '-1rem', /* Align with content container padding */
                                            background: 'var(--card-bg)',
                                            padding: '1rem 0',
                                            marginTop: '0.5rem',
                                            borderTop: '1px solid var(--border-color)',
                                            zIndex: 2
                                        }}>
                                            {commentError[post.id] && (
                                                <div style={{ color: '#ff4444', fontSize: '0.85rem', marginBottom: '0.5rem', padding: '0.5rem', background: 'rgba(255, 107, 107, 0.1)', borderRadius: '0.5rem' }}>
                                                    {commentError[post.id]}
                                                </div>
                                            )}
                                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                <input
                                                    type="text"
                                                    placeholder="Write a comment..."
                                                    value={commentContent[post.id] || ''}
                                                    onChange={(e) => setCommentContent(prev => ({ ...prev, [post.id]: e.target.value }))}
                                                    onKeyPress={(e) => {
                                                        if (e.key === 'Enter' && !e.shiftKey) {
                                                            e.preventDefault();
                                                            handleCommentSubmit(post.id);
                                                        }
                                                    }}
                                                    style={{ flex: 1, padding: '0.75rem 1rem', borderRadius: '1.5rem', border: '1px solid var(--border-color)', boxShadow: '0 2px 5px rgba(0,0,0,0.02)' }}
                                                    disabled={submittingComment[post.id]}
                                                />
                                                <button
                                                    onClick={() => handleCommentSubmit(post.id)}
                                                    disabled={!commentContent[post.id]?.trim() || submittingComment[post.id]}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        color: commentContent[post.id]?.trim() ? 'var(--primary-color)' : 'var(--text-secondary)',
                                                        fontWeight: 600,
                                                        cursor: commentContent[post.id]?.trim() ? 'pointer' : 'not-allowed',
                                                        opacity: submittingComment[post.id] ? 0.5 : 1,
                                                        padding: '0.5rem',
                                                        fontSize: '1rem'
                                                    }}
                                                >
                                                    {submittingComment[post.id] ? '⏳' : '↑'}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                    {posts.length === 0 && (
                        <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No posts yet. Be the first to share!</p>
                    )}
                </div>
            </main>
            <BottomNav />
        </div>
    );
};

export default GroupDetail;
