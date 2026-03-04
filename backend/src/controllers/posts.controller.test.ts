import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPost, editPost, deletePost, createComment, editComment, deleteComment, likePost, likeComment, unlikeComment } from './posts.controller';
import prisma from '../utils/prisma';

// Mock the socket module so getIO() is controllable in tests
vi.mock('../socket', () => {
    const mockEmit = vi.fn();
    const mockTo = vi.fn().mockReturnValue({ emit: mockEmit });
    return {
        getIO: vi.fn().mockReturnValue({ to: mockTo, emit: mockEmit }),
        __mockTo: mockTo,
        __mockEmit: mockEmit
    };
});

// Mock BullMQ so tests don't try to connect to Redis
vi.mock('../lib/bullmq', () => {
    return {
        moderationQueue: {
            add: vi.fn().mockResolvedValue({})
        }
    };
});

const mockedPrisma = prisma as any;

describe('Posts Controller', () => {
    let mockReq: any;
    let mockRes: any;

    beforeEach(() => {
        mockReq = {
            params: { groupId: 'g-1' },
            body: { content: 'Hello world' },
            user: { userId: 'user-1' }
        };
        mockRes = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn(),
            send: vi.fn()
        };
        vi.clearAllMocks();
    });

    describe('createPost', () => {
        it('returns 400 on invalid input', async () => {
            mockReq.body = { content: '' };

            await createPost(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
        });

        it('returns 403 if user is not a group member', async () => {
            mockedPrisma.groupMember.findUnique.mockResolvedValueOnce(null);

            await createPost(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(403);
        });

        it('returns 400 when post content contains blocked keywords', async () => {
            // "scam" is one of the default blocked words in the service
            mockReq.body = { content: 'this is a scam post' };
            mockedPrisma.groupMember.findUnique.mockResolvedValueOnce({ role: 'member' });

            await createPost(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                code: 'CONTENT_BLOCKED',
                message: 'Content contains restricted keywords.'
            }));
        });

        it('creates post and emits new_post event to group socket room', async () => {
            // User is a member
            mockedPrisma.groupMember.findUnique.mockResolvedValueOnce({ role: 'member' });

            const now = new Date();
            // Simulate the transaction callback logic for non-anonymous
            mockedPrisma.$transaction.mockImplementationOnce(async (cb: any) => {
                const txMock = {
                    post: {
                        create: vi.fn().mockResolvedValue({
                            id: 'post-1',
                            groupId: 'g-1',
                            content: 'Hello world',
                            mediaUrls: ['https://example.com/image.png'],
                            isAnonymous: false,
                            likesCount: 0,
                            commentsCount: 0,
                            createdAt: now,
                            author: { id: 'user-1', username: 'testuser', displayName: 'Test User', profileImageUrl: null },
                            poll: null
                        })
                    }
                };
                return await cb(txMock);
            });

            await createPost(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(201);

            // Assert the socket was targeted to the group room
            const { getIO } = await import('../socket');
            const io = getIO();
            expect(io.to).toHaveBeenCalledWith('group_g-1');
            const room = (io.to as any)('group_g-1');
            expect(room.emit).toHaveBeenCalledWith('new_post', expect.objectContaining({
                id: 'post-1',
                group_id: 'g-1',
                content: 'Hello world',
                media_urls: ['https://example.com/image.png']
            }));
        });

        it('creates an anonymous post and obfuscates output payload', async () => {
            // User is a member
            mockedPrisma.groupMember.findUnique.mockResolvedValueOnce({ role: 'member' });

            const now = new Date();

            // Simulate the transaction callback logic by directly injecting the "tx" behavior
            type TxCallback = (tx: any) => Promise<any>;
            mockedPrisma.$transaction.mockImplementationOnce(async (cb: TxCallback) => {
                // mock the internal tx functions used within createPost inside the transaction
                const txMock = {
                    post: {
                        create: vi.fn().mockResolvedValue({
                            id: 'post-anon',
                            groupId: 'g-1',
                            content: 'Secret hello',
                            mediaUrls: [],
                            isAnonymous: true,
                            identityLinkId: 'post-anon',
                            likesCount: 0,
                            commentsCount: 0,
                            createdAt: now,
                            author: null,
                            poll: null
                        }),
                        update: vi.fn().mockResolvedValue({})
                    },
                    anonymousPostLink: {
                        create: vi.fn().mockResolvedValue({})
                    }
                };
                return await cb(txMock);
            });

            mockReq.body.isAnonymous = true;
            mockReq.body.content = 'Secret hello';

            await createPost(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(201);

            // Verify payload stripped real info and supplied dummy/anonymous attributes
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                id: 'post-anon',
                is_anonymous: true,
                author: expect.objectContaining({
                    id: 'anonymous',
                    username: 'anonymous',
                    display_name: expect.any(String), // e.g. "Crimson Tiger"
                    profile_image_url: expect.stringContaining('api.dicebear.com')
                })
            }));

            // Socket emit check
            const { getIO } = await import('../socket');
            const io = getIO();
            const room = (io.to as any)('group_g-1');
            expect(room.emit).toHaveBeenCalledWith('new_post', expect.objectContaining({
                id: 'post-anon',
                is_anonymous: true,
                author: expect.objectContaining({ id: 'anonymous' })
            }));
        });
    });

    describe('editPost', () => {
        it('returns 400 on invalid input', async () => {
            mockReq.body = { content: '' };
            await editPost(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(400);
        });

        it('returns 404 if post not found or soft deleted', async () => {
            mockReq.params.postId = 'post-1';
            mockedPrisma.post.findUnique.mockResolvedValueOnce(null);
            await editPost(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(404);
        });

        it('returns 403 if user is not author', async () => {
            mockReq.params.postId = 'post-1';
            mockedPrisma.post.findUnique.mockResolvedValueOnce({ id: 'post-1', authorId: 'user-2', deletedAt: null });
            await editPost(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(403);
        });

        it('updates post if user is author', async () => {
            mockReq.params.postId = 'post-1';
            mockReq.body = { content: 'updated content' };
            const now = new Date();

            mockedPrisma.post.findUnique.mockResolvedValueOnce({ id: 'post-1', authorId: 'user-1', deletedAt: null });
            mockedPrisma.post.update.mockResolvedValueOnce({
                id: 'post-1',
                groupId: 'g-1',
                authorId: 'user-1',
                content: 'updated content',
                createdAt: now,
                updatedAt: now,
                deletedAt: null,
                mediaUrls: [],
                isAnonymous: false,
                likesCount: 0,
                commentsCount: 0,
                author: { id: 'user-1', username: 'test', displayName: 'Test', profileImageUrl: null }
            });

            await editPost(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                content: 'updated content'
            }));

            const { getIO } = await import('../socket');
            expect(getIO().to).toHaveBeenCalledWith('group_g-1');
            const room = (getIO().to as any)('group_g-1');
            expect(room.emit).toHaveBeenCalledWith('post_updated', expect.objectContaining({
                id: 'post-1',
                content: 'updated content'
            }));
        });
    });

    describe('deletePost', () => {
        it('soft deletes post and notifies clients', async () => {
            mockReq.params.postId = 'post-1';
            mockReq.user = { userId: 'user-1' };

            mockedPrisma.post.findUnique.mockResolvedValueOnce({
                id: 'post-1',
                authorId: 'user-1',
                groupId: 'g-1'
            });

            await deletePost(mockReq, mockRes);

            expect(mockedPrisma.post.update).toHaveBeenCalledWith({
                where: { id: 'post-1' },
                data: { deletedAt: expect.any(Date) }
            });

            const { getIO } = await import('../socket');
            expect(getIO().emit).toHaveBeenCalledWith('feed_updated');
            expect(mockRes.json).toHaveBeenCalledWith({ success: true, message: 'Post deleted successfully' });
        });
    });
    describe('createComment', () => {
        it('returns 404 if post not found', async () => {
            mockReq.params.postId = 'post-1';
            mockReq.body = { content: 'test comment' };
            mockedPrisma.post.findUnique.mockResolvedValueOnce(null);

            await createComment(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(404);
        });

        it('returns 400 when comment content contains blocked keywords', async () => {
            mockReq.params.postId = 'post-1';
            mockReq.body = { content: 'this is abuse' }; // "abuse" is blocked

            mockedPrisma.post.findUnique.mockResolvedValueOnce({ id: 'post-1' });

            await createComment(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                code: 'CONTENT_BLOCKED',
                message: 'Content contains restricted keywords.'
            }));
        });

        it('creates comment and increments post commentsCount', async () => {
            mockReq.params.postId = 'post-1';
            mockReq.body = { content: 'test comment' };

            mockedPrisma.post.findUnique.mockResolvedValueOnce({ id: 'post-1' });

            const commentMock = {
                id: 'comment-1',
                postId: 'post-1',
                authorId: 'user-1',
                content: 'test comment',
                mediaUrls: [],
                isAnonymous: false,
                createdAt: new Date(),
                author: { id: 'user-1', username: 'test', displayName: 'Test', profileImageUrl: null }
            };

            mockedPrisma.$transaction.mockResolvedValueOnce([commentMock, {}]);

            await createComment(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                content: 'test comment',
                post_id: 'post-1'
            }));
        });
    });

    describe('editComment', () => {
        it('returns 403 if user is not author', async () => {
            mockReq.params.commentId = 'comment-1';
            mockedPrisma.comment.findUnique.mockResolvedValueOnce({ id: 'comment-1', authorId: 'user-2', deletedAt: null });
            await editComment(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(403);
        });

        it('updates comment if user is author', async () => {
            mockReq.params.commentId = 'comment-1';
            mockReq.body = { content: 'updated comment' };
            const now = new Date();

            mockedPrisma.comment.findUnique.mockResolvedValueOnce({ id: 'comment-1', authorId: 'user-1', deletedAt: null });
            mockedPrisma.comment.update.mockResolvedValueOnce({
                id: 'comment-1',
                postId: 'post-1',
                authorId: 'user-1',
                content: 'updated comment',
                createdAt: now,
                updatedAt: now,
                deletedAt: null,
                mediaUrls: [],
                isAnonymous: false
            });

            await editComment(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                content: 'updated comment'
            }));
        });
    });

    describe('deleteComment', () => {
        it('soft deletes comment and decrements post count', async () => {
            mockReq.params.commentId = 'comment-1';
            mockReq.user = { userId: 'user-1' };

            mockedPrisma.comment.findUnique.mockResolvedValueOnce({
                id: 'comment-1',
                authorId: 'user-1',
                postId: 'post-1',
                deletedAt: null,
                post: { groupId: 'g-1' }
            });

            await deleteComment(mockReq, mockRes);

            expect(mockedPrisma.$transaction).toHaveBeenCalled();
            expect(mockRes.json).toHaveBeenCalledWith({ success: true, message: 'Comment deleted successfully' });
        });
    });

    describe('likePost', () => {
        it('returns 404 if post not found', async () => {
            mockReq.params.postId = 'post-1';
            mockedPrisma.post.findUnique.mockResolvedValueOnce(null);

            await likePost(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(404);
        });

        it('creates a new post like with default reactionType if none exists', async () => {
            mockReq.params.postId = 'post-1';
            mockReq.user = { userId: 'user-1' };

            mockedPrisma.post.findUnique.mockResolvedValueOnce({ id: 'post-1', deletedAt: null });
            mockedPrisma.postLike.findUnique.mockResolvedValueOnce(null);

            mockedPrisma.post.findUnique.mockResolvedValueOnce({ id: 'post-1', likesCount: 1 });

            await likePost(mockReq, mockRes);

            expect(mockedPrisma.$transaction).toHaveBeenCalled();
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                likes_count: 1
            }));
        });

        it('updates an existing post like reactionType if different', async () => {
            mockReq.params.postId = 'post-1';
            mockReq.user = { userId: 'user-1' };
            mockReq.body = { reactionType: 'heart' };

            mockedPrisma.post.findUnique.mockResolvedValueOnce({ id: 'post-1', deletedAt: null });
            mockedPrisma.postLike.findUnique.mockResolvedValueOnce({ id: 'like-1', reactionType: 'like' });

            mockedPrisma.post.findUnique.mockResolvedValueOnce({ id: 'post-1', likesCount: 1 });

            await likePost(mockReq, mockRes);

            expect(mockedPrisma.postLike.update).toHaveBeenCalledWith({
                where: { id: 'like-1' },
                data: { reactionType: 'heart' }
            });
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                likes_count: 1
            }));
        });
    });

    describe('likeComment', () => {
        it('returns 404 if comment not found', async () => {
            mockReq.params.commentId = 'comment-1';
            mockedPrisma.comment.findUnique.mockResolvedValueOnce(null);

            await likeComment(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(404);
        });

        it('creates a new comment like', async () => {
            mockReq.params.commentId = 'comment-1';
            mockReq.user = { userId: 'user-1' };

            mockedPrisma.comment.findUnique.mockResolvedValueOnce({ id: 'comment-1', deletedAt: null });
            mockedPrisma.commentLike.findUnique.mockResolvedValueOnce(null);

            mockedPrisma.comment.findUnique.mockResolvedValueOnce({ id: 'comment-1', likesCount: 1 });

            await likeComment(mockReq, mockRes);

            expect(mockedPrisma.$transaction).toHaveBeenCalled();
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                likes_count: 1
            }));
        });
    });

    describe('unlikeComment', () => {
        it('soft deletes comment like and decrements count', async () => {
            mockReq.params.commentId = 'comment-1';
            mockReq.user = { userId: 'user-1' };

            mockedPrisma.comment.findUnique.mockResolvedValueOnce({ id: 'comment-1', deletedAt: null });
            mockedPrisma.comment.findUnique.mockResolvedValueOnce({ id: 'comment-1', likesCount: 0 });

            await unlikeComment(mockReq, mockRes);

            expect(mockedPrisma.$transaction).toHaveBeenCalled();
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                likes_count: 0
            }));
        });
    });
});
