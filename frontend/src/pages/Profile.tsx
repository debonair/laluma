import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { BadgeCheck, Download, Trash2, ShieldCheck, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import Skeleton from '../components/Skeleton';
import apiClient from '../services/api';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import { SERVER_URL } from '../services/api';

import './Profile.css';

const Profile: React.FC = () => {
    const { user, updateProfile, updateAvatar, signOut } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Form state initialized only when editing
    const [editForm, setEditForm] = useState({
        displayName: '',
        aboutMe: '',
        radius: 10,
        anywhere: false,
        motherhoodStage: ''
    });
    
    // Privacy / Danger Zone state
    const [isDangerZoneOpen, setIsDangerZoneOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');

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
            await updateAvatar(formData);
            addToast('Profile picture updated!', 'success');
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

    const handleExportData = async () => {
        setIsExporting(true);
        try {
            const response = await apiClient.get('/privacy/export', {
                responseType: 'blob'
            });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `luma-data-export-${user?.id}.json`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            
            addToast('Data export started successfully', 'success');
        } catch (err) {
            console.error('Export failed:', err);
            addToast('Failed to export data', 'error');
        } finally {
            setIsExporting(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (deleteConfirmText !== 'DELETE') {
            addToast('Please type DELETE to confirm', 'error');
            return;
        }

        try {
            await apiClient.delete('/privacy/account');
            addToast('Your account has been permanently deleted', 'success');
            signOut();
            navigate('/signin');
        } catch (err) {
            console.error('Deletion failed:', err);
            addToast('Failed to delete account', 'error');
        }
    };

    if (!user) {
        return (
            <div className="page-container page-loading-padding">
                <Skeleton height={200} borderRadius="12px" className="mb-2" />
                <Skeleton height={40} width="60%" className="mb-1" />
                <Skeleton height={20} width="40%" className="mb-2" />
                <Skeleton height={150} borderRadius="8px" />
            </div>
        );
    }

    const profileImg = user.profileImageUrl;
    const displayProfileName = isEditing ? editForm.displayName : (user.displayName || user.username);
    const displayAboutMe = isEditing ? editForm.aboutMe : (user.aboutMe || '');
    const displayMotherhoodStage = isEditing ? editForm.motherhoodStage : (user.motherhoodStage || '');

    const RightActions = (
        <div className="profile-header-actions">
            {user?.roles?.includes('app-admin') && (
                <button
                    onClick={() => navigate('/admin/content')}
                    className="btn-secondary profile-admin-btn"
                >
                    Admin
                </button>
            )}
            {!isEditing ? (
                <button
                    onClick={handleEditClick}
                    className="btn-ghost profile-edit-btn"
                >
                    Edit
                </button>
            ) : (
                <button
                    onClick={handleSave}
                    className="btn-primary profile-save-btn"
                >
                    Save
                </button>
            )}
        </div>
    );

    return (
        <div className="page-container profile-page-wrapper">
            <Header 
                title="My Profile" 
                subtitle={`@${user.username}`}
                rightAction={RightActions}
            />

            <main className="page-content">
                {/* Hero Banner Section */}
                <div className="profile-hero">
                    <div className="profile-hero-content">
                        {isEditing ? (
                            <input
                                type="text"
                                value={editForm.displayName}
                                onChange={(e) => setEditForm(prev => ({ ...prev, displayName: e.target.value }))}
                                className="input-field profile-name-input"
                            />
                        ) : (
                            <h2 className="profile-display-name">
                                {displayProfileName}
                                {user.isVerified && <BadgeCheck className="verified-badge-icon" size={24} />}
                            </h2>
                        )}
                        <p className="profile-username-text">@{user.username}</p>
                    </div>

                    <div className="profile-avatar-wrapper">
                        <input
                            type="file"
                            ref={fileInputRef}
                            accept="image/*"
                            onChange={handleAvatarUpload}
                            className="hidden"
                        />
                        <div
                            className="profile-avatar-container"
                            onClick={() => fileInputRef.current?.click()}
                            title="Click to change avatar"
                        >
                            {profileImg ? (
                                <img
                                    src={profileImg.startsWith('/') ? `${SERVER_URL}${profileImg}` : profileImg}
                                    alt="Avatar"
                                    className="profile-avatar-img"
                                />
                            ) : (
                                <div className="profile-avatar-placeholder">
                                    {(displayProfileName || 'U').charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div className="profile-avatar-overlay">📷</div>
                        </div>
                    </div>
                </div>

                <div className="profile-content-body">
                    {!user.isVerified && !isEditing && (
                        <div className="verification-prompt">
                            <ShieldCheck className="verification-icon" size={20} />
                            <div className="verification-text">
                                <h4>Verify Your Identity</h4>
                                <p>Build trust in the community.</p>
                            </div>
                            <button
                                onClick={handleRequestVerification}
                                className="btn-secondary profile-verify-btn"
                            >
                                Get Verified
                            </button>
                        </div>
                    )}

                    <div className="card profile-info-card">
                        <h3 className="profile-section-title">About Me</h3>
                        {isEditing ? (
                            <textarea
                                value={editForm.aboutMe}
                                onChange={(e) => setEditForm(prev => ({ ...prev, aboutMe: e.target.value }))}
                                rows={4}
                                placeholder="Tell us a bit about yourself..."
                                className="input-field profile-bio-textarea"
                            />
                        ) : (
                            <p className={`profile-bio-text ${!displayAboutMe ? 'profile-bio-empty' : ''}`}>
                                {displayAboutMe || "No bio yet. Tap Edit to introduce yourself!"}
                            </p>
                        )}
                    </div>

                    <div className="card profile-info-card">
                        <h3 className="profile-section-title">My Journey</h3>
                        
                        <div className="profile-info-group">
                            <label className="profile-info-label">Current Stage</label>
                            {isEditing ? (
                                <select 
                                    value={editForm.motherhoodStage}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, motherhoodStage: e.target.value }))}
                                    className="input-field"
                                >
                                    <option value="">Select Stage...</option>
                                    <option value="expecting">Expecting</option>
                                    <option value="new_mom">New Mom (0-12m)</option>
                                    <option value="toddler_years">Toddler Years (1-3y)</option>
                                    <option value="school_age">School Age</option>
                                    <option value="teens">Teens & Up</option>
                                    <option value="empty_nester">Empty Nester</option>
                                </select>
                            ) : (
                                <div className="profile-info-value">
                                    {displayMotherhoodStage ? (
                                        <span className="stage-badge">{displayMotherhoodStage.replace('_', ' ')}</span>
                                    ) : (
                                        <span className="not-provided">Not specified</span>
                                    )}
                                </div>
                            )}
                        </div>

                        {isEditing && (
                            <div className="profile-info-group location-group mt-4">
                                <label className="profile-info-label">Discover Radius (miles)</label>
                                <div className="radius-control">
                                    <input 
                                        type="range" 
                                        min="1" 
                                        max="50" 
                                        value={editForm.radius}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, radius: parseInt(e.target.value) }))}
                                        disabled={editForm.anywhere}
                                        className="range-slider flex-1"
                                    />
                                    <span className="radius-value">{editForm.radius} mi</span>
                                </div>
                                
                                <label className="checkbox-label mt-2">
                                    <input 
                                        type="checkbox"
                                        checked={editForm.anywhere}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, anywhere: e.target.checked }))}
                                    />
                                    <span>Match with moms anywhere (Global)</span>
                                </label>
                            </div>
                        )}
                    </div>

                    {/* Danger Zone Accordion */}
                    <div className="danger-zone-wrapper">
                        <button 
                            className="danger-zone-toggle"
                            onClick={() => setIsDangerZoneOpen(!isDangerZoneOpen)}
                        >
                            <div className="danger-zone-title">
                                <AlertTriangle size={18} />
                                <span>Privacy & Account Actions</span>
                            </div>
                            {isDangerZoneOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </button>
                        
                        {isDangerZoneOpen && (
                            <div className="danger-zone-content">
                                <div className="danger-action-row">
                                    <div className="danger-action-info">
                                        <h4>Export Personal Data</h4>
                                        <p>Download a copy of your messages, posts, and profile data.</p>
                                    </div>
                                    <button 
                                        onClick={handleExportData} 
                                        className="btn-secondary profile-export-btn"
                                        disabled={isExporting}
                                    >
                                        <Download size={16} className="mr-2" />
                                        {isExporting ? 'Exporting...' : 'Export'}
                                    </button>
                                </div>

                                <div className="danger-action-row delete-row">
                                    <div className="danger-action-info">
                                        <h4>Delete Account</h4>
                                        <p>Permanently remove your account and all associated data.</p>
                                    </div>
                                    <div className="delete-controls">
                                        <input
                                            type="text"
                                            value={deleteConfirmText}
                                            onChange={(e) => setDeleteConfirmText(e.target.value)}
                                            placeholder="Type DELETE"
                                            className="input-field delete-input"
                                        />
                                        <button 
                                            onClick={handleDeleteAccount} 
                                            className="btn-danger profile-delete-btn"
                                            disabled={deleteConfirmText !== 'DELETE'}
                                        >
                                            <Trash2 size={16} className="mr-2" />
                                            Delete
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="danger-action-row signout-row">
                                    <button onClick={handleSignOut} className="btn-outline profile-signout-btn full-width">
                                        Sign Out
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
            <BottomNav />
        </div>
    );
};

export default Profile;
