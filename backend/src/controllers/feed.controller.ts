import { Response } from 'express';
import { Prisma } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import prisma from '../utils/prisma';

export const getActivityFeed = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const limit = parseInt((typeof req.query.limit === 'string' ? req.query.limit : '20')) || 20;
        const offset = parseInt((typeof req.query.offset === 'string' ? req.query.offset : '0')) || 0;

        // Get user's groups
        const userGroups = await prisma.groupMember.findMany({
            where: { userId: req.user!.userId },
            select: { groupId: true }
        });

        const groupIds = userGroups.map((g: { groupId: any; }) => g.groupId);

        if (groupIds.length === 0) {
            res.json({
                posts: [],
                total: 0,
                has_more: false
            });
            return;
        }

        // Get posts from user's groups
        const [posts, total] = await Promise.all([
            prisma.post.findMany({
                where: {
                    groupId: { in: groupIds }
                },
                take: limit,
                skip: offset,
                orderBy: { createdAt: 'desc' },
                include: {
                    author: true,
                    group: true,
                    likes: {
                        where: { userId: req.user!.userId }
                    }
                }
            }),
            prisma.post.count({
                where: {
                    groupId: { in: groupIds }
                }
            })
        ]);

        res.json({
            posts: posts.map((post: Prisma.PostGetPayload<{
                include: {
                    author: true,
                    group: true,
                    likes: true
                }
            }>) => ({
                id: post.id,
                group: {
                    id: post.group.id,
                    name: post.group.name,
                    image_emoji: post.group.imageEmoji
                },
                author: post.author ? {
                    id: post.author.id,
                    username: post.author.username,
                    display_name: post.author.displayName,
                    profile_image_url: post.author.profileImageUrl
                } : null,
                content: post.content,
                likes_count: post.likesCount,
                comments_count: post.commentsCount,
                is_liked: post.likes.length > 0,
                created_at: post.createdAt
            })),
            total,
            has_more: offset + limit < total
        });
    } catch (error) {
        console.error('Get activity feed error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'An error occurred',
            code: 'INTERNAL_ERROR'
        });
    }
};
