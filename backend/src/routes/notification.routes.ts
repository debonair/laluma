import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    registerToken,
    removeToken,
    getNotificationPreferences,
    updateNotificationPreferences,
    triggerEventReminder,
    triggerModerationResolution
} from '../controllers/notification.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.put('/:id/read', markAsRead);
router.put('/read-all', markAllAsRead);

// Push notification device token management
router.post('/token', registerToken);
router.delete('/token', removeToken);

// Notification preferences
router.get('/preferences', getNotificationPreferences);
router.patch('/preferences', updateNotificationPreferences);

// ─── Story 5.5: Admin-only push trigger endpoints ────────────────────────────
// These endpoints allow admins to manually fire event reminder and moderation
// resolution pushes — and serve as callable integration points for Epic 6 & 7.
router.post('/trigger/event-reminder', requireRole('app-admin'), triggerEventReminder);
router.post('/trigger/moderation-resolution', requireRole('app-admin'), triggerModerationResolution);

export default router;

