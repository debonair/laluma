import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import prisma from '../utils/prisma';

const createSubmissionSchema = z.object({
    title: z.string().min(3).max(200),
    body: z.string().min(10),
    category: z.string().min(1)
});

// User submits content for review
export const createSubmission = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

        const data = createSubmissionSchema.parse(req.body);
        const submission = await prisma.contentSubmission.create({
            data: { userId, title: data.title, body: data.body, category: data.category }
        });
        res.status(201).json(submission);
    } catch (error) {
        if (error instanceof z.ZodError) { res.status(400).json({ error: 'Invalid input', details: error.errors }); return; }
        console.error('Error creating submission:', error);
        res.status(500).json({ error: 'Failed to create submission' });
    }
};

// User views their own submissions
export const getUserSubmissions = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

        const submissions = await prisma.contentSubmission.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });
        res.json(submissions);
    } catch (error) {
        console.error('Error fetching submissions:', error);
        res.status(500).json({ error: 'Failed to fetch submissions' });
    }
};

// Admin: list all submissions (filterable by status)
export const getAllSubmissions = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const status = typeof req.query.status === 'string' ? req.query.status : undefined;
        const submissions = await prisma.contentSubmission.findMany({
            where: status ? { status } : undefined,
            include: { user: { select: { id: true, username: true, displayName: true } } },
            orderBy: { createdAt: 'desc' }
        });
        res.json(submissions);
    } catch (error) {
        console.error('Error fetching all submissions:', error);
        res.status(500).json({ error: 'Failed to fetch submissions' });
    }
};

// Admin: approve submission → creates Content
export const approveSubmission = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = req.params.id as string;
        const submission = await prisma.contentSubmission.findUnique({ where: { id } });
        if (!submission) { res.status(404).json({ error: 'Submission not found' }); return; }
        if (submission.status !== 'pending') { res.status(400).json({ error: 'Submission already reviewed' }); return; }

        // Create content from submission
        const content = await prisma.content.create({
            data: {
                title: submission.title,
                body: submission.body,
                category: submission.category,
                authorId: submission.userId,
                status: 'published',
                publishedAt: new Date()
            }
        });

        await prisma.contentSubmission.update({
            where: { id },
            data: { status: 'approved', approvedContentId: content.id as string }
        });

        res.json({ submission: { ...submission, status: 'approved' }, content });
    } catch (error) {
        console.error('Error approving submission:', error);
        res.status(500).json({ error: 'Failed to approve submission' });
    }
};

// Admin: reject submission
export const rejectSubmission = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = req.params.id as string;
        const { reason } = req.body;
        const submission = await prisma.contentSubmission.findUnique({ where: { id } });
        if (!submission) { res.status(404).json({ error: 'Submission not found' }); return; }
        if (submission.status !== 'pending') { res.status(400).json({ error: 'Submission already reviewed' }); return; }

        const updated = await prisma.contentSubmission.update({
            where: { id },
            data: { status: 'rejected', rejectionReason: (reason || 'No reason provided') as string }
        });
        res.json(updated);
    } catch (error) {
        console.error('Error rejecting submission:', error);
        res.status(500).json({ error: 'Failed to reject submission' });
    }
};
