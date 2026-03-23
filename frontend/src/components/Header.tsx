import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Send, Bell, ArrowLeft, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { SERVER_URL } from '../services/api';
import './Header.css';

interface HeaderProps {
    title: string;
    subtitle?: string;
    rightAction?: React.ReactNode;
    showNavIcons?: boolean;
    showBack?: boolean;
    onBack?: () => void;
    showLogo?: boolean;
    children?: React.ReactNode;
}

const Header: React.FC<HeaderProps> = ({ 
    title, 
    subtitle, 
    rightAction, 
    showNavIcons = true,
    showBack,
    onBack,
    showLogo,
    children
}) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const { unreadNotificationsCount, unreadMessagesCount } = useNotification();

    // Top-level routes that normally don't need a back button
    const topLevelRoutes = [
        '/', 
        '/groups', 
        '/explore', 
        '/social', 
        '/profile', 
        '/discover', 
        '/directory', 
        '/notifications', 
        '/messages',
        '/my-luma'
    ];
    const isTopLevel = topLevelRoutes.includes(location.pathname);
    
    // Show back button if explicitly true, or if it's not a top-level route and showBack isn't explicitly false
    const shouldShowBack = showBack !== undefined ? showBack : !isTopLevel;

    // Show logo if on home page and not explicitly disabled, or if explicitly enabled
    const displayLogo = showLogo !== undefined ? showLogo : (location.pathname === '/' && !shouldShowBack);

    return (
        <header className="app-header">
            <div className="header-content">
                <div className="header-left">
                    {shouldShowBack && (
                        <button 
                            onClick={onBack || (() => navigate(-1))} 
                            className="icon-btn back-btn"
                            title="Go back"
                        >
                            <ArrowLeft size={20} />
                        </button>
                    )}
                    
                    {displayLogo ? (
                        <div className="header-logo" onClick={() => navigate('/')}>
                            LUMA
                        </div>
                    ) : (
                        <div className="header-titles">
                            <h1 className="header-main-title">{title}</h1>
                            {subtitle && <p className="header-subtitle">{subtitle}</p>}
                        </div>
                    )}
                </div>
                
                <div className="header-actions">
                    {rightAction}
                    {showNavIcons && (
                        <div className="nav-icons">
                            <button 
                                onClick={() => navigate('/notifications')} 
                                className="icon-btn"
                                title="Notifications"
                            >
                                <Bell size={24} strokeWidth={1.5} />
                                {unreadNotificationsCount > 0 && (
                                    <span className="header-badge">{unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}</span>
                                )}
                            </button>
                            <button 
                                onClick={() => navigate('/messages')} 
                                className="icon-btn"
                                title="Messages"
                            >
                                <Send size={24} strokeWidth={1.5} />
                                {unreadMessagesCount > 0 && (
                                    <span className="header-badge">{unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}</span>
                                )}
                            </button>
                            <button 
                                onClick={() => navigate('/profile')} 
                                className="avatar-btn"
                                title="Profile"
                            >
                                {user?.profileImageUrl ? (
                                    <img 
                                        src={user.profileImageUrl.startsWith('/') ? `${SERVER_URL}${user.profileImageUrl}` : user.profileImageUrl} 
                                        alt="Profile" 
                                        className="header-avatar" 
                                    />
                                ) : (
                                    <div className="header-avatar-placeholder">
                                        <UserIcon size={18} strokeWidth={1.5} />
                                    </div>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
            {children && <div className="header-extra">{children}</div>}
        </header>
    );
};

export default Header;
