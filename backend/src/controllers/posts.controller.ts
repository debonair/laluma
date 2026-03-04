import { Response } from 'express';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import prisma from '../utils/prisma';
import { getIO } from '../socket';
import { encryptIdentity } from '../utils/crypto';
import { generateAnonymousProfile } from '../utils/anonymousProfile';
import { containsBlockedKeywords } from '../services/moderation.service';
import { moderationQueue } from '../lib/bullmq';

const createPostSchema = z.object({
    content: z.string().min(1, 'Post content cannot be empty').max(2000, 'Post content is too long'),
    isAnonymous: z.boolean().optional(),
    mediaUrls: z.array(z.string().url()).max(4, 'Maximum of 4 media attachments allowed').optional(),
    poll: z.object({
        question: z.string().min(1).max(255),
        options: z.array(z.string().min(1).max(100)).min(2).max(10)
    }).optional()
});

const createCommentSchema = z.object({
    content: z.string().min(1, 'Comment content cannot be empty').max(1000, 'Comment content is too long'),
    isAnonymous: z.boolean().optional().default(false),
    mediaUrls: z.array(z.string().url()).max(4, 'Maximum of 4 media attachments allowed').optional()
});

const editPostSchema = z.object({
    content: z.string().min(1, 'Post content cannot be empty').max(2000, 'Post content is too long')
});

const editCommentSchema = z.object({
    content: z.string().min(1, 'Comment content cannot be empty').max(1000, 'Comment content is too long')
});

