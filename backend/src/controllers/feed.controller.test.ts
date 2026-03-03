import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getFeed } from './feed.controller';
import prisma from '../utils/prisma';

const mockedPrisma = prisma as any;

describe('Feed Controller', () => {
    let mockReq: any;
    let mockRes: any;

    const makeMockPost = (id: string, createdAt: Date) => ({
        id,
        content: `Post ${id}`,
        createdAt,
        likesCount: 0,
        commentsCount: 0,
        author: { id: 'user-1', username: 'author', displayName: 'Author', profileImageUrl: null },
        group: { id: 'g-1', name: 'Group 1', imageEmoji: '🌿' },
        likes: []
    });

    beforeEach(() => {
        mockReq = {
            query: {},
            params: {},
            body: {},
            user: { userId: 'user-1' }
        };
        mockRes = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn(),
            send: vi.fn()
        };
        vi.clearAllMocks();
    });

    it('returns empty feed when user has no joined groups', async () => {
        mockedPrisma.groupMember.findMany.mockResolvedValueOnce([]);

        await getFeed(mockReq, mockRes);

        expect(mockRes.json).toHaveBeenCalledWith({ posts: [], nextCursor: null, has_more: false });
    });

    it('returns posts from joined groups only, newest first', async () => {
        mockedPrisma.groupMember.findMany.mockResolvedValueOnce([
            { groupId: 'g-1' }, { groupId: 'g-2' }
        ]);

        const now = new Date();
        const p1 = makeMockPost('post-1', now);
        const p2 = makeMockPost('post-2', new Date(now.getTime() - 60000));
        mockedPrisma.post.findMany.mockResolvedValueOnce([p1, p2]);

        await getFeed(mockReq, mockRes);

        expect(mockedPrisma.post.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { groupId: { in: ['g-1', 'g-2'] } },
                orderBy: { createdAt: 'desc' }
            })
        );

        const result = mockRes.json.mock.calls[0][0];
        expect(result.posts).toHaveLength(2);
        expect(result.posts[0].id).toBe('post-1');
        expect(result.has_more).toBe(false);
        expect(result.next_cursor).toBeNull();
    });

    it('supports cursor-based pagination and returns next_cursor when more posts exist', async () => {
        mockReq.query = { limit: '2', cursor: 'post-0' };

        mockedPrisma.groupMember.findMany.mockResolvedValueOnce([{ groupId: 'g-1' }]);

        const now = new Date();
        // Return limit+1 (3 posts) to indicate has_more
        const posts = [
            makeMockPost('post-1', now),
            makeMockPost('post-2', new Date(now.getTime() - 1000)),
            makeMockPost('post-3', new Date(now.getTime() - 2000)) // extra
        ];
        mockedPrisma.post.findMany.mockResolvedValueOnce(posts);

        await getFeed(mockReq, mockRes);

        // Should have used cursor and skip:1
        expect(mockedPrisma.post.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                cursor: { id: 'post-0' },
                skip: 1,
                take: 3 // limit+1
            })
        );

        const result = mockRes.json.mock.calls[0][0];
        expect(result.posts).toHaveLength(2); // trimmed to limit
        expect(result.has_more).toBe(true);
        expect(result.next_cursor).toBe('post-2'); // last post in trimmed list
    });

    it('returns 500 on database error', async () => {
        mockedPrisma.groupMember.findMany.mockRejectedValueOnce(new Error('DB Error'));

        await getFeed(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(500);
    });
});
