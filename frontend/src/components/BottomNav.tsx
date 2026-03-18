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
    const [unreadMessages, setUnreadMessages] = React.useState(0);

    React.useEffect(() => {
        const fetchCounts = async () => {
            try {
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

        const handleMessage = (msg: any) => {
            // Only increment if we aren't currently viewing the conversation
            if (!location.pathname.includes(`/messages/${msg.conversationId}`)) {
                setUnreadMessages(prev => prev + 1);
            }
        };

        socket.on('new_message', handleMessage);

        return () => {
            socket.off('new_message', handleMessage);
        };
    }, [socket, location.pathname]);

    const isActive = (path: string) => location.pathname === path;
    const isExploreActive = ['/explore', '/discover', '/my-luma', '/spaces', '/directory'].some(p => location.pathname.startsWith(p));
    const isSocialActive = ['/social', '/messages', '/groups'].some(p => location.pathname.startsWith(p));

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
                className={`nav-item ${isSocialActive ? 'active' : ''}`}
                onClick={() => navigate('/social')}
                style={{ position: 'relative' }}
            >
                <div className="nav-icon" style={{ backgroundColor: 'currentColor' }}>👥</div>
                <span>Social</span>
                {unreadMessages > 0 && (
                    <span className="nav-badge">
                        {unreadMessages > 99 ? '99+' : unreadMessages}
                    </span>
                )}
            </div>

            <div
                className={`nav-item ${isExploreActive ? 'active' : ''}`}
                onClick={() => navigate('/explore')}
            >
                <div className="nav-icon" style={{ backgroundColor: 'currentColor' }}>✨</div>
                <span>Explore</span>
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
