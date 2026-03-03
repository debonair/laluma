import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import prisma from '../utils/prisma';

const setStatusSchema = z.object({
    message: z.string().min(1).max(500).nullable(),
    type: z.enum(['info', 'warning']).optional().default('info')
});

/**
 * GET /api/status
 * Returns the current active system status, or null if none is active.
 * Public endpoint — no auth required.
 */
export const getStatus = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const status = await prisma.systemStatus.findFirst({
            where: { isActive: true },
            orderBy: { createdAt: 'desc' }
        });

        res.json({
            status: status ? {
                id: status.id,
                message: status.message,
                type: status.type,
                updated_at: status.updatedAt
            } : null
        });
    } catch (error) {
        console.error('Get status error:', error);
        res.status(500).json({ error: 'Internal Server Error', code: 'INTERNAL_ERROR' });
    }
};

/**
 * POST /api/admin/status
 * Allows admins to publish a new active system status.
 * Passing `{ message: null }` clears all active statuses.
 * Only one status can be active at a time.
 */
export const setStatus = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const data = setStatusSchema.parse(req.body);

        // Deactivate all existing statuses first
        await prisma.systemStatus.updateMany({
            where: { isActive: true },
            data: { isActive: false }
        });

        if (data.message === null) {
            // Clearing the status — just deactivated above
            res.json({ status: null, message: 'System status cleared' });
            return;
        }

        // Create the new active status
        const status = await prisma.systemStatus.create({
            data: {
                message: data.message,
                type: data.type,
                isActive: true
            }
        });

        res.status(201).json({
            status: {
                id: status.id,
                message: status.message,
                type: status.type,
                updated_at: status.updatedAt
            }
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Bad Request', code: 'VALIDATION_ERROR', details: error.errors });
            return;
        }
        console.error('Set status error:', error);
        res.status(500).json({ error: 'Internal Server Error', code: 'INTERNAL_ERROR' });
    }
};
