import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPost } from './posts.controller';
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

        it('creates post and emits new_post event to group socket room', async () => {
            // User is a member
            mockedPrisma.groupMember.findUnique.mockResolvedValueOnce({ role: 'member' });

            const now = new Date();
            mockedPrisma.post.create.mockResolvedValueOnce({
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
    });
});
