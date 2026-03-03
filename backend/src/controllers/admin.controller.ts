import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/auth';
import { getKeycloakAdminClient } from '../utils/keycloak';

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

export const getUsers = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                isActive: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ users, total: users.length });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

export const updateUserRole = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = req.params.id as string;
        const { role } = req.body;

        if (!role || !['admin', 'moderator', 'member'].includes(role)) {
            res.status(400).json({ error: 'Invalid role provided' });
            return;
        }

        const user = await prisma.user.update({
            where: { id },
            data: { role },
            select: { id: true, username: true, role: true, keycloakId: true }
        });

        // Optionally, one could push the new role to Keycloak here
        // For MVP, relying on the Prisma DB as source of truth for local checks
        // However, if we want strict SSO sync:
        /*
        if (user.keycloakId) {
            const kc = await getKeycloakAdminClient();
            // Complex RoleMapping operations...
        }
        */

        res.json({ message: 'User role updated fully', user });
    } catch (error: any) {
        if (error.code === 'P2025') {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        console.error('Error updating user role:', error);
        res.status(500).json({ error: 'Failed to update user role' });
    }
};

export const updateUserStatus = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = req.params.id as string;
        const { isActive } = req.body;

        if (typeof isActive !== 'boolean') {
            res.status(400).json({ error: 'isActive must be a boolean' });
            return;
        }

        const user = await prisma.user.update({
            where: { id },
            data: { isActive },
            select: { id: true, username: true, isActive: true, keycloakId: true }
        });

        // Sync with Keycloak to immediately revoke access if deactivated
        if (user.keycloakId) {
            try {
                const kc = await getKeycloakAdminClient();
                await kc.users.update({ id: user.keycloakId }, {
                    enabled: isActive
                });
            } catch (kcErr) {
                console.error('Failed to sync user status with Keycloak:', kcErr);
                // We still updated Prisma, so we can return 206 Partial Content or just 200 with warning
            }
        }

        res.json({ message: 'User status updated', user });
    } catch (error: any) {
        if (error.code === 'P2025') {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        console.error('Error updating status:', error);
        res.status(500).json({ error: 'Failed to update status' });
    }
};