export const getGroupPosts = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const groupId = req.params.groupId as string;
        const limit = parseInt((typeof req.query.limit === 'string' ? req.query.limit : '20')) || 20;
        const offset = parseInt((typeof req.query.offset === 'string' ? req.query.offset : '0')) || 0;

        // Check if user is a member
        const member = await prisma.groupMember.findUnique({
            where: {
                groupId_userId: {
                    groupId: groupId,
                    userId: req.user!.userId
                }
            }
        });

        if (!member) {
            res.status(403).json({
                error: 'Forbidden',
                message: 'Not a member of this group',
                code: 'NOT_MEMBER'
            });
            return;
        }

        // Get blocked users
        const blocks = await prisma.userBlock.findMany({
            where: {
                OR: [
                    { blockerId: req.user!.userId },
                    { blockedId: req.user!.userId }
                ]
            }
        });
        const blockedUserIds = blocks.map(b => b.blockerId === req.user!.userId ? b.blockedId : b.blockerId);

        const [posts, total] = await Promise.all([
            prisma.post.findMany({
                where: {
                    groupId: groupId,
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
                take: limit,
                skip: offset,
                orderBy: { createdAt: 'desc' },
                include: {
                    author: true,
                    likes: {
                        where: { userId: req.user!.userId }
                    },
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
            }),
            prisma.post.count({
                where: {
                    groupId: groupId,
                    deletedAt: null,
                    NOT: {
                        moderationItem: {
                            reports: {
                                some: { reporterId: req.user!.userId }
                            }
                        }
                    }
                }
            })
        ]);

        res.json({
            posts: posts.map((post: Prisma.PostGetPayload<{
                include: {
                    author: true,
                    likes: true
                }
            }>) => ({
                id: post.id,
                group_id: post.groupId,
                author: post.isAnonymous && post.authorId !== req.user!.userId ? {
                    id: 'anonymous',
                    username: 'anonymous',
                    display_name: 'Anonymous Mom',
                    profile_image_url: undefined
                } : (post.author ? {
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
                poll: (post as any).poll
            })),
            total,
            has_more: offset + limit < total
        });
    } catch (error) {
        console.error('Get group posts error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'An error occurred',
            code: 'INTERNAL_ERROR'
        });
    }
};

export const createPost = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const groupId = req.params.groupId as string;
        const data = createPostSchema.parse(req.body);

        // Check if user is a member
        const member = await prisma.groupMember.findUnique({
            where: {
                groupId_userId: {
                    groupId: groupId,
                    userId: req.user!.userId
                }
            }
        });

        if (!member) {
            res.status(403).json({
                error: 'Forbidden',
                message: 'Not a member of this group',
                code: 'NOT_MEMBER'
            });
            return;
        }

        // Story 6.1: Server-side keyword blocklist validation
        if (containsBlockedKeywords(data.content)) {
            res.status(400).json({
                error: 'Bad Request',
                message: 'Content contains restricted keywords.',
                code: 'CONTENT_BLOCKED'
            });
            return;
        }

        const post = await prisma.$transaction(async (tx) => {
            const newPost = await tx.post.create({
                data: {
                    groupId: groupId,
                    authorId: data.isAnonymous ? null : req.user!.userId,
                    content: data.content,
                    mediaUrls: data.mediaUrls || [],
                    isAnonymous: data.isAnonymous || false,
                    poll: data.poll ? {
                        create: {
                            question: data.poll.question,
                            options: {
                                create: data.poll.options.map((opt, i) => ({ text: opt, order: i }))
                            }
                        }
                    } : undefined
                },
                include: {
                    author: true,
                    poll: {
                        include: { options: true }
                    }
                }
            });

            if (data.isAnonymous) {
                // Generate a deterministic identity link for the backend tracing (Story 4.1)
                const identityLinkId = `${newPost.id}`; // Simple 1:1 string link, though UUIDs could also work

                await tx.anonymousPostLink.create({
                    data: {
                        identityLinkId,
                        encryptedUserId: encryptIdentity(req.user!.userId)
                    }
                });

                // Link the post to the identity table without foreign keys ensuring anonymity constraint
                await tx.post.update({
                    where: { id: newPost.id },
                    data: { identityLinkId }
                });
            }

            return newPost;
        });

        // Determine profile details for output
        let authorData = null;
        if (post.isAnonymous) {
            // Using identityLinkId as the seed ensures the same 'anonymous' persona across the post
            const anonProfile = generateAnonymousProfile(post.identityLinkId || post.id);
            authorData = {
                id: 'anonymous',
                username: 'anonymous',
                display_name: anonProfile.displayName,
                profile_image_url: anonProfile.avatarUrl
            };
        } else if (post.author) {
            authorData = {
                id: post.author.id,
                username: post.author.username,
                display_name: post.author.displayName,
                profile_image_url: post.author.profileImageUrl
            };
        }

        // Story 6.2: Dispatch async AI sentiment evaluation job
        // We do not await this, so it runs in background without blocking the HTTP response
        moderationQueue.add('moderatePost', {
            postId: post.id,
            content: post.content,
            isComment: false
        }).catch((err: any) => console.error('Failed to dispatch moderatePost job', err));

        res.status(201).json({
            id: post.id,
            group_id: post.groupId,
            author: authorData,
            is_anonymous: post.isAnonymous,
            content: post.content,
            media_urls: post.mediaUrls,
            likes_count: post.likesCount,
            comments_count: post.commentsCount,
            created_at: post.createdAt,
            updated_at: post.updatedAt,
            deleted_at: post.deletedAt,
            poll: post.poll
        });

        // Emit targeted real-time event to all members in this group's socket room
        try {
            getIO().to(`group_${groupId}`).emit('new_post', {
                id: post.id,
                group_id: post.groupId,
                author: authorData,
                is_anonymous: post.isAnonymous,
                content: post.content,
                media_urls: post.mediaUrls,
                likes_count: post.likesCount,
                comments_count: post.commentsCount,
                created_at: post.createdAt,
                deleted_at: post.deletedAt
            });
        } catch {
            // Socket not initialized in test/offline environments — safe to ignore
        }
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

        console.error('Create post error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'An error occurred',
            code: 'INTERNAL_ERROR'
        });
    }
};

