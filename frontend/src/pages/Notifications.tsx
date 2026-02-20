import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationService } from '../services/notification.service';
import type { Notification } from '../types/notification';
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
        try {
            await notificationService.markAsRead(id);
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, isRead: true } : n)
            );
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await notificationService.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
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
            case 'like': return '❤️';
            case 'comment': return '💬';
            case 'reply': return '↩️';
            case 'system': return '🔔';
            default: return 'bell';
        }
    };

    if (loading && notifications.length === 0) {
        return <div className="loading-state">Loading notifications...</div>;
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
                                    {new Date(notification.createdAt).toLocaleDateString()}
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
        </div>
    );
};

export default Notifications;
