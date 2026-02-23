import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/api';

import BottomNav from '../components/BottomNav';

const Profile: React.FC = () => {
    const { user, updateProfile } = useAuth();
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
            alert('Failed to upload image');
        }
    };

    if (!user) return <div>Loading...</div>;

    const profileImg = avatarUrl || user.profileImageUrl;
    const displayProfileName = isEditing ? editForm.displayName : (user.displayName || user.username);
    const displayAboutMe = isEditing ? editForm.aboutMe : (user.aboutMe || '');
    const displayMotherhoodStage = isEditing ? editForm.motherhoodStage : (user.motherhoodStage || '');

    return (
        <div className="page-container">
            <div className="page-header profile-header-actions">
                <h1>My Profile</h1>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    {user?.roles?.includes('app-admin') && (
                        <button
                            onClick={() => navigate('/admin/content')}
                            className="btn-secondary"
                            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                        >
                            Manage Content
                        </button>
                    )}
                    {!isEditing ? (
                        <button
                            onClick={handleEditClick}
                            className="btn-ghost"
                            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                        >
                            Edit
                        </button>
                    ) : (
                        <button
                            onClick={handleSave}
                            className="btn-primary"
                            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                        >
                            Save
                        </button>
                    )}
                </div>
            </div>

            <main className="page-content">
                <div className="content-card profile-avatar-section">
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
                        style={{ cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
                        title="Click to change avatar"
                    >
                        {profileImg ? (
                            <img
                                src={profileImg.startsWith('/') ? `http://localhost:3000${profileImg}` : profileImg}
                                alt="Avatar"
                                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                            />
                        ) : (
                            (displayProfileName || 'U').charAt(0).toUpperCase()
                        )}
                        <div style={{
                            position: 'absolute', bottom: 0, left: 0, right: 0,
                            background: 'rgba(0,0,0,0.5)', color: '#fff',
                            fontSize: '0.6rem', textAlign: 'center', padding: '2px 0'
                        }}>📷</div>
                    </div>
                    {isEditing ? (
                        <input
                            type="text"
                            value={editForm.displayName}
                            onChange={(e) => setEditForm(prev => ({ ...prev, displayName: e.target.value }))}
                            className="profile-name-input"
                        />
                    ) : (
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>{displayProfileName}</h2>
                    )}
                    <p className="helper-text">@{user.username}</p>
                </div>

                <div className="content-card">
                    <h3 className="profile-section-title">About Me</h3>
                    {isEditing ? (
                        <textarea
                            value={editForm.aboutMe}
                            onChange={(e) => setEditForm(prev => ({ ...prev, aboutMe: e.target.value }))}
                            rows={4}
                            placeholder="Tell us a bit about yourself..."
                        />
                    ) : (
                        <p style={{ fontStyle: displayAboutMe ? 'normal' : 'italic', color: displayAboutMe ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                            {displayAboutMe || "No bio yet."}
                        </p>
                    )}
                </div>

                <div className="content-card">
                    <h3 className="profile-section-title">My Journey</h3>

                    <div className="form-group">
                        <label>I am...</label>
                        {isEditing ? (
                            <select
                                value={editForm.motherhoodStage}
                                onChange={(e) => setEditForm(prev => ({ ...prev, motherhoodStage: e.target.value }))}
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
                                <span className="status-badge">{displayMotherhoodStage || "Not specified"}</span>
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
                        <label>Looking For</label>
                        <div className="tag-list">
                            {user.lookingFor && user.lookingFor.length > 0 ? (
                                user.lookingFor.map(tag => (
                                    <span key={tag} className="tag">
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

                {/* Bottom Nav Spacer */}
                <div style={{ height: '60px' }}></div>
            </main>
            <BottomNav />
        </div>
    );
};

export default Profile;
