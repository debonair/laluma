import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth';
import { z } from 'zod';
import { communityGuidelinesService } from '../services/communityGuidelines.service';

// Zod validation schema for creating guidelines
const createGuidelinesSchema = z.object({
    content: z.string().min(1, 'Content is required'),
});

// Zod validation schema for updating guidelines
const updateGuidelinesSchema = z.object({
    content: z.string().min(1, 'Content is required'),
});

/**
 * Create new community guidelines version (admin only)
 * POST /api/admin/community-guidelines
 */
export async function createGuidelines(
    req: AuthRequest,
    res: Response
): Promise<void> {
    try {
        const parsed = createGuidelinesSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({
                error: 'Bad Request',
                message: parsed.error.message,
                code: 'VALIDATION_ERROR',
            });
            return;
        }

        const adminId = req.user!.userId;
        const guidelines = await communityGuidelinesService.createGuidelines({
            content: parsed.data.content,
            createdBy: adminId,
        });

        res.status(201).json({ data: guidelines });
    } catch (error) {
        console.error('Error creating guidelines:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to create guidelines',
            code: 'CREATE_GUIDELINES_ERROR',
        });
    }
}

/**
 * Update existing guidelines (admin only)
 * PUT /api/admin/community-guidelines/:id
 */
export async function updateGuidelines(
    req: AuthRequest,
    res: Response
): Promise<void> {
    try {
        const id = req.params.id as string;
        const parsed = updateGuidelinesSchema.safeParse(req.body);

        if (!parsed.success) {
            res.status(400).json({
                error: 'Bad Request',
                message: parsed.error.message,
                code: 'VALIDATION_ERROR',
            });
            return;
        }

        const guidelines = await communityGuidelinesService.updateGuidelines(
            id,
            parsed.data.content
        );

        if (!guidelines) {
            res.status(404).json({
                error: 'Not Found',
                message: 'Guidelines not found',
                code: 'GUIDELINES_NOT_FOUND',
            });
            return;
        }

        res.status(200).json({ data: guidelines });
    } catch (error) {
        console.error('Error updating guidelines:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to update guidelines',
            code: 'UPDATE_GUIDELINES_ERROR',
        });
    }
}

/**
 * Get all guidelines versions with pagination (admin only)
 * GET /api/admin/community-guidelines
 */
export async function getAllGuidelines(
    req: AuthRequest,
    res: Response
): Promise<void> {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        const result = await communityGuidelinesService.getAllGuidelines(page, limit);
        res.status(200).json({ data: result });
    } catch (error) {
        console.error('Error fetching guidelines:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch guidelines',
            code: 'FETCH_GUIDELINES_ERROR',
        });
    }
}

/**
 * Get current (latest) guidelines - public endpoint
 * GET /api/community-guidelines/current
 */
export async function getCurrentGuidelines(
    _req: AuthRequest,
    res: Response
): Promise<void> {
    try {
        const guidelines = await communityGuidelinesService.getCurrentGuidelines();

        if (!guidelines) {
            res.status(404).json({
                error: 'Not Found',
                message: 'No community guidelines found',
                code: 'NO_GUIDELINES_FOUND',
            });
            return;
        }

        res.status(200).json({ data: guidelines });
    } catch (error) {
        console.error('Error fetching current guidelines:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch guidelines',
            code: 'FETCH_GUIDELINES_ERROR',
        });
    }
}

/**
 * Get specific guidelines version by ID (admin)
 * GET /api/community-guidelines/:id
 */
export async function getGuidelinesById(
    req: AuthRequest,
    res: Response
): Promise<void> {
    try {
        const id = req.params.id as string;
        const guidelines = await communityGuidelinesService.getGuidelinesById(id);

        if (!guidelines) {
            res.status(404).json({
                error: 'Not Found',
                message: 'Guidelines not found',
                code: 'GUIDELINES_NOT_FOUND',
            });
            return;
        }

        res.status(200).json({ data: guidelines });
    } catch (error) {
        console.error('Error fetching guidelines by ID:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch guidelines',
            code: 'FETCH_GUIDELINES_ERROR',
        });
    }
}
