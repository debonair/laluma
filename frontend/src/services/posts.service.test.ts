import { describe, it, expect, vi, beforeEach } from 'vitest';
import { postsService } from './posts.service';
import apiClient from './api';

vi.mock('./api', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
        delete: vi.fn(),
    }
}));

describe('Posts Service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('getGroupPosts fetches posts for a specific group', async () => {
        const mockData = { posts: [], total: 0 };
        vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockData });

        const params = { limit: 10 };
        const result = await postsService.getGroupPosts('g1', params);

        expect(apiClient.get).toHaveBeenCalledWith('/groups/g1/posts', { params });
        expect(result).toEqual(mockData);
    });

    it('createPost posts new post data', async () => {
        const mockPost = { id: 'p1', content: 'hello' };
        vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockPost });

        const payload = { content: 'hello', isAnonymous: true };
        const result = await postsService.createPost('g1', payload);

        expect(apiClient.post).toHaveBeenCalledWith('/groups/g1/posts', payload);
        expect(result).toEqual(mockPost);
    });

    it('likePost posts to the like endpoint', async () => {
        vi.mocked(apiClient.post).mockResolvedValueOnce({ data: { success: true, likes_count: 1 } });
        await postsService.likePost('p1');
        expect(apiClient.post).toHaveBeenCalledWith('/posts/p1/like');
    });

    it('unlikePost deletes to the like endpoint', async () => {
        vi.mocked(apiClient.delete).mockResolvedValueOnce({ data: { success: true, likes_count: 0 } });
        await postsService.unlikePost('p1');
        expect(apiClient.delete).toHaveBeenCalledWith('/posts/p1/like');
    });

    it('getComments fetches comments for a specific post', async () => {
        const mockData = { comments: [], total: 0 };
        vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockData });

        const params = { limit: 5 };
        const result = await postsService.getComments('p1', params);

        expect(apiClient.get).toHaveBeenCalledWith('/posts/p1/comments', { params });
        expect(result).toEqual(mockData);
    });

    it('createComment posts new comment data', async () => {
        const mockComment = { id: 'c1', content: 'test comment' };
        vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockComment });

        const result = await postsService.createComment('p1', 'test comment');

        expect(apiClient.post).toHaveBeenCalledWith('/posts/p1/comments', { content: 'test comment' });
        expect(result).toEqual(mockComment);
    });
});
