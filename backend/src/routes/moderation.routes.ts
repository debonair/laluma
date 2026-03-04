import express from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import {
    reportContent,
    getModerationItems,
    applyModerationAction,
    getAuditLog,
    exportAuditLog
} from '../controllers/moderation.controller';

const router = express.Router();

router.use(authenticate);

// POST /api/moderation/report
router.post('/report', reportContent);

// GET /api/moderation/queue
router.get('/queue', requireRole('admin', 'moderator'), getModerationItems);

// POST /api/moderation/queue/:id/action (Story 6.6 + 6.7)
router.post('/queue/:id/action', requireRole('admin', 'moderator'), applyModerationAction);

// GET /api/moderation/audit-log (Story 6.7)
router.get('/audit-log', requireRole('admin', 'moderator'), getAuditLog);

// GET /api/moderation/audit-log/export (Story 6.7 — admin only)
router.get('/audit-log/export', requireRole('admin'), exportAuditLog);

export default router;