export const likePost = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const postId = req.params.postId as string;
        const post = await prisma.post.findUnique({
            where: { id: postId }
        });

        if (!post) {
            res.status(404).json({
                error: 'Not Found',
                message: 'Post not found',
                code: 'POST_NOT_FOUND'
            });
            return;
        }

        const reactionType = (req.body.reactionType as string) || 'like';

        const existingLike = await prisma.postLike.findUnique({
            where: {
                postId_userId: {
                    postId: post.id,
                    userId: req.user!.userId
                }
            }
        });

        if (existingLike) {
            if (existingLike.reactionType !== reactionType) {
                await prisma.postLike.update({
                    where: { id: existingLike.id },
                    data: { reactionType }
                });
            }
        } else {
            await prisma.$transaction([
                prisma.postLike.create({
                    data: {
                        postId: post.id,
                        userId: req.user!.userId,
                        reactionType
                    }
                }),
                prisma.post.update({
                    where: { id: post.id },
                    data: { likesCount: { increment: 1 } }
                })
            ]);
        }

        const updatedPost = await prisma.post.findUnique({
            where: { id: post.id }
        });

        res.json({
            success: true,
            likes_count: updatedPost!.likesCount
        });
    } catch (error) {
        console.error('Like post error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'An error occurred',
            code: 'INTERNAL_ERROR'
        });
    }
};

export const unlikePost = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const postId = req.params.postId as string;
        const post = await prisma.post.findUnique({
            where: { id: postId }
        });

        if (!post) {
            res.status(404).json({
                error: 'Not Found',
                message: 'Post not found',
                code: 'POST_NOT_FOUND'
            });
            return;
        }

        // Delete like and decrement count
        await prisma.$transaction([
            prisma.postLike.delete({
                where: {
                    postId_userId: {
                        postId: post.id,
                        userId: req.user!.userId
                    }
                }
            }),
            prisma.post.update({
                where: { id: post.id },
                data: { likesCount: { decrement: 1 } }
            })
        ]);

        const updatedPost = await prisma.post.findUnique({
            where: { id: post.id }
        });

        res.json({
            success: true,
            likes_count: updatedPost!.likesCount
        });
    } catch (error) {
        console.error('Unlike post error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'An error occurred',
            code: 'INTERNAL_ERROR'
        });
    }
};

export const getPostComments = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const postId = req.params.postId as string;
        const limit = parseInt((typeof req.query.limit === 'string' ? req.query.limit : '50')) || 50;
        const offset = parseInt((typeof req.query.offset === 'string' ? req.query.offset : '0')) || 0;

        const blocks = await prisma.userBlock.findMany({
            where: {
                OR: [
                    { blockerId: req.user!.userId },
                    { blockedId: req.user!.userId }
                ]
            }
        });
        const blockedUserIds = blocks.map(b => b.blockerId === req.user!.userId ? b.blockedId : b.blockerId);

        const [comments, total] = await Promise.all([
            prisma.comment.findMany({
                where: {
                    postId: postId,
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
                take: limit,
                skip: offset,
                orderBy: { createdAt: 'asc' },
                include: {
                    author: true,
                    likes: {
                        where: { userId: req.user!.userId }
                    }
                }
            }),
            prisma.comment.count({
                where: {
                    postId: postId,
                    deletedAt: null,
                    authorId: { notIn: blockedUserIds },
                    NOT: {
                        moderationItem: {
                            reports: {
                                some: { reporterId: req.user!.userId }
                            }
                        }
                    }
                }
            })
        ]);

        res.json({
            comments: comments.map((comment: Prisma.CommentGetPayload<{
                include: {
                    author: true,
                    likes: true
                }
            }>) => ({
                id: comment.id,
                post_id: comment.postId,
                author: comment.isAnonymous && comment.authorId !== req.user!.userId ? {
                    id: 'anonymous',
                    username: 'anonymous',
                    display_name: 'Anonymous Mom',
                    profile_image_url: undefined
                } : (comment.author ? {
                    id: comment.author.id,
                    username: comment.author.username,
                    display_name: comment.author.displayName,
                    profile_image_url: comment.author.profileImageUrl
                } : null),
                is_anonymous: comment.isAnonymous,
                content: comment.content,
                likes_count: comment.likesCount,
                is_liked: comment.likes.length > 0,
                user_reaction_type: comment.likes[0]?.reactionType || null,
                created_at: comment.createdAt
            })),
            total,
            has_more: offset + limit < total
        });
    } catch (error) {
        console.error('Get comments error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'An error occurred',
            code: 'INTERNAL_ERROR'
        });
    }
};

