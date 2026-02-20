import { Response } from 'express';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import prisma from '../utils/prisma';
import { io } from '../index';

const createPostSchema = z.object({
    content: z.string().min(1).max(5000)
});

const createCommentSchema = z.object({
    content: z.string().min(1).max(2000)
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

        const [posts, total] = await Promise.all([
            prisma.post.findMany({
                where: { groupId: groupId },
                take: limit,
                skip: offset,
                orderBy: { createdAt: 'desc' },
                include: {
                    author: true,
                    likes: {
                        where: { userId: req.user!.userId }
                    }
                }
            }),
            prisma.post.count({ where: { groupId: groupId } })
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

        const post = await prisma.post.create({
            data: {
                groupId: groupId,
                authorId: req.user!.userId,
                content: data.content
            },
            include: {
                author: true
            }
        });

        res.status(201).json({
            id: post.id,
            group_id: post.groupId,
            author: {
                id: post.author!.id,
                username: post.author!.username,
                display_name: post.author!.displayName
            },
            content: post.content,
            likes_count: post.likesCount,
            comments_count: post.commentsCount,
            created_at: post.createdAt
        });

        // Notify clients of a feed update
        io.emit('feed_updated');
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

        // Create like and increment count
        await prisma.$transaction([
            prisma.postLike.create({
                data: {
                    postId: post.id,
                    userId: req.user!.userId
                }
            }),
            prisma.post.update({
                where: { id: post.id },
                data: { likesCount: { increment: 1 } }
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

        const [comments, total] = await Promise.all([
            prisma.comment.findMany({
                where: { postId: postId },
                take: limit,
                skip: offset,
                orderBy: { createdAt: 'asc' },
                include: {
                    author: true
                }
            }),
            prisma.comment.count({ where: { postId: postId } })
        ]);

        res.json({
            comments: comments.map((comment: Prisma.CommentGetPayload<{
                include: {
                    author: true
                }
            }>) => ({
                id: comment.id,
                post_id: comment.postId,
                author: comment.author ? {
                    id: comment.author.id,
                    username: comment.author.username,
                    display_name: comment.author.displayName,
                    profile_image_url: comment.author.profileImageUrl
                } : null,
                content: comment.content,
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

        // Create comment and increment count
        const [comment] = await prisma.$transaction([
            prisma.comment.create({
                data: {
                    postId: post.id,
                    authorId: req.user!.userId,
                    content: data.content
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
            author: {
                id: comment.author!.id,
                username: comment.author!.username,
                display_name: comment.author!.displayName
            },
            content: comment.content,
            created_at: comment.createdAt
        });

        io.emit('feed_updated');
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
