import { Response } from 'express';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import prisma from '../utils/prisma';

const createGroupSchema = z.object({
    name: z.string().max(200),
    description: z.string(),
    image_emoji: z.string().optional(),
    is_private: z.boolean().default(false),
    latitude: z.number().optional().nullable(),
    longitude: z.number().optional().nullable(),
    city: z.string().optional().nullable(),
    country: z.string().optional().nullable()
});

export const getGroups = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const filter = (typeof req.query.filter === 'string' ? req.query.filter : 'all');
        const search = (typeof req.query.search === 'string' ? req.query.search : undefined);
        const limit = parseInt((typeof req.query.limit === 'string' ? req.query.limit : '20')) || 20;
        const offset = parseInt((typeof req.query.offset === 'string' ? req.query.offset : '0')) || 0;
        const userLat = req.query.latitude ? parseFloat(req.query.latitude as string) : undefined;
        const userLng = req.query.longitude ? parseFloat(req.query.longitude as string) : undefined;
        const radiusKm = parseInt((typeof req.query.radius === 'string' ? req.query.radius : '50')) || 50;
        const cityFilter = (typeof req.query.city === 'string' ? req.query.city : undefined);
        const countryFilter = (typeof req.query.country === 'string' ? req.query.country : undefined);

        let where: any = {};

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } }
            ];
        }

        if (cityFilter) {
            where.city = { contains: cityFilter, mode: 'insensitive' };
        }
        if (countryFilter) {
            where.country = { contains: countryFilter, mode: 'insensitive' };
        }

        if (filter === 'my-groups') {
            where.members = {
                some: { userId: req.user!.userId }
            };
        }

        const [groupsRaw, total] = await Promise.all([
            prisma.group.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                include: {
                    members: {
                        where: { userId: req.user!.userId }
                    }
                }
            }),
            prisma.group.count({ where })
        ]);

        let groups = groupsRaw;

        // Apply geographic filtering and sorting if coordinates provided
        if (userLat !== undefined && userLng !== undefined && !isNaN(userLat) && !isNaN(userLng)) {
            groups = groups.filter(group => {
                if (group.latitude === null || group.longitude === null) return true; // Include if no coords set
                // Haversine formula
                const R = 6371; // Earth radius in km
                const dLat = (group.latitude - userLat) * Math.PI / 180;
                const dLon = (group.longitude - userLng) * Math.PI / 180;
                const a =
                    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.cos(userLat * Math.PI / 180) * Math.cos(group.latitude * Math.PI / 180) *
                    Math.sin(dLon / 2) * Math.sin(dLon / 2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                const distance = R * c;

                return distance <= radiusKm;
            });

            // Sort by distance
            groups.sort((a, b) => {
                if (a.latitude === null || a.longitude === null) return 1;
                if (b.latitude === null || b.longitude === null) return -1;

                const getDistance = (lat: number, lng: number) => {
                    const R = 6371;
                    const dLat = (lat - userLat) * Math.PI / 180;
                    const dLon = (lng - userLng) * Math.PI / 180;
                    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                        Math.cos(userLat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
                        Math.sin(dLon / 2) * Math.sin(dLon / 2);
                    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
                };

                return getDistance(a.latitude, a.longitude) - getDistance(b.latitude, b.longitude);
            });
        }

        // Apply pagination after filtering
        const paginatedGroups = groups.slice(offset, offset + limit);

        res.json({
            groups: paginatedGroups.map((group) => ({
                id: group.id,
                name: group.name,
                description: group.description,
                image_emoji: group.imageEmoji,
                image_url: group.imageUrl,
                latitude: group.latitude,
                longitude: group.longitude,
                city: group.city,
                country: group.country,
                member_count: group.memberCount,
                is_member: group.members.length > 0,
                created_at: group.createdAt
            })),
            total: groups.length,
            has_more: offset + limit < groups.length
        });
    } catch (error) {
        console.error('Get groups error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'An error occurred',
            code: 'INTERNAL_ERROR'
        });
    }
};

