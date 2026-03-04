/**
 * Moderation Audit Service (Story 6.7)
 *
 * Creates immutable audit log entries for every moderation action.
 * Also dispatches reporter notifications (in-app + push) when a
 * moderation action resolves a user-submitted report.
 */

import prisma from '../utils/prisma';
import { createAndEmitNotification } from '../controllers/notification.controller';
import { sendModerationResolutionPush } from './pushNotification.service';

export type ModerationAction = 'remove' | 'warn' | 'watchlist' | 'clear' | 'escalate';

export interface CreateAuditEntryParams {
    moderationItemId: string;
    moderatorId: string;
    action: ModerationAction;
    reason?: string;
    metadata?: Record<string, unknown>;
}

/**
 * Persist an audit log row and notify every reporter linked to the
 * moderation item.
 *
 * Returns the created audit log record.
 */
export async function createAuditEntry(params: CreateAuditEntryParams) {
    const { moderationItemId, moderatorId, action, reason, metadata } = params;

    // 1. Create the immutable audit log record
    const auditLog = await prisma.moderationAuditLog.create({
        data: {
            moderationItemId,
            moderatorId,
            action,
            reason: reason ?? null,
            metadata: metadata ? (metadata as Record<string, string | number | boolean | null>) : undefined
        }
    });

    // 2. Find all reporters for this moderation item
    const reports = await prisma.report.findMany({
        where: { moderationItemId },
        select: { reporterId: true, id: true }
    });

    // 3. Notify each reporter (in-app + push)
    const notificationPromises = reports.map(async (report) => {
        // In-app notification via Socket.io + DB
        await createAndEmitNotification({
            userId: report.reporterId,
            actorId: moderatorId,
            type: 'moderation_resolution',
            message: 'Thank you for helping keep our community safe. The content you reported has been reviewed by our team.',
            metadata: {
                moderationItemId,
                auditLogId: auditLog.id
            }
        });

        // Push notification (respects notifyModeration preference)
        await sendModerationResolutionPush(report.reporterId, report.id);
    });

    await Promise.allSettled(notificationPromises);

    return auditLog;
}
