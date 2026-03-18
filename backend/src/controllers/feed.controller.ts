import { Response } from 'express';
import { Prisma } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import prisma from '../utils/prisma';
import { generateAnonymousProfile } from '../utils/anonymousProfile';

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

        // Get blocked users (both directions)
        const blocks = await prisma.userBlock.findMany({
            where: {
                OR: [
                    { blockerId: req.user!.userId },
                    { blockedId: req.user!.userId }
                ]
            }
        });
        const blockedUserIds = blocks.map(b => b.blockerId === req.user!.userId ? b.blockedId : b.blockerId);

        // Build Prisma query with optional cursor for pagination
        const posts = await prisma.post.findMany({
            where: {
                groupId: { in: groupIds },
                deletedAt: null,
                authorId: { notIn: blockedUserIds },
                NOT: {
                    moderationItem: {
                        reports: {
                            some: { reporterId: req.user!.userId }
                        }
                    }
                }
            },
            take: limit + 1, // Fetch one extra to detect if there are more
            ...(cursor
                ? { cursor: { id: cursor }, skip: 1 }
                : {}),
            orderBy: { createdAt: 'desc' },
            include: {
                author: true,
                group: true,
                likes: { where: { userId: req.user!.userId } },
                poll: {
                    include: {
                        options: {
                            include: { _count: { select: { votes: true } } },
                            orderBy: { order: 'asc' }
                        },
                        votes: { where: { userId: req.user?.userId || 'unknown' } }
                    }
                }
            }
        });

        const hasMore = posts.length > limit;
        const trimmedPosts = hasMore ? posts.slice(0, limit) : posts;
        const nextCursor = hasMore ? trimmedPosts[trimmedPosts.length - 1].id : null;

        res.json({
            posts: trimmedPosts.map((post: any) => {
                const poll = post.poll ? {
                    id: post.poll.id,
                    question: post.poll.question,
                    totalVotes: post.poll.options.reduce((sum: number, opt: any) => sum + opt._count.votes, 0),
                    hasVoted: post.poll.votes.length > 0,
                    userVoteOptionId: post.poll.votes.length > 0 ? post.poll.votes[0].optionId : null,
                    options: post.poll.options.map((opt: any) => {
                        const totalVotes = post.poll.options.reduce((sum: number, o: any) => sum + o._count.votes, 0);
                        return {
                            id: opt.id,
                            text: opt.text,
                            votes: opt._count.votes,
                            percentage: totalVotes > 0 ? Math.round((opt._count.votes / totalVotes) * 100) : 0
                        };
                    })
                } : null;

                return {
                    id: post.id,
                    group: {
                        id: post.group.id,
                        name: post.group.name,
                        image_emoji: post.group.imageEmoji
                    },
                    author: post.isAnonymous ? (() => {
                        const anonProfile = generateAnonymousProfile(post.identityLinkId || post.id);
                        return {
                            id: 'anonymous',
                            username: 'anonymous',
                            display_name: anonProfile.displayName,
                            profile_image_url: anonProfile.avatarUrl
                        };
                    })() : (post.author ? {
                        id: post.author.id,
                        username: post.author.username,
                        display_name: post.author.displayName,
                        profile_image_url: post.author.profileImageUrl
                    } : null),
                    is_anonymous: post.isAnonymous,
                    content: post.content,
                    likes_count: post.likesCount,
                    comments_count: post.commentsCount,
                    is_liked: post.likes.length > 0,
                    user_reaction_type: post.likes[0]?.reactionType || null,
                    created_at: post.createdAt,
                    poll
                };
            }),
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
