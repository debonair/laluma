import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    reportContent,
    applyModerationAction,
    getAuditLog,
    exportAuditLog
} from './moderation.controller';
import { prisma } from '../db';

vi.mock('../db', () => ({
    prisma: {
        post: { count: vi.fn(), update: vi.fn() },
        comment: { count: vi.fn(), update: vi.fn() },
        content: { count: vi.fn(), update: vi.fn() },
        moderationItem: {
            upsert: vi.fn(),
            findMany: vi.fn(),
            findUnique: vi.fn(),
            count: vi.fn(),
            update: vi.fn()
        },
        report: { findUnique: vi.fn(), create: vi.fn(), findMany: vi.fn() },
        moderationAuditLog: {
            create: vi.fn(),
            findMany: vi.fn(),
            count: vi.fn()
        }
    }
}));

vi.mock('../services/moderationAudit.service', () => ({
    createAuditEntry: vi.fn().mockResolvedValue({ id: 'audit-1', moderationItemId: 'mod-1', moderatorId: 'mod-user-1', action: 'remove', createdAt: new Date() })
}));

const mockedPrisma = prisma as any;

describe('Moderation Controller', () => {
    let mockReq: any;
    let mockRes: any;

    beforeEach(() => {
        mockReq = {
            body: {
                entityType: 'post',
                entityId: '123e4567-e89b-12d3-a456-426614174000',
                reason: 'Offensive content'
            },
            user: { userId: 'user-1', roles: ['admin'] },
            query: {},
            params: {}
        };
        mockRes = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn(),
            setHeader: vi.fn(),
            send: vi.fn()
        };
        vi.clearAllMocks();
    });

    describe('reportContent', () => {
        it('returns 400 for invalid inputs', async () => {
            mockReq.body.entityType = 'invalid';
            await reportContent(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(400);
        });

        it('returns 404 if the entity does not exist', async () => {
            mockedPrisma.post.count.mockResolvedValueOnce(0);
            await reportContent(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                code: 'ENTITY_NOT_FOUND'
            }));
        });

        it('creates moderation item and report successfully', async () => {
            mockedPrisma.post.count.mockResolvedValueOnce(1); // Entity exists

            // Upsert returns the item
            mockedPrisma.moderationItem.upsert.mockResolvedValueOnce({ id: 'mod-1', postId: '123e4567-e89b-12d3-a456-426614174000' });

            // No existing report
            mockedPrisma.report.findUnique.mockResolvedValueOnce(null);

            // Creation success
            mockedPrisma.report.create.mockResolvedValueOnce({ id: 'report-1' });

            await reportContent(mockReq, mockRes);

            expect(mockedPrisma.moderationItem.upsert).toHaveBeenCalledWith(expect.objectContaining({
                where: { postId: '123e4567-e89b-12d3-a456-426614174000' },
                create: expect.objectContaining({ postId: '123e4567-e89b-12d3-a456-426614174000', status: 'pending' })
            }));

            expect(mockedPrisma.report.create).toHaveBeenCalledWith({
                data: {
                    moderationItemId: 'mod-1',
                    reporterId: 'user-1',
                    reason: 'Offensive content'
                }
            });

            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({ success: true, message: 'Content reported successfully.' });
        });

        it('handles idempotency gracefully by returning 200 on duplicate report', async () => {
            mockedPrisma.post.count.mockResolvedValueOnce(1);
            mockedPrisma.moderationItem.upsert.mockResolvedValueOnce({ id: 'mod-1', postId: '123e4567-e89b-12d3-a456-426614174000' });

            // Simulates user already reported this item
            mockedPrisma.report.findUnique.mockResolvedValueOnce({ id: 'report-dup' });

            await reportContent(mockReq, mockRes);

            expect(mockedPrisma.report.create).not.toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({ success: true, message: 'Content already reported.' });
        });
    });

    describe('getModerationItems', () => {
        it('returns paginated pending items', async () => {
            mockReq.query = { limit: '20', offset: '0' };
            const mockItems = [{ id: 'req-1' }];

            mockedPrisma.moderationItem.findMany.mockResolvedValueOnce(mockItems);
            mockedPrisma.moderationItem.count.mockResolvedValueOnce(1);

            const { getModerationItems } = await import('./moderation.controller');
            await getModerationItems(mockReq, mockRes);

            expect(mockedPrisma.moderationItem.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: { status: 'pending' },
                take: 20,
                skip: 0
            }));
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                items: mockItems,
                totalCount: 1,
                has_more: false
            });
        });
    });

    // ─── Story 6.6 + 6.7: Moderation Action Tests ───────────────────────────

    describe('applyModerationAction', () => {
        beforeEach(() => {
            mockReq.params = { id: 'mod-item-1' };
            mockReq.body = { action: 'remove', reason: 'Violates guidelines' };
            mockReq.user = { userId: 'mod-user-1', roles: ['moderator'] };
        });

        it('returns 400 for invalid action', async () => {
            mockReq.body = { action: 'invalid_action' };

            await applyModerationAction(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                code: 'VALIDATION_ERROR'
            }));
        });

        it('returns 404 if moderation item does not exist', async () => {
            mockedPrisma.moderationItem.findUnique.mockResolvedValueOnce(null);

            await applyModerationAction(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                code: 'MODERATION_ITEM_NOT_FOUND'
            }));
        });

        it('applies remove action, soft-deletes post, creates audit log', async () => {
            mockedPrisma.moderationItem.findUnique.mockResolvedValueOnce({
                id: 'mod-item-1',
                status: 'pending',
                postId: 'post-1',
                commentId: null,
                contentId: null,
                post: { id: 'post-1', authorId: 'author-1' },
                comment: null,
                content: null
            });
            mockedPrisma.moderationItem.update.mockResolvedValueOnce({});
            mockedPrisma.post.update.mockResolvedValueOnce({});

            const { createAuditEntry } = await import('../services/moderationAudit.service');

            await applyModerationAction(mockReq, mockRes);

            // Verify moderation item status updated
            expect(mockedPrisma.moderationItem.update).toHaveBeenCalledWith({
                where: { id: 'mod-item-1' },
                data: { status: 'removed' }
            });

            // Verify post soft-deleted
            expect(mockedPrisma.post.update).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: 'post-1' },
                data: expect.objectContaining({ deletedAt: expect.any(Date) })
            }));

            // Verify audit log created
            expect(createAuditEntry).toHaveBeenCalledWith(expect.objectContaining({
                moderationItemId: 'mod-item-1',
                moderatorId: 'mod-user-1',
                action: 'remove'
            }));

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    moderationItemId: 'mod-item-1',
                    action: 'remove',
                    newStatus: 'removed',
                    auditLogId: 'audit-1'
                })
            }));
        });

        it('applies clear action without soft-deleting content', async () => {
            mockReq.body = { action: 'clear' };

            mockedPrisma.moderationItem.findUnique.mockResolvedValueOnce({
                id: 'mod-item-1',
                status: 'pending',
                postId: 'post-1',
                commentId: null,
                contentId: null,
                post: { id: 'post-1', authorId: 'author-1' },
                comment: null,
                content: null
            });
            mockedPrisma.moderationItem.update.mockResolvedValueOnce({});

            await applyModerationAction(mockReq, mockRes);

            // Should NOT soft-delete the post
            expect(mockedPrisma.post.update).not.toHaveBeenCalled();

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    action: 'clear',
                    newStatus: 'cleared'
                })
            }));
        });

        it('applies escalate action and sets isEscalated flag', async () => {
            mockReq.body = { action: 'escalate', reason: 'Requires admin review' };

            mockedPrisma.moderationItem.findUnique.mockResolvedValueOnce({
                id: 'mod-item-1',
                status: 'pending',
                postId: 'post-1',
                commentId: null,
                contentId: null,
                post: { id: 'post-1', authorId: 'author-1' },
                comment: null,
                content: null
            });
            mockedPrisma.moderationItem.update.mockResolvedValueOnce({});

            await applyModerationAction(mockReq, mockRes);

            // Verify moderation item isEscalated is set to true
            expect(mockedPrisma.moderationItem.update).toHaveBeenCalledWith({
                where: { id: 'mod-item-1' },
                data: { status: 'pending', isEscalated: true }
            });

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    action: 'escalate',
                    newStatus: 'pending'
                })
            }));
        });
    });

    // ─── Story 6.7: Audit Log Query Tests ────────────────────────────────────

    describe('getAuditLog', () => {
        it('returns paginated audit log entries', async () => {
            mockReq.query = { limit: '10', offset: '0' };

            const mockEntries = [
                { id: 'audit-1', action: 'remove', createdAt: new Date(), moderator: { id: 'mod-1', username: 'mod', displayName: 'Mod' } }
            ];

            mockedPrisma.moderationAuditLog.findMany.mockResolvedValue(mockEntries);
            mockedPrisma.moderationAuditLog.count.mockResolvedValue(1);

            await getAuditLog(mockReq, mockRes);

            expect(mockedPrisma.moderationAuditLog.findMany).toHaveBeenCalledWith(expect.objectContaining({
                take: 10,
                skip: 0,
                orderBy: { createdAt: 'desc' }
            }));
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                data: mockEntries,
                totalCount: 1,
                has_more: false
            }));
        });

        it('filters by date range and moderatorId', async () => {
            const from = '2026-01-01T00:00:00+00:00';
            const to = '2026-12-31T23:59:59+00:00';
            const modId = '123e4567-e89b-12d3-a456-426614174001';
            mockReq.query = { from, to, moderatorId: modId };

            mockedPrisma.moderationAuditLog.findMany.mockResolvedValue([]);
            mockedPrisma.moderationAuditLog.count.mockResolvedValue(0);

            await getAuditLog(mockReq, mockRes);

            expect(mockedPrisma.moderationAuditLog.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({
                    moderatorId: modId,
                    createdAt: {
                        gte: new Date(from),
                        lte: new Date(to)
                    }
                })
            }));
            expect(mockRes.status).toHaveBeenCalledWith(200);
        });
    });

    // ─── Story 6.7: Audit Log CSV Export Tests ───────────────────────────────

    describe('exportAuditLog', () => {
        it('returns CSV with correct headers and content', async () => {
            const mockDate = new Date('2026-03-01T12:00:00Z');
            const mockEntries = [
                {
                    id: 'audit-1',
                    createdAt: mockDate,
                    moderatorId: 'mod-1',
                    moderator: { id: 'mod-1', username: 'moderator_jane' },
                    action: 'remove',
                    moderationItemId: 'item-1',
                    reason: 'Violates community guidelines'
                }
            ];

            mockedPrisma.moderationAuditLog.findMany.mockResolvedValue(mockEntries);

            await exportAuditLog(mockReq, mockRes);

            expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
            expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Disposition', 'attachment; filename="moderation-audit-log.csv"');
            expect(mockRes.status).toHaveBeenCalledWith(200);

            const csvContent = mockRes.send.mock.calls[0][0];
            expect(csvContent).toContain('id,timestamp,moderatorId,moderatorUsername,action,moderationItemId,reason');
            expect(csvContent).toContain('audit-1');
            expect(csvContent).toContain('moderator_jane');
            expect(csvContent).toContain('remove');
            expect(csvContent).toContain('Violates community guidelines');
        });

        it('escapes CSV fields containing commas', async () => {
            const mockDate = new Date('2026-03-01T12:00:00Z');
            const mockEntries = [
                {
                    id: 'audit-2',
                    createdAt: mockDate,
                    moderatorId: 'mod-1',
                    moderator: { id: 'mod-1', username: 'mod_user' },
                    action: 'warn',
                    moderationItemId: 'item-2',
                    reason: 'Reason with, comma and "quotes"'
                }
            ];

            mockedPrisma.moderationAuditLog.findMany.mockResolvedValue(mockEntries);

            await exportAuditLog(mockReq, mockRes);

            const csvContent = mockRes.send.mock.calls[0][0];
            // The reason should be properly escaped with quotes
            expect(csvContent).toContain('"Reason with, comma and ""quotes"""');
        });

        it('supports date range filtering', async () => {
            const from = '2026-01-01T00:00:00+00:00';
            const to = '2026-06-30T23:59:59+00:00';
            mockReq.query = { from, to };

            mockedPrisma.moderationAuditLog.findMany.mockResolvedValueOnce([]);

            await exportAuditLog(mockReq, mockRes);

            expect(mockedPrisma.moderationAuditLog.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({
                    createdAt: {
                        gte: new Date(from),
                        lte: new Date(to)
                    }
                })
            }));
        });
    });
});
