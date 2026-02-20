import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { userService, type PublicProfile as ProfileData } from '../services/user.service';
import BottomNav from '../components/BottomNav';
import { useAuth } from '../context/AuthContext';

const PublicProfile: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();

    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            if (!id) return;
            try {
                setIsLoading(true);
                setError('');
                const data = await userService.getPublicProfile(id);
                setProfile(data);
            } catch (err) {
                console.error("Failed to fetch profile", err);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                setError((err as any).response?.data?.message || 'Failed to load user profile');
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, [id]);

    const handleMessageClick = () => {
        if (!profile) return;

        // This relies on the backend route /messages/send handling conversation creation 
        // transparently, but we can also just route them to an optimistic generic /messages/new route
        // For simplicity with the existing UI, let's just make sure they can navigate to a chat screen.
        // The ConversationDetail component requires an explicit :id of the conversation, not the user.
        // So we will jump to /messages, or we can add a new param to ConversationDetail to start a chat.
        // For now, let's navigate to the main Messages list and instruct them to use it, OR 
        // realistically we could call an API here to get-or-create the conversationId.

        // Let's implement the get-or-create conversation ID logic here visually if possible,
        // or just navigate them to a generic state.
        alert("Messaging feature integration coming soon via deep linking!");
    };

    if (isLoading) {
        return (
            <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <p>Loading profile...</p>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: 'var(--bg-color)' }}>
                <header className="page-header" style={{ display: 'flex', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                    <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', marginRight: '1rem', color: 'var(--text-primary)' }}>
                        ←
                    </button>
                    <h1 style={{ fontSize: '1.25rem', margin: 0 }}>Error</h1>
                </header>
                <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem', textAlign: 'center' }}>
                    <div>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
                        <h2 style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }}>{error || 'User not found'}</h2>
                        <button
                            onClick={() => navigate(-1)}
                            className="primary-button"
                            style={{ marginTop: '1rem' }}
                        >
                            Go Back
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const isOwnProfile = profile.id === currentUser?.id;

    return (
        <div className="page-container" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--bg-color)' }}>
            <header className="page-header" style={{ display: 'flex', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)', position: 'sticky', top: 0, backgroundColor: 'var(--bg-color)', zIndex: 10 }}>
                <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', marginRight: '1rem', color: 'var(--text-primary)' }}>
                    ←
                </button>
                <h1 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 600, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {profile.display_name || profile.username}
                </h1>
            </header>

            <main className="page-content" style={{ padding: '0', flex: 1 }}>
                {/* Profile Header Block */}
                <div style={{ backgroundColor: 'var(--card-bg)', padding: '2rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', borderBottom: '1px solid var(--border-color)' }}>
                    <div
                        style={{
                            width: '100px',
                            height: '100px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--primary-color)',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            fontSize: '2.5rem',
                            marginBottom: '1rem',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            backgroundImage: profile.profile_image_url ? `url(${profile.profile_image_url})` : 'none',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                        }}
                    >
                        {!profile.profile_image_url && (profile.display_name || profile.username).charAt(0).toUpperCase()}
                    </div>

                    <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {profile.display_name || profile.username}
                    </h2>

                    <p style={{ margin: '0 0 1rem 0', color: 'var(--text-secondary)', fontSize: '1rem' }}>
                        @{profile.username}
                    </p>

                    {profile.motherhood_stage && (
                        <div style={{ display: 'inline-block', padding: '0.4rem 1rem', backgroundColor: 'var(--primary-light)', color: 'var(--primary-dark)', borderRadius: '20px', fontSize: '0.9rem', fontWeight: 600, marginBottom: '1.5rem' }}>
                            {profile.motherhood_stage}
                        </div>
                    )}

                    {!isOwnProfile && (
                        <button
                            onClick={handleMessageClick}
                            className="primary-button"
                            style={{ padding: '0.75rem 2rem', fontSize: '1rem', borderRadius: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            <span style={{ fontSize: '1.2rem' }}>💬</span> Message
                        </button>
                    )}
                </div>

                {/* Profile Details Block */}
                <div style={{ padding: '1.5rem 1rem' }}>
                    <div style={{ marginBottom: '2rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>About Me</h3>
                        <p style={{ color: profile.about_me ? 'var(--text-primary)' : 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.95rem', margin: 0 }}>
                            {profile.about_me || "This user hasn't written a bio yet."}
                        </p>
                    </div>

                    <div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem' }}>Luma Activity</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div style={{ backgroundColor: 'var(--card-bg)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-color)', marginBottom: '0.25rem' }}>
                                    {profile.stats.groups_created}
                                </div>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500 }}>
                                    Groups Led
                                </div>
                            </div>
                            <div style={{ backgroundColor: 'var(--card-bg)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-color)', marginBottom: '0.25rem' }}>
                                    {profile.stats.posts_created}
                                </div>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500 }}>
                                    Posts Shared
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ height: '80px' }} />
            </main>

            <BottomNav />
        </div>
    );
};

export default PublicProfile;