export const getRecommendedGroups = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
            return;
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { lifeStage: true, journeyContext: true }
        });

        // 1. Find 3 groups roughly matching life stage using text search as a proxy
        let recommended = await prisma.group.findMany({
            where: {
                ...(user?.lifeStage && {
                    OR: [
                        { name: { contains: user.lifeStage.replace('_', ' '), mode: 'insensitive' } },
                        { description: { contains: user.lifeStage.replace('_', ' '), mode: 'insensitive' } }
                    ]
                }),
                isPrivate: false,
                members: {
                    none: { userId } // exclude already joined
                }
            },
            take: 3,
            orderBy: { memberCount: 'desc' }
        });

        // 2. Fallback: if < 3 groups matched, fill with largest popular public groups
        if (recommended.length < 3) {
            const excludeIds = recommended.map(g => g.id);
            const fallback = await prisma.group.findMany({
                where: {
                    isPrivate: false,
                    id: { notIn: excludeIds },
                    members: { none: { userId } }
                },
                take: 3 - recommended.length,
                orderBy: { memberCount: 'desc' }
            });
            recommended = [...recommended, ...fallback];
        }

        res.json({
            groups: recommended.map(group => ({
                id: group.id,
                name: group.name,
                description: group.description,
                image_emoji: group.imageEmoji,
                member_count: group.memberCount,
                is_member: false, // by definition of recommendation
                created_at: group.createdAt
            }))
        });
    } catch (error) {
        console.error('Get recommended groups error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'An error occurred',
            code: 'INTERNAL_ERROR'
        });
    }
};

export const createGroup = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const data = createGroupSchema.parse(req.body);

        const group = await prisma.group.create({
            data: {
                name: data.name,
                description: data.description,
                imageEmoji: data.image_emoji,
                isPrivate: data.is_private,
                latitude: data.latitude,
                longitude: data.longitude,
                city: data.city,
                country: data.country,
                createdById: req.user!.userId,
                memberCount: 1,
                members: {
                    create: {
                        userId: req.user!.userId,
                        role: 'admin'
                    }
                }
            }
        });

        res.status(201).json({
            id: group.id,
            name: group.name,
            description: group.description,
            image_emoji: group.imageEmoji,
            member_count: group.memberCount,
            is_member: true,
            created_at: group.createdAt
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

        console.error('Create group error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'An error occurred',
            code: 'INTERNAL_ERROR'
        });
    }
};

export const getGroup = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const groupId = req.params.groupId as string;
        const group = await prisma.group.findUnique({
            where: { id: groupId },
            include: {
                createdBy: true,
                members: {
                    where: { userId: req.user!.userId }
                }
            }
        });

        if (!group) {
            res.status(404).json({
                error: 'Not Found',
                message: 'Group not found',
                code: 'GROUP_NOT_FOUND'
            });
            return;
        }

        res.json({
            id: group.id,
            name: group.name,
            description: group.description,
            image_emoji: group.imageEmoji,
            image_url: group.imageUrl,
            member_count: group.memberCount,
            is_member: group.members.length > 0,
            created_by: group.createdBy ? {
                id: group.createdBy.id,
                username: group.createdBy.username,
                display_name: group.createdBy.displayName
            } : null,
            created_at: group.createdAt
        });
    } catch (error) {
        console.error('Get group error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'An error occurred',
            code: 'INTERNAL_ERROR'
        });
    }
};

export const joinGroup = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const groupId = req.params.groupId as string;
        const group = await prisma.group.findUnique({
            where: { id: groupId }
        });

        if (!group) {
            res.status(404).json({
                error: 'Not Found',
                message: 'Group not found',
                code: 'GROUP_NOT_FOUND'
            });
            return;
        }

        // Check if already a member
        const existingMember = await prisma.groupMember.findUnique({
            where: {
                groupId_userId: {
                    groupId: group.id,
                    userId: req.user!.userId
                }
            }
        });

        if (existingMember) {
            res.status(409).json({
                error: 'Conflict',
                message: 'Already a member of this group',
                code: 'ALREADY_MEMBER'
            });
            return;
        }

        // Add member and increment count
        await prisma.$transaction([
            prisma.groupMember.create({
                data: {
                    groupId: group.id,
                    userId: req.user!.userId
                }
            }),
            prisma.group.update({
                where: { id: group.id },
                data: { memberCount: { increment: 1 } }
            })
        ]);

        res.json({
            success: true,
            message: 'Successfully joined group'
        });
    } catch (error) {
        console.error('Join group error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'An error occurred',
            code: 'INTERNAL_ERROR'
        });
    }
};

