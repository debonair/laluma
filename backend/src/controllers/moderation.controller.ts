import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import type { Prisma } from '@prisma/client';
import { AuthRequest, requireRole } from '../middleware/auth';
import { createAuditEntry, ModerationAction } from '../services/moderationAudit.service';

const reportSchema = z.object({
    entityType: z.enum(['post', 'comment', 'content']),
    entityId: z.string().uuid(),
    reason: z.string().min(1, 'Reason is required').max(1000, 'Reason is too long')
});

export const reportContent = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const data = reportSchema.parse(req.body);
        const reporterId = req.user!.userId;

        // 1. Verify the entity exists to prevent orphaned moderation items
        let exists = false;
        switch (data.entityType) {
            case 'post':
                exists = (await prisma.post.count({ where: { id: data.entityId } })) > 0;
                break;
            case 'comment':
                exists = (await prisma.comment.count({ where: { id: data.entityId } })) > 0;
                break;
            case 'content':
                exists = (await prisma.content.count({ where: { id: data.entityId } })) > 0;
                break;
        }

        if (!exists) {
            res.status(404).json({
                error: 'Not Found',
                message: `${data.entityType} not found`,
                code: 'ENTITY_NOT_FOUND'
            });
            return;
        }

        // 2. Upsert the ModerationItem transactionally
        // Build the where clause based on entity type (using unique inputs)
        const whereClause: Prisma.ModerationItemWhereUniqueInput = data.entityType === 'post'
            ? { postId: data.entityId }
            : data.entityType === 'comment'
                ? { commentId: data.entityId }
                : { contentId: data.entityId };

        const moderationItem = await prisma.moderationItem.upsert({
            where: whereClause,
            create: {
                ...(data.entityType === 'post' ? { postId: data.entityId } : {}),
                ...(data.entityType === 'comment' ? { commentId: data.entityId } : {}),
                ...(data.entityType === 'content' ? { contentId: data.entityId } : {}),
                status: 'pending'
            },
            update: {} // No fields to update on an existing ModerationItem simply by reporting it
        });

        // 3. Create the report. Idempotent check: Did this user already report it?
        const existingReport = await prisma.report.findUnique({
            where: {
                moderationItemId_reporterId: {
                    moderationItemId: moderationItem.id,
                    reporterId
                }
            }
        });

        if (existingReport) {
            // Idempotent success
            res.status(200).json({ success: true, message: 'Content already reported.' });
            return;
        }

        await prisma.report.create({
            data: {
                moderationItemId: moderationItem.id,
                reporterId,
                reason: data.reason
            }
        });

        // Here we could also emit an event or run a BullMQ queue job to alert moderators.
        // For FR18/FR24, the immediate requirement is creating the DB record so it gets filtered out of the reporter's view.

        res.status(201).json({
            success: true,
            message: 'Content reported successfully.'
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({
                error: 'Bad Request',
                message: 'Validation failed',
                code: 'VALIDATION_ERROR',
                details: error.errors
            });
            return;
        }
        console.error('Report content error:', error);
        res.status(500).json({
            error: 'Internal Server Error'
        });
    }
};

