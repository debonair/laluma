import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/auth';

export const getAdminStats = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        // Run aggregations concurrently for better performance
        const [
            totalUsers,
            totalGroups,
            pendingSubmissions,
            activeContent
        ] = await Promise.all([
            prisma.user.count(),
            prisma.group.count(),
            prisma.contentSubmission.count({
                where: { status: 'pending' }
            }),
            prisma.content.count({
                where: { isActive: true }
            })
        ]);

        res.json({
            stats: {
                totalUsers,
                totalGroups,
                pendingSubmissions,
                activeContent
            }
        });
    } catch (error) {
        console.error('Error fetching admin stats:', error);
        res.status(500).json({ error: 'Failed to fetch admin stats' });
    }
};