export const leaveGroup = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const groupId = req.params.groupId as string;
        const group = await prisma.group.findUnique({
            where: { id: groupId }
        });

        if (!group) {
            res.status(404).json({
                error: 'Not Found',
                message: 'Group not found',
                code: 'GROUP_NOT_FOUND'
            });
            return;
        }

        // Delete member and decrement count
        await prisma.$transaction([
            prisma.groupMember.delete({
                where: {
                    groupId_userId: {
                        groupId: group.id,
                        userId: req.user!.userId
                    }
                }
            }),
            prisma.group.update({
                where: { id: group.id },
                data: { memberCount: { decrement: 1 } }
            })
        ]);

        res.json({
            success: true,
            message: 'Successfully left group'
        });
    } catch (error) {
        console.error('Leave group error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'An error occurred',
            code: 'INTERNAL_ERROR'
        });
    }
};

// ─── Group Management (Admin) ──────────────────────────────────────────────────

export const getGroupMembers = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const groupId = req.params.groupId as string;
        const members = await prisma.groupMember.findMany({
            where: { groupId },
            include: {
                user: {
                    select: { id: true, username: true, displayName: true, profileImageUrl: true }
                }
            },
            orderBy: { joinedAt: 'asc' }
        });

        res.json(members.map(m => ({
            id: m.id,
            userId: m.user.id,
            username: m.user.username,
            displayName: m.user.displayName,
            profileImageUrl: m.user.profileImageUrl,
            role: m.role,
            joinedAt: m.joinedAt
        })));
    } catch (error) {
        console.error('Get group members error:', error);
        res.status(500).json({ error: 'Failed to fetch members' });
    }
};

export const removeMember = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const groupId = req.params.groupId as string;
        const memberId = req.params.memberId as string;

        // Check requester is group admin
        const requesterMembership = await prisma.groupMember.findUnique({
            where: { groupId_userId: { groupId, userId: req.user!.userId } }
        });
        if (!requesterMembership || requesterMembership.role !== 'admin') {
            res.status(403).json({ error: 'Only group admins can remove members' });
            return;
        }

        // Cannot remove self
        if (memberId === req.user!.userId) {
            res.status(400).json({ error: 'Cannot remove yourself. Use leave group instead.' });
            return;
        }

        await prisma.$transaction([
            prisma.groupMember.delete({
                where: { groupId_userId: { groupId, userId: memberId } }
            }),
            prisma.group.update({
                where: { id: groupId },
                data: { memberCount: { decrement: 1 } }
            })
        ]);

        res.json({ success: true, message: 'Member removed' });
    } catch (error) {
        console.error('Remove member error:', error);
        res.status(500).json({ error: 'Failed to remove member' });
    }
};

export const updateMemberRole = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const groupId = req.params.groupId as string;
        const memberId = req.params.memberId as string;
        const { role } = req.body;

        if (!['admin', 'moderator', 'member'].includes(role)) {
            res.status(400).json({ error: 'Invalid role. Must be admin, moderator, or member.' });
            return;
        }

        // Check requester is group admin
        const requesterMembership = await prisma.groupMember.findUnique({
            where: { groupId_userId: { groupId, userId: req.user!.userId } }
        });
        if (!requesterMembership || requesterMembership.role !== 'admin') {
            res.status(403).json({ error: 'Only group admins can change roles' });
            return;
        }

        const updated = await prisma.groupMember.update({
            where: { groupId_userId: { groupId, userId: memberId } },
            data: { role }
        });

        res.json({ success: true, role: updated.role });
    } catch (error) {
        console.error('Update member role error:', error);
        res.status(500).json({ error: 'Failed to update member role' });
    }
};
