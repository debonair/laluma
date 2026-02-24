import apiClient from './api';

export interface PollOption {
    id: string;
    text: string;
    votes: number;
    percentage: number;
}

export interface Poll {
    id: string;
    question: string;
    totalVotes: number;
    hasVoted: boolean;
    userVoteOptionId: string | null;
    options: PollOption[];
}

export interface Post {
    id: string;
    group_id: string;
    author: {
        id: string;
        username: string;
        display_name?: string;
        profile_image_url?: string;
        isVerified?: boolean;
    } | null;
    content: string;
    likes_count: number;
    comments_count: number;
    is_liked: boolean;
    created_at: string;
    is_anonymous?: boolean;
    poll?: Poll;
}

export interface Comment {
    id: string;
    post_id: string;
    author: {
        id: string;
        username: string;
        display_name?: string;
        profile_image_url?: string;
        isVerified?: boolean;
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

    createPost: async (groupId: string, data: { content: string; isAnonymous?: boolean; poll?: { question: string, options: string[] } }): Promise<Post> => {
        const response = await apiClient.post<Post>(`/groups/${groupId}/posts`, data);
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

    deletePost: async (postId: string): Promise<{ success: boolean }> => {
        const response = await apiClient.delete(`/posts/${postId}`);
        return response.data;
    }
};
