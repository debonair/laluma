import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../utils/prisma';
import { emitNotification } from '../utils/notify';
import { registerDeviceToken, removeDeviceToken, sendEventReminderPush, sendModerationResolutionPush } from '../services/pushNotification.service';


/** Notification preference fields managed by Story 5.4 */
export const PREF_FIELDS = ['notifyDms', 'notifyGroups', 'notifyEvents', 'notifyModeration'] as const;
export type PrefField = typeof PREF_FIELDS[number];

// Helper: create notification in DB and emit via socket
export async function createAndEmitNotification(data: {
    userId: string;
    actorId?: string;
    type: string;
    message: string;
    metadata?: any;
}) {
    const notification = await prisma.notification.create({ data });
    emitNotification(data.userId, {
        id: notification.id,
        type: notification.type,
        message: notification.message,
        metadata: notification.metadata,
        createdAt: notification.createdAt.toISOString()
    });
    return notification;
}

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

// Register a device push token
export const registerToken = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user!.userId;
        const { token, platform } = req.body as { token: string; platform: 'ios' | 'android' | 'web' };

        if (!token || !platform) {
            res.status(400).json({ error: 'token and platform are required' });
            return;
        }

        await registerDeviceToken(userId, token, platform);
        res.json({ success: true });
    } catch (error) {
        console.error('Error registering push token:', error);
        res.status(500).json({ error: 'Failed to register push token' });
    }
};

// Remove a device push token (e.g., on logout)
export const removeToken = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { token } = req.body as { token: string };

        if (!token) {
            res.status(400).json({ error: 'token is required' });
            return;
        }

        await removeDeviceToken(token);
        res.json({ success: true });
    } catch (error) {
        console.error('Error removing push token:', error);
        res.status(500).json({ error: 'Failed to remove push token' });
    }
};

// Get notification preferences
export const getNotificationPreferences = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user!.userId;

        const prefs = await (prisma as any).userPreference.findUnique({ where: { userId } });

        if (!prefs) {
            res.json({ notifyDms: true, notifyGroups: true, notifyEvents: true, notifyModeration: true });
            return;
        }

        res.json({
            notifyDms: prefs.notifyDms ?? true,
            notifyGroups: prefs.notifyGroups ?? true,
            notifyEvents: prefs.notifyEvents ?? true,
            notifyModeration: prefs.notifyModeration ?? true
        });
    } catch (error) {
        console.error('Error fetching notification preferences:', error);
        res.status(500).json({ error: 'Failed to fetch notification preferences' });
    }
};

// Update notification preferences (PATCH — partial updates allowed)
export const updateNotificationPreferences = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user!.userId;
        const updates: Record<string, boolean> = {};

        for (const field of PREF_FIELDS) {
            if (field in req.body) {
                const val = req.body[field];
                if (typeof val !== 'boolean') {
                    res.status(400).json({ error: `${field} must be a boolean` });
                    return;
                }
                updates[field] = val;
            }
        }

        if (Object.keys(updates).length === 0) {
            res.status(400).json({ error: 'No valid preference fields provided' });
            return;
        }

        const prefs = await (prisma as any).userPreference.upsert({
            where: { userId },
            update: updates,
            create: { userId, lookingFor: [], ...updates }
        });

        res.json({
            notifyDms: prefs.notifyDms ?? true,
            notifyGroups: prefs.notifyGroups ?? true,
            notifyEvents: prefs.notifyEvents ?? true,
            notifyModeration: prefs.notifyModeration ?? true
        });
    } catch (error) {
        console.error('Error updating notification preferences:', error);
        res.status(500).json({ error: 'Failed to update notification preferences' });
    }
};

// ─── Story 5.5: Admin trigger endpoints ─────────────────────────────────────

/**
 * POST /api/notifications/trigger/event-reminder  (admin-only)
 * Triggers a 24-hour event reminder push for a given user.
 * Acts as a callable integration point for Epic 7's event scheduler.
 */
export const triggerEventReminder = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { userId, eventId } = req.body as { userId?: string; eventId?: string };

        if (!userId || !eventId) {
            res.status(400).json({ error: 'Bad Request', message: 'userId and eventId are required' });
            return;
        }

        await sendEventReminderPush(userId, eventId);
        res.json({ triggered: true });
    } catch (error) {
        console.error('Error triggering event reminder push:', error);
        res.status(500).json({ error: 'Internal Server Error', message: 'Failed to trigger event reminder push' });
    }
};

/**
 * POST /api/notifications/trigger/moderation-resolution  (admin-only)
 * Triggers a moderation resolution push for the reporter of a resolved report.
 * Acts as a callable integration point for Epic 6's moderation actions.
 */
export const triggerModerationResolution = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { userId, reportId } = req.body as { userId?: string; reportId?: string };

        if (!userId || !reportId) {
            res.status(400).json({ error: 'Bad Request', message: 'userId and reportId are required' });
            return;
        }

        await sendModerationResolutionPush(userId, reportId);
        res.json({ triggered: true });
    } catch (error) {
        console.error('Error triggering moderation resolution push:', error);
        res.status(500).json({ error: 'Internal Server Error', message: 'Failed to trigger moderation resolution push' });
    }
};

