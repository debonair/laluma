import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/api';

const BottomNav: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { socket } = useSocket();
    const { user } = useAuth();
    const [unreadNotifications, setUnreadNotifications] = React.useState(0);
    const [unreadMessages, setUnreadMessages] = React.useState(0);

    React.useEffect(() => {
        const fetchCounts = async () => {
            try {
                // Notifications
                const { notificationService } = await import('../services/notification.service');
                const notifData = await notificationService.getAll({ limit: 1 });
                setUnreadNotifications(notifData.unreadCount);

                // Messages
                const response = await apiClient.get<{ unreadCount: number }>('/messages/unread-count');
                setUnreadMessages(response.data.unreadCount);
            } catch (error) {
                console.error('Failed to fetch unread counts', error);
            }
        };

        fetchCounts();
        const interval = setInterval(fetchCounts, 60000);
        return () => clearInterval(interval);
    }, []);

    // Real-time: increment on new_notification socket event
    React.useEffect(() => {
        if (!socket) return;

        const handleNotification = () => setUnreadNotifications(prev => prev + 1);
        const handleMessage = (msg: any) => {
            // Only increment if we aren't currently viewing the conversation
            if (!location.pathname.includes(`/messages/${msg.conversationId}`)) {
                setUnreadMessages(prev => prev + 1);
            }
        };

        socket.on('new_notification', handleNotification);
        socket.on('new_message', handleMessage);

        return () => {
            socket.off('new_notification', handleNotification);
            socket.off('new_message', handleMessage);
        };
    }, [socket, location.pathname]);

    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="bottom-nav">
            <div
                className={`nav-item ${isActive('/') ? 'active' : ''}`}
                onClick={() => navigate('/')}
            >
                <div className="nav-icon" style={{ backgroundColor: 'currentColor' }}>🏠</div>
                <span>Home</span>
            </div>

            <div
                className={`nav-item ${isActive('/groups') ? 'active' : ''}`}
                onClick={() => navigate('/groups')}
            >
                <div className="nav-icon" style={{ backgroundColor: 'currentColor' }}>👥</div>
                <span>Groups</span>
            </div>

            <div
                className={`nav-item ${isActive('/my-luma') ? 'active' : ''}`}
                onClick={() => navigate('/my-luma')}
            >
                <div className="nav-icon" style={{ backgroundColor: 'currentColor' }}>📚</div>
                <span>My Luma</span>
            </div>

            <div
                className={`nav-item ${isActive('/discover') ? 'active' : ''}`}
                onClick={() => navigate('/discover')}
            >
                <div className="nav-icon" style={{ backgroundColor: 'currentColor' }}>✨</div>
                <span>Discover</span>
            </div>

            <div
                className={`nav-item ${isActive('/messages') || location.pathname.startsWith('/messages/') ? 'active' : ''}`}
                onClick={() => navigate('/messages')}
                style={{ position: 'relative' }}
            >
                <div className="nav-icon" style={{ backgroundColor: 'currentColor' }}>💬</div>
                <span>Chat</span>
                {unreadMessages > 0 && (
                    <span className="nav-badge">
                        {unreadMessages > 99 ? '99+' : unreadMessages}
                    </span>
                )}
            </div>

            <div
                className={`nav-item ${isActive('/notifications') ? 'active' : ''}`}
                onClick={() => navigate('/notifications')}
                style={{ position: 'relative' }}
            >
                <div className="nav-icon" style={{ backgroundColor: 'currentColor' }}>🔔</div>
                <span>Alerts</span>
                {unreadNotifications > 0 && (
                    <span className="nav-badge">
                        {unreadNotifications > 99 ? '99+' : unreadNotifications}
                    </span>
                )}
            </div>

            <div
                className={`nav-item ${isActive('/profile') ? 'active' : ''}`}
                onClick={() => navigate('/profile')}
            >
                <div className="nav-icon" style={{ backgroundColor: 'currentColor' }}>👤</div>
                <span>Profile</span>
            </div>

            {user?.roles?.includes('app-admin') && (
                <div
                    className={`nav-item ${isActive('/admin') ? 'active' : ''}`}
                    onClick={() => navigate('/admin')}
                >
                    <div className="nav-icon" style={{ backgroundColor: 'currentColor' }}>🛠️</div>
                    <span>Admin</span>
                </div>
            )}
        </div>
    );
};

export default BottomNav;
