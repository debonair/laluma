import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { userService, type PublicProfile as ProfileData } from '../services/user.service';
import BottomNav from '../components/BottomNav';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ArrowLeft, BadgeCheck } from 'lucide-react';
import apiClient, { SERVER_URL } from '../services/api';
import { connectionService } from '../services/connection.service';

const PublicProfile: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();

    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { addToast } = useToast();

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

    const [isMessaging, setIsMessaging] = useState(false);

    const handleMessageClick = async () => {
        if (!profile || isMessaging) return;

        try {
            setIsMessaging(true);
            const response = await apiClient.post<{ conversationId: string }>('/messages/init', {
                recipientId: profile.id
            });
            navigate(`/messages/${response.data.conversationId}`);
        } catch (err) {
            console.error("Failed to start conversation:", err);
            addToast("Could not start conversation. Please try again later.", "error");
        } finally {
            setIsMessaging(false);
        }
    };

    const [isWaving, setIsWaving] = useState(false);

    const handleWaveClick = async () => {
        if (!profile || isWaving) return;
        try {
            setIsWaving(true);
            await connectionService.sendRequest(profile.id);
            addToast("Wave sent! 👋", "success");
        } catch (err: any) {
            console.error("Failed to wave:", err);
            addToast(err.response?.data?.error || "Failed to wave", "error");
        } finally {
            setIsWaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <p>Loading profile...</p>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--bg-color)' }}>
                <div className="page-header" style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg)' }}>
                    <h1>Error</h1>
                </div>
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
    const profileImageUrl = profile.profile_image_url;
    const fullProfileImageUrl = profileImageUrl 
        ? (profileImageUrl.startsWith('/') ? `${SERVER_URL}${profileImageUrl}` : profileImageUrl)
        : null;

    return (
        <div className="page-container" style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', backgroundColor: 'var(--bg-color)' }}>
            <div className="page-header" style={{ position: 'sticky', top: 0, backgroundColor: 'var(--bg-color)', zIndex: 10 }}>
                <button onClick={() => navigate(-1)} className="icon-btn" aria-label="Go back">
                    <ArrowLeft size={24} />
                </button>
                <h1>
                    {profile.display_name || profile.username || 'User Profile'}
                </h1>
            </div>

            <main className="page-content" style={{ padding: '0', flex: 1 }}>
                {/* Profile Header Block */}
                <div className="card" style={{ padding: '2rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div
                        style={{
                            width: '100px',
                            height: '100px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--primary-light)',
                            color: 'var(--primary-dark)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            fontSize: '2.5rem',
                            marginBottom: '1rem',
                            border: '3px solid var(--primary-color)',
                            backgroundImage: fullProfileImageUrl ? `url(${fullProfileImageUrl})` : 'none',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                        }}
                    >
                        {!profile.profile_image_url && (profile.display_name || profile.username).charAt(0).toUpperCase()}
                    </div>

                    <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {profile.display_name || profile.username}
                        {profile.isVerified && <BadgeCheck style={{ color: '#3b82f6', width: '1.25rem', height: '1.25rem' }} />}
                    </h2>

                    <p style={{ margin: '0 0 1.25rem 0', color: 'var(--text-secondary)', fontSize: '1rem' }}>
                        @{profile.username}
                    </p>

                    {profile.motherhood_stage && (
                        <div className="badge badge-primary" style={{ padding: '0.5rem 1.25rem', marginBottom: '1.5rem' }}>
                            {profile.motherhood_stage}
                        </div>
                    )}

                    {!isOwnProfile && (
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                onClick={handleMessageClick}
                                disabled={isMessaging}
                                className="btn-secondary"
                                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                            >
                                <span style={{ fontSize: '1.2rem' }}>💬</span> Message
                            </button>
                            <button
                                onClick={handleWaveClick}
                                disabled={isWaving}
                                className="btn-primary"
                                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                            >
                                <span style={{ fontSize: '1.2rem' }}>👋</span> {isWaving ? "Waving..." : "Wave"}
                            </button>
                        </div>
                    )}
                </div>

                {/* Profile Details Block */}
                <div style={{ padding: '0 1rem' }}>
                    <div className="card" style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>About Me</h3>
                        <p style={{ color: profile.about_me ? 'var(--text-primary)' : 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.95rem', margin: 0 }}>
                            {profile.about_me || "This user hasn't written a bio yet."}
                        </p>
                    </div>

                    <div className="card">
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>Luma Activity</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div style={{ padding: '1rem', borderRadius: '12px', textAlign: 'center', backgroundColor: 'var(--primary-light)' }}>
                                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-dark)', marginBottom: '0.25rem' }}>
                                    {profile.stats.groups_created}
                                </div>
                                <div style={{ color: 'var(--primary-dark)', opacity: 0.8, fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Groups Led
                                </div>
                            </div>
                            <div style={{ padding: '1rem', borderRadius: '12px', textAlign: 'center', backgroundColor: 'rgba(0,0,0,0.03)' }}>
                                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                                    {profile.stats.posts_created}
                                </div>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Posts Shared
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <BottomNav />
        </div>
    );
};

export default PublicProfile;