export const createComment = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const postId = req.params.postId as string;
        const data = createCommentSchema.parse(req.body);

        const post = await prisma.post.findUnique({
            where: { id: postId }
        });

        if (!post) {
            res.status(404).json({
                error: 'Not Found',
                message: 'Post not found',
                code: 'POST_NOT_FOUND'
            });
            return;
        }

        // Story 6.1: Server-side keyword blocklist validation
        if (containsBlockedKeywords(data.content)) {
            res.status(400).json({
                error: 'Bad Request',
                message: 'Content contains restricted keywords.',
                code: 'CONTENT_BLOCKED'
            });
            return;
        }

        // Create comment and increment count
        const [comment] = await prisma.$transaction([
            prisma.comment.create({
                data: {
                    postId: post.id,
                    authorId: req.user!.userId,
                    content: data.content,
                    mediaUrls: data.mediaUrls || [],
                    isAnonymous: data.isAnonymous || false
                },
                include: {
                    author: true
                }
            }),
            prisma.post.update({
                where: { id: post.id },
                data: { commentsCount: { increment: 1 } }
            })
        ]);

        res.status(201).json({
            id: comment.id,
            post_id: comment.postId,
            author: comment.isAnonymous ? {
                id: 'anonymous',
                username: 'anonymous',
                display_name: 'Anonymous Mom'
            } : (comment.author ? {
                id: comment.author.id,
                username: comment.author.username,
                display_name: comment.author.displayName
            } : null),
            is_anonymous: comment.isAnonymous,
            content: comment.content,
            media_urls: comment.mediaUrls,
            created_at: comment.createdAt
        });

        // Story 6.2: AI Sentiment evaluation for comments
        moderationQueue.add('moderatePost', {
            postId: comment.id,
            content: comment.content,
            isComment: true
        }).catch((err: any) => console.error('Failed to dispatch moderateComment job', err));

        getIO().emit('feed_updated');
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

        console.error('Create comment error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'An error occurred',
            code: 'INTERNAL_ERROR'
        });
    }
};

