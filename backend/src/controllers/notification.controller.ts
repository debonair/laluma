import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../utils/prisma';

// Get user notifications
export const getNotifications = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const userId = req.user!.userId;
        const limit = parseInt((typeof req.query.limit === 'string' ? req.query.limit : '20')) || 20;
        const offset = parseInt((typeof req.query.offset === 'string' ? req.query.offset : '0')) || 0;

        const [notifications, total] = await Promise.all([
            prisma.notification.findMany({
                where: { userId },
                take: limit,
                skip: offset,
                orderBy: { createdAt: 'desc' },
                include: {
                    actor: {
                        select: {
                            id: true,
                            username: true,
                            displayName: true,
                            profileImageUrl: true
                        }
                    }
                }
            }),
            prisma.notification.count({ where: { userId } })
        ]);

        const unreadCount = await prisma.notification.count({
            where: { userId, isRead: false }
        });

        res.json({
            notifications,
            pagination: {
                total,
                limit,
                offset,
                hasMore: offset + limit < total
            },
            unreadCount
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
};

// Mark notification as read
export const markAsRead = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.user!.userId;

        await prisma.notification.updateMany({
            where: {
                id: String(id),
                userId // Ensure user owns the notification
            },
            data: { isRead: true }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ error: 'Failed to mark notification as read' });
    }
};

// Mark all notifications as read
export const markAllAsRead = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const userId = req.user!.userId;

        await prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ error: 'Failed to mark all as read' });
    }
};
