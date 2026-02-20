import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const BottomNav: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [unreadCount, setUnreadCount] = React.useState(0);

    React.useEffect(() => {
        const fetchUnreadCount = async () => {
            try {
                // We'll speculatively use the service we know exists
                // We might need to move this to a context if we want it to update live
                const { notificationService } = await import('../services/notification.service');
                const data = await notificationService.getAll({ limit: 1 });
                setUnreadCount(data.unreadCount);
            } catch (error) {
                console.error('Failed to fetch unread count', error);
            }
        };

        fetchUnreadCount();
        // Poll every minute
        const interval = setInterval(fetchUnreadCount, 60000);
        return () => clearInterval(interval);
    }, []);

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
                className={`nav-item ${isActive('/search') ? 'active' : ''}`}
                onClick={() => navigate('/search')}
            >
                <div className="nav-icon" style={{ backgroundColor: 'currentColor' }}>🔍</div>
                <span>Search</span>
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
        </div>
    );
};

export default BottomNav;