export const deletePost = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const postId = req.params.postId as string;

        // Find the post
        const post = await prisma.post.findUnique({
            where: { id: postId }
        });

        if (!post) {
            res.status(404).json({
                error: 'Not Found',
                message: 'Post not found',
                code: 'POST_NOT_FOUND'
            });
            return;
        }

        // Check if user is the author
        let canDelete = post.authorId === req.user!.userId;

        // If not author, check if user is admin or moderator of the group
        if (!canDelete) {
            const member = await prisma.groupMember.findUnique({
                where: {
                    groupId_userId: {
                        groupId: post.groupId,
                        userId: req.user!.userId
                    }
                }
            });

            if (member && (member.role === 'admin' || member.role === 'moderator')) {
                canDelete = true;
            }
        }

        if (!canDelete) {
            res.status(403).json({
                error: 'Forbidden',
                message: 'You do not have permission to delete this post',
                code: 'FORBIDDEN'
            });
            return;
        }

        await prisma.post.update({
            where: { id: postId },
            data: { deletedAt: new Date() }
        });

        // Notify clients of a feed update
        getIO().emit('feed_updated');

        res.json({ success: true, message: 'Post deleted successfully' });
    } catch (error) {
        console.error('Delete post error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'An error occurred',
            code: 'INTERNAL_ERROR'
        });
    }
};
export const editPost = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const postId = req.params.postId as string;
        const data = editPostSchema.parse(req.body);

        const post = await prisma.post.findUnique({
            where: { id: postId }
        });

        if (!post || post.deletedAt !== null) {
            res.status(404).json({
                error: 'Not Found',
                message: 'Post not found or has been deleted',
                code: 'POST_NOT_FOUND'
            });
            return;
        }

        // Only author can edit the post
        if (post.authorId !== req.user!.userId) {
            res.status(403).json({
                error: 'Forbidden',
                message: 'You do not have permission to edit this post',
                code: 'FORBIDDEN'
            });
            return;
        }

        const updatedPost = await prisma.post.update({
            where: { id: postId },
            data: {
                content: data.content
            },
            include: {
                author: true,
                poll: {
                    include: { options: true }
                }
            }
        });

        res.status(200).json({
            id: updatedPost.id,
            group_id: updatedPost.groupId,
            author: updatedPost.isAnonymous ? {
                id: 'anonymous',
                username: 'anonymous',
                display_name: 'Anonymous Mom',
                profile_image_url: undefined
            } : (updatedPost.author ? {
                id: updatedPost.author.id,
                username: updatedPost.author.username,
                display_name: updatedPost.author.displayName,
                profile_image_url: updatedPost.author.profileImageUrl
            } : null),
            is_anonymous: updatedPost.isAnonymous,
            content: updatedPost.content,
            media_urls: updatedPost.mediaUrls,
            likes_count: updatedPost.likesCount,
            comments_count: updatedPost.commentsCount,
            created_at: updatedPost.createdAt,
            updated_at: updatedPost.updatedAt,
            deleted_at: updatedPost.deletedAt,
            poll: updatedPost.poll
        });

        // Emit real-time event
        try {
            getIO().to(`group_${updatedPost.groupId}`).emit('post_updated', {
                id: updatedPost.id,
                content: updatedPost.content,
                updated_at: updatedPost.updatedAt
            });
        } catch (err) {
            console.error('Failed to emit post_updated socket event:', err);
        }

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
        console.error('Edit post error:', error);
        res.status(500).json({
            error: 'Internal Server Error'
        });
    }
};

export const editComment = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const commentId = req.params.commentId as string;
        const data = editCommentSchema.parse(req.body);

        const comment = await prisma.comment.findUnique({
            where: { id: commentId }
        });

        if (!comment || comment.deletedAt !== null) {
            res.status(404).json({
                error: 'Not Found',
                message: 'Comment not found or has been deleted',
                code: 'COMMENT_NOT_FOUND'
            });
            return;
        }

        if (comment.authorId !== req.user!.userId) {
            res.status(403).json({
                error: 'Forbidden',
                message: 'You do not have permission to edit this comment',
                code: 'FORBIDDEN'
            });
            return;
        }

        const updatedComment = await prisma.comment.update({
            where: { id: commentId },
            data: {
                content: data.content
            }
        });

        res.status(200).json({
            id: updatedComment.id,
            content: updatedComment.content,
            updated_at: updatedComment.updatedAt
        });

        try {
            getIO().emit('comment_updated', {
                id: updatedComment.id,
                content: updatedComment.content,
                updated_at: updatedComment.updatedAt
            });
        } catch (err) {
            console.error('Failed to emit comment_updated socket event:', err);
        }
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
        console.error('Edit comment error:', error);
        res.status(500).json({
            error: 'Internal Server Error'
        });
    }
};

