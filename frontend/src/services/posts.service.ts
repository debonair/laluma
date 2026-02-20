import apiClient from './api';

export interface Post {
    id: string;
    group_id: string;
    author: {
        id: string;
        username: string;
        display_name?: string;
        profile_image_url?: string;
    } | null;
    content: string;
    likes_count: number;
    comments_count: number;
    is_liked: boolean;
    created_at: string;
}

export interface Comment {
    id: string;
    post_id: string;
    author: {
        id: string;
        username: string;
        display_name?: string;
        profile_image_url?: string;
    } | null;
    content: string;
    created_at: string;
}

export interface PostsResponse {
    posts: Post[];
    total: number;
    has_more: boolean;
}

export interface CommentsResponse {
    comments: Comment[];
    total: number;
    has_more: boolean;
}

export const postsService = {
    getGroupPosts: async (
        groupId: string,
        params?: { limit?: number; offset?: number }
    ): Promise<PostsResponse> => {
        const response = await apiClient.get<PostsResponse>(`/groups/${groupId}/posts`, { params });
        return response.data;
    },

    createPost: async (groupId: string, content: string): Promise<Post> => {
        const response = await apiClient.post<Post>(`/groups/${groupId}/posts`, { content });
        return response.data;
    },

    likePost: async (postId: string): Promise<{ success: boolean; likes_count: number }> => {
        const response = await apiClient.post(`/posts/${postId}/like`);
        return response.data;
    },

    unlikePost: async (postId: string): Promise<{ success: boolean; likes_count: number }> => {
        const response = await apiClient.delete(`/posts/${postId}/like`);
        return response.data;
    },

    getComments: async (
        postId: string,
        params?: { limit?: number; offset?: number }
    ): Promise<CommentsResponse> => {
        const response = await apiClient.get<CommentsResponse>(`/posts/${postId}/comments`, { params });
        return response.data;
    },

    createComment: async (postId: string, content: string): Promise<Comment> => {
        const response = await apiClient.post<Comment>(`/posts/${postId}/comments`, { content });
        return response.data;
    },
};
