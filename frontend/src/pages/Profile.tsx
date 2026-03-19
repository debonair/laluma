import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { BadgeCheck } from 'lucide-react';
import Skeleton from '../components/Skeleton';
import apiClient from '../services/api';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import { SERVER_URL } from '../services/api';

const Profile: React.FC = () => {
    const { user, updateProfile, signOut } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

    // Form state initialized only when editing
    const [editForm, setEditForm] = useState({
        displayName: '',
        aboutMe: '',
        radius: 10,
        anywhere: false,
        motherhoodStage: ''
    });

    const handleEditClick = () => {
        setEditForm({
            displayName: user?.displayName || user?.username || '',
            aboutMe: user?.aboutMe || '',
            radius: user?.location?.radius || 10,
            anywhere: user?.location?.anywhere || false,
            motherhoodStage: user?.motherhoodStage || ''
        });
        setIsEditing(true);
    };

    const handleSave = () => {
        updateProfile({
            displayName: editForm.displayName,
            aboutMe: editForm.aboutMe,
            location: { radius: editForm.radius, anywhere: editForm.anywhere },
            motherhoodStage: editForm.motherhoodStage
        });
        setIsEditing(false);
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('avatar', file);

        try {
            const res = await apiClient.post<{ profileImageUrl: string }>('/users/me/avatar', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setAvatarUrl(res.data.profileImageUrl);
        } catch (err) {
            console.error('Avatar upload failed:', err);
            addToast('Failed to upload image', 'error');
        }
    };

    const handleRequestVerification = async () => {
        try {
            await apiClient.post('/users/me/verify', { verificationMethod: 'manual' });
            addToast('Verification approved!', 'success');
            setTimeout(() => window.location.reload(), 1000);
        } catch (err) {
            addToast('Verification failed', 'error');
        }
    };

    const handleSignOut = () => {
        signOut();
        navigate('/signin');
    };

    if (!user) {
        return (
            <div className="page-container" style={{ padding: '2rem' }}>
                <Skeleton height={200} borderRadius="12px" style={{ marginBottom: '2rem' }} />
                <Skeleton height={40} width="60%" style={{ marginBottom: '1rem' }} />
                <Skeleton height={20} width="40%" style={{ marginBottom: '2rem' }} />
                <Skeleton height={150} borderRadius="8px" />
            </div>
        );
    }

    const profileImg = avatarUrl || user.profileImageUrl;
    const displayProfileName = isEditing ? editForm.displayName : (user.displayName || user.username);
    const displayAboutMe = isEditing ? editForm.aboutMe : (user.aboutMe || '');
    const displayMotherhoodStage = isEditing ? editForm.motherhoodStage : (user.motherhoodStage || '');

    const RightActions = (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
            {user?.roles?.includes('app-admin') && (
                <button
                    onClick={() => navigate('/admin/content')}
                    className="btn-secondary"
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                >
                    Admin
                </button>
            )}
            {!isEditing ? (
                <button
                    onClick={handleEditClick}
                    className="btn-ghost"
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                >
                    Edit
                </button>
            ) : (
                <button
                    onClick={handleSave}
                    className="btn-primary"
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                >
                    Save
                </button>
            )}
        </div>
    );

    return (
        <div className="page-container">
            <Header 
                title="My Profile" 
                subtitle={`@${user.username}`}
                rightAction={RightActions}
            />

            <main className="page-content">
                <div className="card" style={{ marginBottom: '1.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        style={{ display: 'none' }}
                    />
                    <div
                        className="profile-avatar"
                        onClick={() => fileInputRef.current?.click()}
                        style={{ cursor: 'pointer', position: 'relative', overflow: 'hidden', width: '100px', height: '100px', borderRadius: '50%', marginBottom: '1rem', border: '3px solid var(--primary-color)' }}
                        title="Click to change avatar"
                    >
                        {profileImg ? (
                            <img
                                src={profileImg.startsWith('/') ? `${SERVER_URL}${profileImg}` : profileImg}
                                alt="Avatar"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--primary-light)', color: 'var(--primary-dark)', fontSize: '2rem', fontWeight: 700 }}>
                                {(displayProfileName || 'U').charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div style={{
                            position: 'absolute', bottom: 0, left: 0, right: 0,
                            background: 'rgba(0,0,0,0.5)', color: '#fff',
                            fontSize: '0.6rem', textAlign: 'center', padding: '2px 0'
                        }}>📷</div>
                    </div >
                    {
                        isEditing ? (
                            <input
                                type="text"
                                value={editForm.displayName}
                                onChange={(e) => setEditForm(prev => ({ ...prev, displayName: e.target.value }))}
                                className="input-field"
                                style={{ textAlign: 'center', fontSize: '1.25rem' }}
                            />
                        ) : (
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                {displayProfileName}
                                {user.isVerified && <BadgeCheck style={{ color: '#3b82f6', width: '1.25rem', height: '1.25rem' }} />}
                            </h2>
                        )}
                    <p className="helper-text" style={{ marginBottom: '1rem' }}>@{user.username}</p>

                    {!user.isVerified && !isEditing && (
                        <button
                            onClick={handleRequestVerification}
                            className="btn-secondary"
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', marginTop: '0.5rem', borderRadius: '4px' }}
                        >
                            Get Verified Shield
                        </button>
                    )}
                </div >

                <div className="card" style={{ marginBottom: '1.5rem' }}>
                    <h3 className="profile-section-title" style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.75rem' }}>About Me</h3>
                    {isEditing ? (
                        <textarea
                            value={editForm.aboutMe}
                            onChange={(e) => setEditForm(prev => ({ ...prev, aboutMe: e.target.value }))}
                            rows={4}
                            placeholder="Tell us a bit about yourself..."
                            className="input-field"
                            style={{ width: '100%', resize: 'none' }}
                        />
                    ) : (
                        <p style={{ margin: 0, fontStyle: displayAboutMe ? 'normal' : 'italic', color: displayAboutMe ? 'var(--text-primary)' : 'var(--text-secondary)', lineHeight: 1.6 }}>
                            {displayAboutMe || "No bio yet."}
                        </p>
                    )}
                </div>

                <div className="card">
                    <h3 className="profile-section-title" style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>My Journey</h3>

                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>I am...</label>
                        {isEditing ? (
                            <select
                                value={editForm.motherhoodStage}
                                onChange={(e) => setEditForm(prev => ({ ...prev, motherhoodStage: e.target.value }))}
                                className="input-field"
                                style={{ width: '100%' }}
                            >
                                <option value="">Select...</option>
                                <option value="A new mom">A new mom</option>
                                <option value="A mom of young children">A mom of young children</option>
                                <option value="Parenting through the ages">Parenting through the ages</option>
                                <option value="Empty nest mom">Empty nest mom</option>
                                <option value="Its a mixed bag">Its a mixed bag</option>
                            </select>
                        ) : (
                            <div>
                                <span className="badge badge-primary" style={{ padding: '0.5rem 1rem' }}>{displayMotherhoodStage || "Not specified"}</span>
                            </div>
                        )}
                    </div>

                    <div className="form-group">
                        <label>Location Settings</label>
                        {isEditing ? (
                            <div className="edit-panel">
                                <div style={{ marginBottom: '0.5rem' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                                        <input type="checkbox" checked={editForm.anywhere} onChange={(e) => setEditForm(prev => ({ ...prev, anywhere: e.target.checked }))} />
                                        Connect with anyone (Anywhere)
                                    </label>
                                </div>
                                <div style={{ opacity: editForm.anywhere ? 0.5 : 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                                        <span>Max Distance</span>
                                        <span>{editForm.radius} km</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="1"
                                        max="100"
                                        value={editForm.radius}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, radius: Number(e.target.value) }))}
                                        disabled={editForm.anywhere}
                                        style={{ width: '100%' }}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div style={{ fontWeight: 500 }}>
                                {user.location?.anywhere ? "Anywhere" : `Within ${user.location?.radius} km`}
                            </div>
                        )}
                    </div>

                    <div className="form-group">
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Looking For</label>
                        <div className="tag-list" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {user.lookingFor && user.lookingFor.length > 0 ? (
                                user.lookingFor.map(tag => (
                                    <span key={tag} className="badge">
                                        {tag}
                                    </span>
                                ))
                            ) : (
                                <span className="helper-text">Nothing selected</span>
                            )}
                        </div>
                        {isEditing && (
                            <p className="helper-text">
                                *To edit 'Looking For' tags, please go through the onboarding flow again.
                            </p>
                        )}
                    </div>
                </div>

                {!isEditing && (
                    <div style={{ marginTop: '2rem', padding: '0 1rem', display: 'flex', justifyContent: 'center' }}>
                        <button 
                            onClick={handleSignOut} 
                            className="btn-ghost" 
                            style={{ 
                                color: '#EF4444', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '0.5rem',
                                padding: '0.75rem 1.5rem',
                                borderRadius: '12px',
                                border: '1px solid #FEE2E2'
                            }}
                        >
                            Sign Out
                        </button>
                    </div>
                )}
            </main >
            <BottomNav />
        </div >
    );
};

export default Profile;
