import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import prisma from '../utils/prisma';

// Helper to extract string param from req.params
const getStringParam = (param: string | string[] | undefined): string => {
    if (Array.isArray(param)) return param[0];
    return param || '';
};

const createContentSchema = z.object({
    title: z.string().min(1).max(500),
    body: z.string().default(''),
    excerpt: z.string().max(1000).optional(),
    category: z.string(),
    authorName: z.string().optional(),
    thumbnailUrl: z.string().url().optional().or(z.literal('')),
    videoUrl: z.string().optional().or(z.literal('')),
    videoDuration: z.number().int().optional(),
    videoThumbnail: z.string().optional().or(z.literal('')),
    contentType: z.enum(['article', 'video', 'mixed']).default('article'),
    sponsorName: z.string().optional(),
    sponsorLogoUrl: z.string().url().optional().or(z.literal('')),
    sponsorLink: z.string().url().optional().or(z.literal('')),
    isPremium: z.boolean().default(false),
    premiumTier: z.enum(['premium', 'premium_plus']).optional(),
    isFeatured: z.boolean().default(false),
    isActive: z.boolean().default(true),
    status: z.enum(['draft', 'pending', 'approved', 'rejected']).default('draft'),
    publishedAt: z.string().datetime().optional()
});

const updateContentSchema = createContentSchema.partial();

// Get all content (with filtering and pagination)
export const getContent = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const category = typeof req.query.category === 'string' ? req.query.category : undefined;
        const isPremium = req.query.isPremium === 'true' ? true : req.query.isPremium === 'false' ? false : undefined;
        const isFeatured = req.query.isFeatured === 'true';
        const status = typeof req.query.status === 'string' ? req.query.status : 'approved';
        const limit = parseInt((typeof req.query.limit === 'string' ? req.query.limit : '20')) || 20;
        const offset = parseInt((typeof req.query.offset === 'string' ? req.query.offset : '0')) || 0;

        const where: any = {
            isActive: true,
            status: status
        };

        if (category) {
            where.category = category;
        }

        if (isPremium !== undefined) {
            where.isPremium = isPremium;
        }

        if (isFeatured) {
            where.isFeatured = true;
        }

        const [content, total] = await Promise.all([
            prisma.content.findMany({
                where,
                take: limit,
                skip: offset,
                orderBy: [
                    { isFeatured: 'desc' },
                    { publishedAt: 'desc' }
                ],
                include: {
                    author: {
                        select: {
                            id: true,
                            username: true,
                            displayName: true,
                            profileImageUrl: true
                        }
                    },
                    _count: {
                        select: {
                            comments: true,
                            likes: true,
                            bookmarks: true
                        }
                    }
                }
            }),
            prisma.content.count({ where })
        ]);

        // Get user subscription to determine access
        let userTier = 'free';
        if (req.user?.userId) {
            const subscription = await prisma.subscription.findUnique({
                where: { userId: req.user.userId }
            });
            if (subscription && subscription.status === 'active') {
                userTier = subscription.tier;
            }
        }

        const enrichedContent = content.map(item => {
            let hasAccess = !item.isPremium;
            if (item.isPremium) {
                if (item.premiumTier === 'premium_plus') {
                    hasAccess = userTier === 'premium_plus';
                } else {
                    hasAccess = userTier === 'premium' || userTier === 'premium_plus';
                }
            }

            return {
                ...item,
                hasAccess
            };
        });

        res.json({
            content: enrichedContent,
            pagination: {
                total,
                limit,
                offset,
                hasMore: offset + limit < total
            }
        });
    } catch (error) {
        console.error('Error fetching content:', error);
        res.status(500).json({ error: 'Failed to fetch content' });
    }
};

// Get single content by ID
export const getContentById = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const id = getStringParam(req.params.id);
        const userId = req.user?.userId;

        const content = await prisma.content.findUnique({
            where: { id },
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        displayName: true,
                        profileImageUrl: true
                    }
                },
                comments: {
                    include: {
                        author: {
                            select: {
                                id: true,
                                username: true,
                                displayName: true,
                                profileImageUrl: true
                            }
                        }
                    },
                    orderBy: { createdAt: 'desc' }
                },
                _count: {
                    select: {
                        comments: true,
                        likes: true,
                        bookmarks: true
                    }
                }
            }
        });

        if (!content) {
            res.status(404).json({ error: 'Content not found' });
            return;
        }

        // Check access
        let hasAccess = !content.isPremium;
        if (content.isPremium && userId) {
            const subscription = await prisma.subscription.findUnique({
                where: { userId }
            });

            if (subscription && subscription.status === 'active') {
                if (content.premiumTier === 'premium_plus') {
                    hasAccess = subscription.tier === 'premium_plus';
                } else {
                    hasAccess = subscription.tier === 'premium' || subscription.tier === 'premium_plus';
                }
            }
        }

        // Check access for interactions
        let userInteractions = null;
        if (userId) {
            const [liked, bookmarked] = await Promise.all([
                prisma.contentLike.findUnique({
                    where: {
                        contentId_userId: {
                            contentId: id,
                            userId
                        }
                    }
                }),
                prisma.contentBookmark.findUnique({
                    where: {
                        contentId_userId: {
                            contentId: id,
                            userId
                        }
                    }
                })
            ]);

            userInteractions = {
                liked: !!liked,
                bookmarked: !!bookmarked
            };
        }

        // Scrub sensitive data if no access
        const responseContent = { ...content };
        if (!hasAccess) {
            responseContent.body = '';
            responseContent.videoUrl = null;
            // Keep excerpt and other metadata
        }

        res.json({
            ...responseContent,
            hasAccess,
            userInteractions
        });
    } catch (error) {
        console.error('Error fetching content:', error);
        res.status(500).json({ error: 'Failed to fetch content' });
    }
};

