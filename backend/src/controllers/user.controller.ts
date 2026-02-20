import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import prisma from '../utils/prisma';

const updateProfileSchema = z.object({
    display_name: z.string().max(100).optional(),
    about_me: z.string().max(1000).optional(),
    motherhood_stage: z.string().optional(),
    location: z.object({
        radius: z.number().min(1).max(100).optional(),
        anywhere: z.boolean().optional(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
        city: z.string().optional(),
        country: z.string().optional()
    }).optional(),
    looking_for: z.array(z.string()).optional()
});

export const getCurrentUser = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user!.userId },
            include: { preferences: true }
        });

        if (!user) {
            res.status(404).json({
                error: 'Not Found',
                message: 'User not found',
                code: 'USER_NOT_FOUND'
            });
            return;
        }

        res.json({
            id: user.id,
            username: user.username,
            email: user.email,
            display_name: user.displayName,
            about_me: user.aboutMe,
            motherhood_stage: user.motherhoodStage,
            profile_image_url: user.profileImageUrl,
            location: user.preferences ? {
                radius: user.preferences.locationRadius,
                anywhere: user.preferences.locationAnywhere,
                city: user.preferences.city,
                country: user.preferences.country
            } : undefined,
            looking_for: user.preferences?.lookingFor || [],
            created_at: user.createdAt
        });
    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'An error occurred',
            code: 'INTERNAL_ERROR'
        });
    }
};

export const updateCurrentUser = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const data = updateProfileSchema.parse(req.body);

        // Update user
        const user = await prisma.user.update({
            where: { id: req.user!.userId },
            data: {
                displayName: data.display_name,
                aboutMe: data.about_me,
                motherhoodStage: data.motherhood_stage
            }
        });

        // Update or create preferences
        if (data.location || data.looking_for) {
            await prisma.userPreference.upsert({
                where: { userId: user.id },
                create: {
                    userId: user.id,
                    locationRadius: data.location?.radius || 10,
                    locationAnywhere: data.location?.anywhere || false,
                    latitude: data.location?.latitude,
                    longitude: data.location?.longitude,
                    city: data.location?.city,
                    country: data.location?.country,
                    lookingFor: data.looking_for || []
                },
                update: {
                    ...(data.location && {
                        locationRadius: data.location.radius,
                        locationAnywhere: data.location.anywhere,
                        latitude: data.location.latitude,
                        longitude: data.location.longitude,
                        city: data.location.city,
                        country: data.location.country
                    }),
                    ...(data.looking_for && { lookingFor: data.looking_for })
                }
            });
        }

        // Fetch updated user with preferences
        const updatedUser = await prisma.user.findUnique({
            where: { id: user.id },
            include: { preferences: true }
        });

        res.json({
            id: updatedUser!.id,
            username: updatedUser!.username,
            email: updatedUser!.email,
            display_name: updatedUser!.displayName,
            about_me: updatedUser!.aboutMe,
            motherhood_stage: updatedUser!.motherhoodStage,
            profile_image_url: updatedUser!.profileImageUrl,
            location: updatedUser!.preferences ? {
                radius: updatedUser!.preferences.locationRadius,
                anywhere: updatedUser!.preferences.locationAnywhere,
                city: updatedUser!.preferences.city,
                country: updatedUser!.preferences.country
            } : undefined,
            looking_for: updatedUser!.preferences?.lookingFor || [],
            created_at: updatedUser!.createdAt
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

        console.error('Update user error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'An error occurred',
            code: 'INTERNAL_ERROR'
        });
    }
};

export const searchUsers = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const query = req.query.q as string;
        if (!query || query.trim().length === 0) {
            res.json({ users: [] });
            return;
        }

        const users = await prisma.user.findMany({
            where: {
                OR: [
                    { username: { contains: query, mode: 'insensitive' } },
                    { displayName: { contains: query, mode: 'insensitive' } }
                ]
            },
            take: 20,
            select: {
                id: true,
                username: true,
                displayName: true,
                profileImageUrl: true,
                motherhoodStage: true
            }
        });

        res.json({
            users: users.map(u => ({
                id: u.id,
                username: u.username,
                display_name: u.displayName,
                profile_image_url: u.profileImageUrl,
                motherhood_stage: u.motherhoodStage
            }))
        });
    } catch (error) {
        console.error('Search users error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'An error occurred',
            code: 'INTERNAL_ERROR'
        });
    }
};

export const getPublicProfile = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const userId = req.params.id as string;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                _count: {
                    select: {
                        createdGroups: true,
                        posts: true
                    }
                }
            }
        });

        if (!user) {
            res.status(404).json({
                error: 'Not Found',
                message: 'User not found',
                code: 'USER_NOT_FOUND'
            });
            return;
        }

        res.json({
            id: user.id,
            username: user.username,
            display_name: user.displayName,
            about_me: user.aboutMe,
            motherhood_stage: user.motherhoodStage,
            profile_image_url: user.profileImageUrl,
            created_at: user.createdAt,
            stats: {
                groups_created: (user as any)._count?.createdGroups || 0,
                posts_created: (user as any)._count?.posts || 0
            }
        });
    } catch (error) {
        console.error('Get public profile error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'An error occurred',
            code: 'INTERNAL_ERROR'
        });
    }
};