export const deleteComment = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const commentId = req.params.commentId as string;

        const comment = await prisma.comment.findUnique({
            where: { id: commentId },
            include: { post: true }
        });

        if (!comment || comment.deletedAt !== null) {
            res.status(404).json({
                error: 'Not Found',
                message: 'Comment not found',
                code: 'COMMENT_NOT_FOUND'
            });
            return;
        }

        let canDelete = comment.authorId === req.user!.userId;

        if (!canDelete) {
            const member = await prisma.groupMember.findUnique({
                where: {
                    groupId_userId: {
                        groupId: comment.post.groupId,
                        userId: req.user!.userId
                    }
                }
            });

            if (member && (member.role === 'admin' || member.role === 'moderator')) {
                canDelete = true;
            }
        }

        if (!canDelete) {
            res.status(403).json({
                error: 'Forbidden',
                message: 'You do not have permission to delete this comment',
                code: 'FORBIDDEN'
            });
            return;
        }

        await prisma.$transaction([
            prisma.comment.update({
                where: { id: commentId },
                data: { deletedAt: new Date() }
            }),
            prisma.post.update({
                where: { id: comment.postId },
                data: { commentsCount: { decrement: 1 } }
            })
        ]);

        try {
            getIO().emit('feed_updated');
        } catch (err) {
            console.error('Failed to emit feed_updated socket event:', err);
        }

        res.json({ success: true, message: 'Comment deleted successfully' });
    } catch (error) {
        console.error('Delete comment error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'An error occurred',
            code: 'INTERNAL_ERROR'
        });
    }
};

export const likeComment = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const commentId = req.params.commentId as string;
        const reactionType = (req.body.reactionType as string) || 'like';

        const comment = await prisma.comment.findUnique({
            where: { id: commentId }
        });

        if (!comment || comment.deletedAt !== null) {
            res.status(404).json({
                error: 'Not Found',
                message: 'Comment not found',
                code: 'COMMENT_NOT_FOUND'
            });
            return;
        }

        const existingLike = await prisma.commentLike.findUnique({
            where: {
                commentId_userId: {
                    commentId: comment.id,
                    userId: req.user!.userId
                }
            }
        });

        if (existingLike) {
            if (existingLike.reactionType !== reactionType) {
                await prisma.commentLike.update({
                    where: { id: existingLike.id },
                    data: { reactionType }
                });
            }
        } else {
            await prisma.$transaction([
                prisma.commentLike.create({
                    data: {
                        commentId: comment.id,
                        userId: req.user!.userId,
                        reactionType
                    }
                }),
                prisma.comment.update({
                    where: { id: comment.id },
                    data: { likesCount: { increment: 1 } }
                })
            ]);
        }

        const updatedComment = await prisma.comment.findUnique({
            where: { id: comment.id }
        });

        // We emit to post room implicitly via parent context later if needed
        try {
            getIO().emit('comment_updated', {
                id: updatedComment!.id,
                likes_count: updatedComment!.likesCount
            });
        } catch (err) {
            console.error('Failed to emit comment_updated socket event:', err);
        }

        res.json({
            success: true,
            likes_count: updatedComment!.likesCount
        });
    } catch (error) {
        console.error('Like comment error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'An error occurred',
            code: 'INTERNAL_ERROR'
        });
    }
};

export const unlikeComment = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const commentId = req.params.commentId as string;
        const comment = await prisma.comment.findUnique({
            where: { id: commentId }
        });

        if (!comment || comment.deletedAt !== null) {
            res.status(404).json({
                error: 'Not Found',
                message: 'Comment not found',
                code: 'COMMENT_NOT_FOUND'
            });
            return;
        }

        await prisma.$transaction([
            prisma.commentLike.delete({
                where: {
                    commentId_userId: {
                        commentId: comment.id,
                        userId: req.user!.userId
                    }
                }
            }),
            prisma.comment.update({
                where: { id: comment.id },
                data: { likesCount: { decrement: 1 } }
            })
        ]);

        const updatedComment = await prisma.comment.findUnique({
            where: { id: comment.id }
        });

        try {
            getIO().emit('comment_updated', {
                id: updatedComment!.id,
                likes_count: updatedComment!.likesCount
            });
        } catch (err) {
            console.error('Failed to emit comment_updated socket event:', err);
        }

        res.json({
            success: true,
            likes_count: updatedComment!.likesCount
        });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            // Already unliked / not found
            res.json({ success: true });
            return;
        }
        console.error('Unlike comment error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'An error occurred',
            code: 'INTERNAL_ERROR'
        });
    }
};
