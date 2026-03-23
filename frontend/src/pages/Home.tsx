import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useGroup } from '../context/GroupContext';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { Users, Compass, BadgeCheck, Shield, MapPin, Baby, MessageSquare } from 'lucide-react';
import PollUI from '../components/PollUI';
import ReactionButton from '../components/ReactionButton';
import Header from '../components/Header';
import './Home.css';

const Home: React.FC = () => {
    const { user } = useAuth();
    const { feed, isLoading, updatePollInFeed, likePost, unlikePost } = useGroup();
    const navigate = useNavigate();

    const handleLike = async (postId: string, reactionType: string = 'like') => {
        try {
            const post = feed.find(p => p.id === postId);
            if (!post) return;
            
            const isTogglingOff = post.is_liked && post.user_reaction_type === reactionType;
            if (isTogglingOff) {
                await unlikePost(postId);
            } else {
                await likePost(postId, reactionType);
            }
        } catch (error) {
            console.error('Failed to toggle like:', error);
        }
    };

    return (
        <div className="home-container page-container">
            <Header title="Home" showNavIcons={true} />
            
            <main className="page-content">
                <section className="glass-card welcome-widget">
                    <h3>Hello, {user?.displayName || user?.username || 'Mama'} ✨</h3>
                    <p>This is your safe space. Connect, share, and grow with other mothers near you.</p>

                    {user?.location && (
                        <div className="dashboard-info-pills">
                            <div className="info-pill">
                                <Baby size={16} />
                                <span><strong>Stage:</strong> {user.motherhoodStage}</span>
                            </div>
                            <div className="info-pill">
                                <MapPin size={16} />
                                <span><strong>Radius:</strong> {user.location.anywhere ? 'Anywhere' : `${user.location.radius} km`}</span>
                            </div>
                        </div>
                    )}
                </section>

                {user?.roles?.includes('app-admin') && (
                    <section className="glass-card admin-widget">
                        <div className="admin-header">
                            <Shield size={24} color="var(--primary-color)" />
                            <h3>Admin Dashboard</h3>
                        </div>
                        <p>Manage community safety, moderate posts, and review reports.</p>
                        <button
                            onClick={() => navigate('/admin')}
                            className="btn-primary"
                        >
                            Open Moderation Tools
                        </button>
                    </section>
                )}

                <section className="feed-section">
                    <div className="section-header">
                        <h3>Community Activity</h3>
                        {feed.length > 0 && <span className="status-indicator">Latest</span>}
                    </div>

                    <div className="activity-feed">
                        {isLoading ? (
                            <>
                                <div className="skeleton-card"></div>
                                <div className="skeleton-card"></div>
                                <div className="skeleton-card"></div>
                            </>
                        ) : feed.length > 0 ? (
                            feed.slice(0, 5).map(post => (
                                <article
                                    key={post.id}
                                    className="activity-card"
                                    onClick={() => navigate(`/groups/${post.group?.id}`)}
                                >
                                    <div className="activity-card-header">
                                        <div 
                                            className="author-info"
                                            onClick={(e) => { e.stopPropagation(); if (post.author?.id) navigate(`/users/${post.author.id}`); }}
                                        >
                                            <span className="author-name">{post.author?.display_name || post.author?.username || 'Unknown User'}</span>
                                            {post.author?.isVerified && (
                                                <span className="verified-badge"><BadgeCheck size={16} /></span>
                                            )}
                                        </div>
                                        <span className="post-timestamp">
                                            {new Date(post.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </span>
                                    </div>

                                    <div className="post-content-preview">
                                        {post.content}
                                    </div>

                                    {post.poll && (
                                        <PollUI 
                                            poll={post.poll} 
                                            onVote={(updatedPoll) => updatePollInFeed(post.id, updatedPoll)}
                                        />
                                    )}

                                    <div className="post-group-context">
                                        in {post.group?.name || 'Community Hub'}
                                    </div>

                                    <div className="activity-card-footer">
                                        <ReactionButton 
                                            postId={post.id} 
                                            isLiked={!!post.is_liked} 
                                            likesCount={post.likes_count || 0} 
                                            userReactionType={post.user_reaction_type || null}
                                            onReact={(postId, reactionType) => handleLike(postId, reactionType)}
                                            onToggleDefault={(postId) => handleLike(postId, post.user_reaction_type || 'like')}
                                        />
                                        <div className="interaction-stat">
                                            <MessageSquare size={18} />
                                            <span>{post.comments_count || 0}</span>
                                        </div>
                                    </div>
                                </article>
                            ))
                        ) : (
                            <div className="empty-activity">
                                <div className="empty-icon-box">
                                    <Users size={40} strokeWidth={1.5} />
                                </div>
                                <h3>Your feed is quiet...</h3>
                                <p>Join local groups to see what other mothers are sharing in your area!</p>
                                <button
                                    onClick={() => navigate('/groups')}
                                    className="btn-primary center-btn"
                                >
                                    <Compass size={18} />
                                    Discover Communities
                                </button>
                            </div>
                        )}
                    </div>
                </section>
            </main>

            <BottomNav />
        </div>
    );
};

export default Home;
