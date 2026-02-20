import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useGroup } from '../context/GroupContext';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';

const Home: React.FC = () => {
    const { user, signOut } = useAuth();
    const { feed } = useGroup();
    const navigate = useNavigate();

    const handleSignOut = () => {
        signOut();
        navigate('/signin');
    };

    return (
        <div className="page-container">
            <header className="page-header">
                <h1>Welcome, {user?.displayName || user?.username}!</h1>
            </header>
            <main className="page-content">
                <div className="content-card">
                    <h3>Your Dashboard</h3>
                    <p>This is your safe space. Connect with other mothers near you.</p>

                    {user?.location && (
                        <div className="dashboard-info">
                            <strong>Current Settings:</strong>
                            <ul style={{ margin: '0.5rem 0 0 1rem', padding: 0 }}>
                                <li><strong>Status:</strong> {user.motherhoodStage}</li>
                                <li><strong>Radius:</strong> {user.location.anywhere ? 'Anywhere' : `${user.location.radius} km`}</li>
                            </ul>
                        </div>
                    )}

                    <div style={{ marginTop: '1.5rem', display: 'flex', justifySelf: 'center' }}>
                        <button onClick={handleSignOut} className="btn-ghost" style={{ color: '#EF4444' }}>
                            Sign Out
                        </button>
                    </div>
                </div>

                <div className="content-card" style={{ marginTop: '1rem' }}>
                    <h3>Community Activity</h3>
                    {feed.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {feed.slice(0, 3).map(post => (
                                <div
                                    key={post.id}
                                    onClick={() => navigate(`/groups/${post.group_id}`)}
                                    style={{
                                        cursor: 'pointer',
                                        borderBottom: '1px solid var(--border-color)',
                                        padding: '0.75rem 0',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '0.25rem'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--primary-color)' }}>
                                            {post.author?.username || 'Unknown'}
                                        </span>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                            {new Date(post.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {post.content}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                        in {post.group.name || 'a group'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>Join groups to see activity here!</p>
                            <button onClick={() => navigate('/groups')} className="btn-primary" style={{ width: 'auto', padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                                Discover Groups
                            </button>
                        </div>
                    )}
                </div>

                {/* Spacer for bottom nav */}
                <div style={{ height: '60px' }}></div>
            </main>

            <BottomNav />
        </div>
    );
};

export default Home;
