import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { House, Users, Sparkles, User, Shield } from 'lucide-react';
import { SERVER_URL } from '../services/api';

const BottomNav: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const { unreadMessagesCount, unreadNotificationsCount } = useNotification();

    const isActive = (path: string) => location.pathname === path;
    const isExploreActive = ['/explore', '/discover', '/my-luma', '/spaces', '/directory'].some(p => location.pathname.startsWith(p));
    const isSocialActive = ['/social', '/messages', '/groups'].some(p => location.pathname.startsWith(p));

    return (
        <div className="bottom-nav">
            <div
                className={`nav-item ${isActive('/') ? 'active' : ''}`}
                onClick={() => navigate('/')}
                style={{ position: 'relative' }}
            >
                <div className="nav-icon">
                    <House size={24} strokeWidth={1.5} />
                </div>
                <span>Home</span>
                {unreadNotificationsCount > 0 && (
                    <span className="nav-badge" style={{ backgroundColor: '#ff7675' }}>
                        {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
                    </span>
                )}
            </div>

            <div
                className={`nav-item ${isSocialActive ? 'active' : ''}`}
                onClick={() => navigate('/social')}
                style={{ position: 'relative' }}
            >
                <div className="nav-icon">
                    <Users size={24} strokeWidth={1.5} />
                </div>
                <span>Social</span>
                {unreadMessagesCount > 0 && (
                    <span className="nav-badge">
                        {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
                    </span>
                )}
            </div>

            <div
                className={`nav-item ${isExploreActive ? 'active' : ''}`}
                onClick={() => navigate('/explore')}
            >
                <div className="nav-icon">
                    <Sparkles size={24} strokeWidth={1.5} />
                </div>
                <span>Explore</span>
            </div>

            <div
                className={`nav-item ${isActive('/profile') ? 'active' : ''}`}
                onClick={() => navigate('/profile')}
            >
                <div className="nav-icon">
                    {user?.profileImageUrl ? (
                        <img
                            src={user.profileImageUrl.startsWith('/') ? `${SERVER_URL}${user.profileImageUrl}` : user.profileImageUrl}
                            alt="Profile"
                            style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                    ) : (
                        <User size={24} strokeWidth={1.5} />
                    )}
                </div>
                <span>Profile</span>
            </div>

            {user?.roles?.includes('app-admin') && (
                <div
                    className={`nav-item ${isActive('/admin') ? 'active' : ''}`}
                    onClick={() => navigate('/admin')}
                >
                    <div className="nav-icon">
                        <Shield size={24} strokeWidth={1.5} />
                    </div>
                    <span>Admin</span>
                </div>
            )}
        </div>
    );
};

export default BottomNav;