// Create content (admin only)
export const createContent = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const validatedData = createContentSchema.parse(req.body);

        const content = await prisma.content.create({
            data: {
                ...validatedData,
                authorId: req.user?.userId,
                publishedAt: validatedData.publishedAt ? new Date(validatedData.publishedAt) : null
            },
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        displayName: true
                    }
                }
            }
        });

        res.status(201).json(content);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Invalid input', details: error.errors });
            return;
        }
        console.error('Error creating content:', error);
        res.status(500).json({ error: 'Failed to create content' });
    }
};

// Update content (admin only)
export const updateContent = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const id = getStringParam(req.params.id);
        const validatedData = updateContentSchema.parse(req.body);

        const content = await prisma.content.update({
            where: { id },
            data: {
                ...validatedData,
                publishedAt: validatedData.publishedAt ? new Date(validatedData.publishedAt) : undefined
            },
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        displayName: true
                    }
                }
            }
        });

        res.json(content);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Invalid input', details: error.errors });
            return;
        }
        console.error('Error updating content:', error);
        res.status(500).json({ error: 'Failed to update content' });
    }
};

// Delete content (admin only)
export const deleteContent = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const id = getStringParam(req.params.id);

        await prisma.content.delete({
            where: { id }
        });

        res.status(204).send();
    } catch (error) {
        console.error('Error deleting content:', error);
        res.status(500).json({ error: 'Failed to delete content' });
    }
};

// Increment view count
export const incrementViewCount = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const id = getStringParam(req.params.id);

        await prisma.content.update({
            where: { id },
            data: {
                viewCount: {
                    increment: 1
                }
            }
        });

        res.status(204).send();
    } catch (error) {
        console.error('Error incrementing view count:', error);
        res.status(500).json({ error: 'Failed to increment view count' });
    }
};

// Add comment to content
export const addComment = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const id = getStringParam(req.params.id);
        const { commentText } = req.body;

        if (!commentText || commentText.trim().length === 0) {
            res.status(400).json({ error: 'Comment text is required' });
            return;
        }

        const comment = await prisma.contentComment.create({
            data: {
                contentId: id,
                authorId: req.user!.userId,
                commentText: commentText.trim(),
                status: 'visible'
            },
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        displayName: true,
                        profileImageUrl: true
                    }
                }
            }
        });

        // Increment comments count
        const content = await prisma.content.update({
            where: { id },
            data: {
                commentsCount: {
                    increment: 1
                }
            },
            select: { authorId: true, title: true }
        });

        // Notify author if not self-comment
        if (content.authorId && content.authorId !== req.user!.userId) {
            await prisma.notification.create({
                data: {
                    userId: content.authorId,
                    actorId: req.user!.userId,
                    type: 'comment',
                    message: `commented on: "${content.title}"`,
                    metadata: { contentId: id, commentId: comment.id }
                }
            });
        }

        res.status(201).json(comment);
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({ error: 'Failed to add comment' });
    }
};

// Get comments for content
export const getComments = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const id = getStringParam(req.params.id);
        const limit = parseInt((typeof req.query.limit === 'string' ? req.query.limit : '50')) || 50;
        const offset = parseInt((typeof req.query.offset === 'string' ? req.query.offset : '0')) || 0;

        const comments = await prisma.contentComment.findMany({
            where: {
                contentId: id,
                status: 'visible'
            },
            take: limit,
            skip: offset,
            orderBy: { createdAt: 'desc' },
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        displayName: true,
                        profileImageUrl: true
                    }
                }
            }
        });

        res.json(comments);
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ error: 'Failed to fetch comments' });
    }
};

// Like content
export const likeContent = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const id = getStringParam(req.params.id);
        const userId = req.user!.userId;

        await prisma.contentLike.create({
            data: {
                contentId: id,
                userId
            }
        });

        // Increment likes count
        const updatedContent = await prisma.content.update({
            where: { id },
            data: {
                likesCount: {
                    increment: 1
                }
            },
            select: { authorId: true, title: true }
        });

        // Notify author if not self-like
        if (updatedContent.authorId && updatedContent.authorId !== userId) {
            await prisma.notification.create({
                data: {
                    userId: updatedContent.authorId,
                    actorId: userId,
                    type: 'like',
                    message: `liked your post: "${updatedContent.title}"`,
                    metadata: { contentId: id }
                }
            });
        }

        res.status(201).json({ liked: true });
    } catch (error: any) {
        if (error.code === 'P2002') {
            res.status(400).json({ error: 'Already liked' });
            return;
        }
        console.error('Error liking content:', error);
        res.status(500).json({ error: 'Failed to like content' });
    }
};