export const getModerationItems = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        // Authorization check: only moderators and admins can view the moderation queue
        const userRoles = req.user?.roles || [];
        const isModerator = userRoles.includes('moderator') || userRoles.includes('app-admin');
        if (!isModerator) {
            res.status(403).json({
                error: 'Forbidden',
                message: 'Only moderators and administrators can view the moderation queue',
                code: 'INSUFFICIENT_PERMISSIONS'
            });
            return;
        }

        const limit = parseInt((typeof req.query.limit === 'string' ? req.query.limit : '50')) || 50;
        const offset = parseInt((typeof req.query.offset === 'string' ? req.query.offset : '0')) || 0;

        const items = await prisma.moderationItem.findMany({
            where: {
                status: 'pending'
            },
            include: {
                post: {
                    include: { author: true, group: true }
                },
                comment: {
                    include: { author: true }
                },
                content: {
                    include: { author: true }
                },
                reports: {
                    include: {
                        reporter: {
                            select: { id: true, username: true, displayName: true }
                        }
                    }
                }
            },
            orderBy: [
                { aiScore: { sort: 'desc', nulls: 'last' } },
                { reports: { _count: 'desc' } },
                { createdAt: 'desc' }
            ],
            take: limit,
            skip: offset
        });

        const totalCount = await prisma.moderationItem.count({ where: { status: 'pending' } });

        res.status(200).json({
            items,
            totalCount,
            has_more: offset + items.length < totalCount
        });
    } catch (error) {
        console.error('Fetch moderation items error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// ─── Story 6.6 + 6.7: Moderation Action with Audit Log ──────────────────────

const VALID_ACTIONS: ModerationAction[] = ['remove', 'warn', 'watchlist', 'clear', 'escalate'];

/** Maps action → ModerationItem status */
const ACTION_TO_STATUS: Record<ModerationAction, string> = {
    remove: 'removed',
    warn: 'cleared',
    watchlist: 'watchlisted',
    clear: 'cleared',
    escalate: 'pending' // stays pending but flagged for admin
};

const actionSchema = z.object({
    action: z.enum(VALID_ACTIONS as [ModerationAction, ...ModerationAction[]]),
    reason: z.string().max(2000).optional()
});

/**
 * POST /api/moderation/queue/:id/action
 * Apply a moderation action (remove, warn, watchlist, clear, escalate).
 * Creates an audit log entry and notifies reporters.
 */
export const applyModerationAction = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        // Authorization check: only moderators and admins can apply actions
        const userRoles = req.user?.roles || [];
        const isModerator = userRoles.includes('moderator') || userRoles.includes('app-admin');
        if (!isModerator) {
            res.status(403).json({
                error: 'Forbidden',
                message: 'Only moderators and administrators can apply moderation actions',
                code: 'INSUFFICIENT_PERMISSIONS'
            });
            return;
        }

        const id = String(req.params.id);
        const moderatorId = req.user!.userId;

        const parsed = actionSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({
                error: 'Bad Request',
                message: 'Validation failed',
                code: 'VALIDATION_ERROR',
                details: parsed.error.errors
            });
            return;
        }

        const { action, reason } = parsed.data;

        // 1. Verify the moderation item exists
        const moderationItem = await prisma.moderationItem.findUnique({
            where: { id },
            include: {
                post: { select: { id: true, authorId: true } },
                comment: { select: { id: true, authorId: true } },
                content: { select: { id: true, authorId: true } }
            }
        });

        if (!moderationItem) {
            res.status(404).json({
                error: 'Not Found',
                message: 'Moderation item not found',
                code: 'MODERATION_ITEM_NOT_FOUND'
            });
            return;
        }

        const previousStatus = moderationItem.status;
        const newStatus = ACTION_TO_STATUS[action];

        // 2. Update the moderation item status
        const updateData: Record<string, unknown> = { status: newStatus };

        // For escalate action, also set the escalation flag
        if (action === 'escalate') {
            updateData.isEscalated = true;
        }

        await prisma.moderationItem.update({
            where: { id },
            data: updateData
        });

        // 3. Handle content-specific side effects
        if (action === 'remove') {
            // Soft-delete posts/comments using deletedAt timestamp, Content uses isActive
            const now = new Date();
            if (moderationItem.postId) {
                await prisma.post.update({
                    where: { id: moderationItem.postId },
                    data: { deletedAt: now }
                });
            }
            if (moderationItem.commentId) {
                await prisma.comment.update({
                    where: { id: moderationItem.commentId },
                    data: { deletedAt: now }
                });
            }
            if (moderationItem.contentId) {
                await prisma.content.update({
                    where: { id: moderationItem.contentId },
                    data: { isActive: false }
                });
            }
        }

        // 4. Create audit log entry + notify reporters (Story 6.7)
        const auditLog = await createAuditEntry({
            moderationItemId: id,
            moderatorId,
            action,
            reason,
            metadata: {
                previousStatus,
                newStatus,
                isEscalated: action === 'escalate',
                targetPostId: moderationItem.postId,
                targetCommentId: moderationItem.commentId,
                targetContentId: moderationItem.contentId
            }
        });

        res.status(200).json({
            data: {
                moderationItemId: id,
                action,
                newStatus,
                auditLogId: auditLog.id
            }
        });
    } catch (error) {
        console.error('Apply moderation action error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// ─── Story 6.7: Audit Log Query ─────────────────────────────────────────────

/** Helper: extract first string from query param (handles string | string[]) */
const qStr = (val: unknown): string | undefined => {
    if (typeof val === 'string') return val;
    if (Array.isArray(val) && typeof val[0] === 'string') return val[0];
    return undefined;
};

const auditLogQuerySchema = z.object({
    limit: z.coerce.number().int().min(1).max(200).optional().default(50),
    offset: z.coerce.number().int().min(0).optional().default(0),
    from: z.preprocess(qStr, z.string().datetime({ offset: true }).optional()),
    to: z.preprocess(qStr, z.string().datetime({ offset: true }).optional()),
    moderatorId: z.preprocess(qStr, z.string().uuid().optional())
});

/**
 * GET /api/moderation/audit-log
 * Paginated audit log with optional date range and moderator filters.
 */
export const getAuditLog = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        // Authorization check: only moderators and admins can view audit logs
        const userRoles = req.user?.roles || [];
        const isModerator = userRoles.includes('moderator') || userRoles.includes('app-admin');
        if (!isModerator) {
            res.status(403).json({
                error: 'Forbidden',
                message: 'Only moderators and administrators can view audit logs',
                code: 'INSUFFICIENT_PERMISSIONS'
            });
            return;
        }

        const parsed = auditLogQuerySchema.safeParse(req.query);
        if (!parsed.success) {
            res.status(400).json({
                error: 'Bad Request',
                message: 'Invalid query parameters',
                code: 'VALIDATION_ERROR',
                details: parsed.error.errors
            });
            return;
        }

        const { limit, offset, from, to, moderatorId } = parsed.data;

        const where: Record<string, unknown> = {};
        if (moderatorId) where.moderatorId = moderatorId;
        if (from || to) {
            where.createdAt = {
                ...(from ? { gte: new Date(from) } : {}),
                ...(to ? { lte: new Date(to) } : {})
            };
        }

        const [items, totalCount] = await Promise.all([
            prisma.moderationAuditLog.findMany({
                where,
                include: {
                    moderator: {
                        select: { id: true, username: true, displayName: true }
                    },
                    moderationItem: {
                        select: { id: true, status: true, postId: true, commentId: true, contentId: true }
                    }
                },
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: offset
            }),
            prisma.moderationAuditLog.count({ where })
        ]);

        res.status(200).json({
            data: items,
            totalCount,
            has_more: offset + items.length < totalCount
        });
    } catch (error) {
        console.error('Get audit log error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// ─── Story 6.7: Audit Log CSV Export ─────────────────────────────────────────

const exportQuerySchema = z.object({
    from: z.preprocess(qStr, z.string().datetime({ offset: true }).optional()),
    to: z.preprocess(qStr, z.string().datetime({ offset: true }).optional())
});

/**
 * GET /api/moderation/audit-log/export
 * Streams a CSV file of audit log entries for compliance/legal review.
 */
export const exportAuditLog = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        // Authorization check: only admins can export audit logs (compliance requirement)
        const userRoles = req.user?.roles || [];
        const isAdmin = userRoles.includes('app-admin');
        if (!isAdmin) {
            res.status(403).json({
                error: 'Forbidden',
                message: 'Only administrators can export audit logs',
                code: 'INSUFFICIENT_PERMISSIONS'
            });
            return;
        }

        const parsed = exportQuerySchema.safeParse(req.query);
        if (!parsed.success) {
            res.status(400).json({
                error: 'Bad Request',
                message: 'Invalid query parameters',
                code: 'VALIDATION_ERROR',
                details: parsed.error.errors
            });
            return;
        }

        const { from, to } = parsed.data;

        const where: Record<string, unknown> = {};
        if (from || to) {
            where.createdAt = {
                ...(from ? { gte: new Date(from) } : {}),
                ...(to ? { lte: new Date(to) } : {})
            };
        }

        const entries = await prisma.moderationAuditLog.findMany({
            where,
            include: {
                moderator: {
                    select: { id: true, username: true }
                }
            },
            orderBy: { createdAt: 'asc' }
        });

        // Build CSV
        const header = 'id,timestamp,moderatorId,moderatorUsername,action,moderationItemId,reason';
        const escapeCSV = (val: string | null | undefined): string => {
            if (val == null) return '';
            const str = String(val);
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };

        const rows = entries.map(e =>
            [
                e.id,
                e.createdAt.toISOString(),
                e.moderatorId,
                e.moderator.username,
                e.action,
                e.moderationItemId,
                escapeCSV(e.reason)
            ].join(',')
        );

        const csv = [header, ...rows].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="moderation-audit-log.csv"');
        res.status(200).send(csv);
    } catch (error) {
        console.error('Export audit log error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
