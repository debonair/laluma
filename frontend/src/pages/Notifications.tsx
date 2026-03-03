import React, { useEffect, useState } from 'react';
import BottomNav from '../components/BottomNav';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { notificationService } from '../services/notification.service';
import type { Notification } from '../types/notification';
import { Heart, MessageCircle, CornerDownRight, Bell } from 'lucide-react';
import './Notifications.css';

const Notifications: React.FC = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [offset, setOffset] = useState(0);
    const LIMIT = 20;
    const navigate = useNavigate();

    const fetchNotifications = async (currentOffset: number, isLoadMore = false) => {
        try {
            if (isLoadMore) setLoadingMore(true);
            else setLoading(true);

            const data = await notificationService.getAll({ limit: LIMIT, offset: currentOffset });

            if (isLoadMore) {
                setNotifications(prev => [...prev, ...data.notifications]);
            } else {
                setNotifications(data.notifications);
            }

            setHasMore(data.pagination.hasMore);
            setOffset(currentOffset + LIMIT);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        fetchNotifications(0);
    }, []);

    const handleLoadMore = () => {
        fetchNotifications(offset, true);
    };

    const handleMarkAsRead = async (id: string, isRead: boolean) => {
        if (isRead) return;

        // Optimistic UI: Immediately mark as read in local state
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, isRead: true } : n)
        );

        try {
            await notificationService.markAsRead(id);
        } catch (error) {
            console.error('Error marking as read:', error);
            // Revert state if api fails (optional, but good practice if critical)
        }
    };

    const handleMarkAllRead = async () => {
        // Optimistic UI
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));

        try {
            await notificationService.markAllAsRead();
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const handleNotificationClick = (notification: Notification) => {
        handleMarkAsRead(notification.id, notification.isRead);

        if (notification.metadata?.contentId) {
            navigate(`/my-luma/${notification.metadata.contentId}`);
        } else if (notification.actor?.username) {
            navigate(`/profile/${notification.actor.username}`);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'like': return <Heart size={20} className="text-pink-500" strokeWidth={2.5} color="var(--primary-hover)" />;
            case 'comment': return <MessageCircle size={20} className="text-blue-500" strokeWidth={2.5} color="#3B82F6" />;
            case 'reply': return <CornerDownRight size={20} className="text-teal-500" strokeWidth={2.5} color="var(--primary-color)" />;
            case 'system': return <Bell size={20} className="text-yellow-500" strokeWidth={2.5} color="#F59E0B" />;
            default: return <Bell size={20} strokeWidth={2.5} color="#6B7280" />;
        }
    };

    if (loading && notifications.length === 0) {
        return (
            <div className="page-container">
                <div className="notifications-header">
                    <h1>Notifications</h1>
                </div>
                <div className="notifications-list">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="notification-item" style={{ border: 'none', background: 'transparent', padding: '1rem 0' }}>
                            <div className="avatar skeleton"></div>
                            <div className="notification-content" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <div className="skeleton" style={{ height: '16px', width: '80%', borderRadius: '4px' }}></div>
                                <div className="skeleton" style={{ height: '12px', width: '40%', borderRadius: '4px' }}></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="page-container">
            <div className="notifications-header">
                <h1>Notifications</h1>
                {notifications.some(n => !n.isRead) && (
                    <button onClick={handleMarkAllRead} className="mark-all-btn">
                        Mark all as read
                    </button>
                )}
            </div>

            {notifications.length === 0 ? (
                <div className="empty-state">
                    <p>No notifications yet</p>
                </div>
            ) : (
                <div className="notifications-list">
                    {notifications.map(notification => (
                        <div
                            key={notification.id}
                            className={`notification-item ${notification.isRead ? 'read' : 'unread'}`}
                            onClick={() => handleNotificationClick(notification)}
                        >
                            <div className="notification-icon-badge">
                                {getIcon(notification.type)}
                            </div>
                            <div className="avatar">
                                {notification.actor?.profileImageUrl ? (
                                    <img src={notification.actor.profileImageUrl} alt={notification.actor.username} />
                                ) : (
                                    <div className="avatar-placeholder">
                                        {notification.actor?.username?.[0]?.toUpperCase() || '?'}
                                    </div>
                                )}
                            </div>
                            <div className="notification-content">
                                <p>
                                    <span className="actor-name">{notification.actor?.displayName || notification.actor?.username || 'System'}</span>
                                    {' '}{notification.message}
                                </p>
                                <span className="timestamp">
                                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                </span>
                            </div>
                            {!notification.isRead && <div className="unread-dot" />}
                        </div>
                    ))}

                    {hasMore && (
                        <button
                            className="load-more-btn"
                            onClick={handleLoadMore}
                            disabled={loadingMore}
                        >
                            {loadingMore ? 'Loading...' : 'Load More'}
                        </button>
                    )}
                </div>
            )}
            <BottomNav />
        </div>
    );
};

export default Notifications;