// Unlike content
export const unlikeContent = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const id = getStringParam(req.params.id);
        const userId = req.user!.userId;

        await prisma.contentLike.delete({
            where: {
                contentId_userId: {
                    contentId: id,
                    userId
                }
            }
        });

        // Decrement likes count
        await prisma.content.update({
            where: { id },
            data: {
                likesCount: {
                    decrement: 1
                }
            }
        });

        res.status(204).send();
    } catch (error) {
        console.error('Error unliking content:', error);
        res.status(500).json({ error: 'Failed to unlike content' });
    }
};

// Bookmark content
export const bookmarkContent = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const id = getStringParam(req.params.id);
        const userId = req.user!.userId;

        await prisma.contentBookmark.create({
            data: {
                contentId: id,
                userId
            }
        });

        // Increment bookmarks count
        await prisma.content.update({
            where: { id },
            data: {
                bookmarksCount: {
                    increment: 1
                }
            }
        });

        res.status(201).json({ bookmarked: true });
    } catch (error: any) {
        if (error.code === 'P2002') {
            res.status(400).json({ error: 'Already bookmarked' });
            return;
        }
        console.error('Error bookmarking content:', error);
        res.status(500).json({ error: 'Failed to bookmark content' });
    }
};

// Remove bookmark
export const removeBookmark = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const id = getStringParam(req.params.id);
        const userId = req.user!.userId;

        await prisma.contentBookmark.delete({
            where: {
                contentId_userId: {
                    contentId: id,
                    userId
                }
            }
        });

        // Decrement bookmarks count
        await prisma.content.update({
            where: { id },
            data: {
                bookmarksCount: {
                    decrement: 1
                }
            }
        });

        res.status(204).send();
    } catch (error) {
        console.error('Error removing bookmark:', error);
        res.status(500).json({ error: 'Failed to remove bookmark' });
    }
};

// Get user's bookmarks
export const getUserBookmarks = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const userId = req.user!.userId;
        const limit = parseInt((typeof req.query.limit === 'string' ? req.query.limit : '20')) || 20;
        const offset = parseInt((typeof req.query.offset === 'string' ? req.query.offset : '0')) || 0;

        const bookmarks = await prisma.contentBookmark.findMany({
            where: { userId },
            take: limit,
            skip: offset,
            orderBy: { createdAt: 'desc' },
            include: {
                content: {
                    include: {
                        author: {
                            select: {
                                id: true,
                                username: true,
                                displayName: true,
                                profileImageUrl: true
                            }
                        },
                        _count: {
                            select: {
                                comments: true,
                                likes: true,
                                bookmarks: true
                            }
                        }
                    }
                }
            }
        });

        res.json(bookmarks.map((b: any) => b.content));
    } catch (error) {
        console.error('Error fetching bookmarks:', error);
        res.status(500).json({ error: 'Failed to fetch bookmarks' });
    }
};

// Moderate comment (admin/author only)
export const moderateComment = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const id = getStringParam(req.params.id); // commentId
        const { status } = req.body; // 'visible', 'hidden', 'flagged'
        const userId = req.user!.userId;

        if (!['visible', 'hidden', 'flagged'].includes(status)) {
            res.status(400).json({ error: 'Invalid status' });
            return;
        }

        // Check if user is authorized (admin or content author or comment author?)
        // For now, let's say only content author or comment author can hide (self-moderation)
        // Ideally we'd have an Admin role check.

        const comment = await prisma.contentComment.findUnique({
            where: { id },
            include: { content: true }
        });

        if (!comment) {
            res.status(404).json({ error: 'Comment not found' });
            return;
        }

        // Allow if user is comment author OR content author
        if (comment.authorId !== userId && comment.content.authorId !== userId) {
            res.status(403).json({ error: 'Unauthorized to moderate this comment' });
            return;
        }

        await prisma.contentComment.update({
            where: { id },
            data: { status }
        });

        res.json({ success: true, status });
    } catch (error) {
        console.error('Error moderating comment:', error);
        res.status(500).json({ error: 'Failed to moderate comment' });
    }
};

// Upload video file
export const uploadVideo = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No video file provided' });
        }

        const videoUrl = `/uploads/videos/${req.file.filename}`;

        res.json({
            videoUrl,
            filename: req.file.filename,
            size: req.file.size,
            mimetype: req.file.mimetype
        });
    } catch (error) {
        console.error('Error uploading video:', error);
        res.status(500).json({ error: 'Failed to upload video' });
    }
};
