import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGroup } from '../context/GroupContext';
import BottomNav from '../components/BottomNav';
import type { Group } from '../services/groups.service';
import type { Post, Comment } from '../services/posts.service';
import { postsService } from '../services/posts.service';

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

    useEffect(() => {
        const loadGroupData = async () => {
            if (!id) return;
            setLoading(true);
            const groupData = await getGroup(id);
            setGroup(groupData);
            if (groupData) {
                const postsData = await getGroupPosts(id);
                setPosts(postsData);
            }
            setLoading(false);
        };
        loadGroupData();
    }, [id, getGroup, getGroupPosts]);

    const isMember = group?.is_member || false;

    if (loading) {
        return <div className="page-container">Loading...</div>;
    }

    if (!group) {
        return <div className="page-container">Group not found</div>;
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
            await createPost(id, newPostContent);
            setNewPostContent('');
            // Reload posts
            const postsData = await getGroupPosts(id);
            setPosts(postsData);
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
            await addComment(postId, content);
            setCommentContent(prev => ({ ...prev, [postId]: '' }));
            // Reload comments to show new comment
            await loadComments(postId);
            // Reload posts to get updated comment count
            if (id) {
                const postsData = await getGroupPosts(id);
                setPosts(postsData);
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

    return (
        <div className="page-container">
            <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button onClick={() => navigate('/groups')} className="btn-link">
                    ←
                </button>
                <h1 style={{ fontSize: '1.2rem', margin: 0 }}>{group.name}</h1>
            </div>

            <main className="page-content">
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

                {/* Create Post */}
                {isMember && (
                    <div className="content-card" style={{ marginBottom: '1.5rem' }}>
                        <form onSubmit={handlePostSubmit}>
                            <textarea
                                value={newPostContent}
                                onChange={(e) => setNewPostContent(e.target.value)}
                                placeholder="Share something with the group..."
                                rows={3}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', resize: 'none' }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={!newPostContent.trim()}
                                    style={{ width: 'auto', padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                                >
                                    Post
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
                                <span style={{ fontWeight: 600 }}>{post.author?.username || 'Unknown'}</span>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                    {new Date(post.created_at).toLocaleDateString()}
                                </span>
                            </div>
                            <p style={{ marginBottom: '1rem' }}>{post.content}</p>

                            <div style={{ display: 'flex', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }}>
                                <button
                                    onClick={() => handleLike(post.id)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: post.is_liked ? 'var(--primary-color)' : 'var(--text-secondary)' }}
                                >
                                    ❤️ {post.likes_count}
                                </button>
                                <button
                                    onClick={() => toggleComments(post.id)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                                >
                                    💬 {post.comments_count}
                                </button>
                            </div>

                            {/* Comments Section */}
                            {showComments[post.id] && (
                                <div style={{ marginTop: '1rem', paddingLeft: '1rem', borderLeft: '2px solid var(--border-color)' }}>
                                    {loadingComments[post.id] ? (
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                                            Loading comments...
                                        </p>
                                    ) : (
                                        <>
                                            {/* Display Comments */}
                                            {comments[post.id] && comments[post.id].length > 0 ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                                                    {comments[post.id].map(comment => (
                                                        <div key={comment.id} style={{ fontSize: '0.9rem' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                                                <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>
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
                                        <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
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
                                                style={{ flex: 1, padding: '0.5rem', borderRadius: '1rem', border: '1px solid var(--border-color)' }}
                                            />
                                            <button
                                                onClick={() => handleCommentSubmit(post.id)}
                                                disabled={!commentContent[post.id]?.trim()}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    color: commentContent[post.id]?.trim() ? 'var(--primary-color)' : 'var(--text-secondary)',
                                                    fontWeight: 600,
                                                    cursor: commentContent[post.id]?.trim() ? 'pointer' : 'not-allowed'
                                                }}
                                            >
                                                Send
                                            </button>
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

                {/* Spacer for bottom nav */}
                <div style={{ height: '60px' }}></div>
            </main>
            <BottomNav />
        </div>
    );
};

export default GroupDetail;
