import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

const BottomNav: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { socket } = useSocket();
    const { user } = useAuth();
    const [unreadCount, setUnreadCount] = React.useState(0);

    React.useEffect(() => {
        const fetchUnreadCount = async () => {
            try {
                const { notificationService } = await import('../services/notification.service');
                const data = await notificationService.getAll({ limit: 1 });
                setUnreadCount(data.unreadCount);
            } catch (error) {
                console.error('Failed to fetch unread count', error);
            }
        };

        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 60000);
        return () => clearInterval(interval);
    }, []);

    // Real-time: increment on new_notification socket event
    React.useEffect(() => {
        if (!socket) return;
        const handler = () => setUnreadCount(prev => prev + 1);
        socket.on('new_notification', handler);
        return () => { socket.off('new_notification', handler); };
    }, [socket]);

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
                className={`nav-item ${isActive('/notifications') ? 'active' : ''}`}
                onClick={() => navigate('/notifications')}
                style={{ position: 'relative' }}
            >
                <div className="nav-icon" style={{ backgroundColor: 'currentColor' }}>🔔</div>
                <span>Alerts</span>
                {unreadCount > 0 && (
                    <span className="nav-badge">
                        {unreadCount > 99 ? '99+' : unreadCount}
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
