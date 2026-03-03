import { Response } from 'express';
import { Prisma } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import prisma from '../utils/prisma';

/**
 * GET /feed
 * Returns the authenticated user's group-filtered chronological feed.
 * Supports cursor-based pagination via `?cursor=<lastPostId>` parameter.
 * Falls back to offset-based pagination via `?limit=N&offset=N`.
 */
export const getFeed = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const limit = parseInt((typeof req.query.limit === 'string' ? req.query.limit : '20')) || 20;
        const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;

        // Get user's joined group IDs
        const userGroups = await prisma.groupMember.findMany({
            where: { userId: req.user!.userId },
            select: { groupId: true }
        });

        const groupIds = userGroups.map((g: { groupId: string }) => g.groupId);

        if (groupIds.length === 0) {
            res.json({ posts: [], nextCursor: null, has_more: false });
            return;
        }

        // Build Prisma query with optional cursor for pagination
        const posts = await prisma.post.findMany({
            where: { groupId: { in: groupIds } },
            take: limit + 1, // Fetch one extra to detect if there are more
            ...(cursor
                ? { cursor: { id: cursor }, skip: 1 }
                : {}),
            orderBy: { createdAt: 'desc' },
            include: {
                author: true,
                group: true,
                likes: { where: { userId: req.user!.userId } }
            }
        });

        const hasMore = posts.length > limit;
        const trimmedPosts = hasMore ? posts.slice(0, limit) : posts;
        const nextCursor = hasMore ? trimmedPosts[trimmedPosts.length - 1].id : null;

        res.json({
            posts: trimmedPosts.map((post: Prisma.PostGetPayload<{
                include: { author: true; group: true; likes: true }
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
            next_cursor: nextCursor,
            has_more: hasMore
        });
    } catch (error) {
        console.error('Get feed error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'An error occurred',
            code: 'INTERNAL_ERROR'
        });
    }
};

/**
 * @deprecated Use getFeed instead. Kept for backward compatibility.
 */
export const getActivityFeed = getFeed;
