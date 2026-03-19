/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import { groupsService, type Group } from '../services/groups.service';
import { postsService, type Post, type Comment } from '../services/posts.service';
import { feedService, type FeedPost } from '../services/feed.service';
import { handleAPIError } from '../services/api';

interface GroupContextType {
    groups: Group[];
    userGroups: Group[];
    feed: FeedPost[];
    isLoading: boolean;
    error: string | null;
    joinGroup: (groupId: string) => Promise<void>;
    leaveGroup: (groupId: string) => Promise<void>;
    createGroup: (name: string, description: string, emoji?: string, location?: { latitude?: number; longitude?: number; city?: string; country?: string; is_private?: boolean }) => Promise<void>;
    createPost: (groupId: string, data: { content: string; isAnonymous?: boolean; poll?: { question: string, options: string[] } }) => Promise<void>;
    addComment: (postId: string, content: string) => Promise<void>;
    likePost: (postId: string, reactionType?: string) => Promise<void>;
    unlikePost: (postId: string) => Promise<void>;
    getGroup: (groupId: string) => Promise<Group | null>;
    getGroupPosts: (groupId: string) => Promise<Post[]>;
    getPostComments: (postId: string) => Promise<Comment[]>;
    refreshGroups: (params?: { filter?: 'all' | 'my-groups' | 'discover', search?: string, limit?: number, offset?: number, latitude?: number, longitude?: number, radius?: number, city?: string, country?: string }) => Promise<void>;
    refreshFeed: () => Promise<void>;
    updatePollInFeed: (postId: string, updatedPoll: any) => void;
    clearError: () => void;
}

const GroupContext = createContext<GroupContextType | undefined>(undefined);

export const GroupProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const { socket } = useSocket();
    const [groups, setGroups] = useState<Group[]>([]);
    const [userGroups, setUserGroups] = useState<Group[]>([]);
    const [feed, setFeed] = useState<FeedPost[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch all groups
    const refreshGroups = useCallback(async (params?: {
        filter?: 'all' | 'my-groups' | 'discover';
        search?: string;
        limit?: number;
        offset?: number;
        latitude?: number;
        longitude?: number;
        radius?: number;
        city?: string;
        country?: string;
    }) => {
        if (!isAuthenticated) return;

        try {
            setError(null);
            setIsLoading(true);
            const mergedParams = { limit: 100, ...params };
            const response = await groupsService.getGroups(mergedParams);
            setGroups(response.groups);
        } catch (err) {
            const errorMessage = handleAPIError(err);
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated]);

    // Fetch user's groups
    const refreshUserGroups = useCallback(async () => {
        if (!isAuthenticated) return;

        try {
            const response = await groupsService.getGroups({ filter: 'my-groups', limit: 100 });
            setUserGroups(response.groups);
        } catch (err) {
            console.error('Error fetching user groups:', err);
        }
    }, [isAuthenticated]);

    // Fetch activity feed
    const refreshFeed = useCallback(async () => {
        if (!isAuthenticated) return;

        try {
            const response = await feedService.getActivityFeed({ limit: 50 });
            setFeed(response.posts);
        } catch (err) {
            console.error('Error fetching feed:', err);
        }
    }, [isAuthenticated]);

    // Initial data load
    useEffect(() => {
        if (isAuthenticated) {
            refreshGroups();
            refreshUserGroups();
            refreshFeed();
        }
    }, [isAuthenticated, refreshGroups, refreshUserGroups, refreshFeed]);

    // WebSocket Real-time Feed Updates
    useEffect(() => {
        if (!socket) return;

        const handleFeedUpdated = () => {
            console.log('Real-time feed update received, refreshing...');
            refreshFeed();
        };

        socket.on('feed_updated', handleFeedUpdated);

        return () => {
            socket.off('feed_updated', handleFeedUpdated);
        };
    }, [socket, refreshFeed]);

    const joinGroup = async (groupId: string) => {
        try {
            setError(null);
            await groupsService.joinGroup(groupId);
            // Refresh groups and user groups
            await Promise.all([refreshGroups(), refreshUserGroups(), refreshFeed()]);
        } catch (err) {
            const errorMessage = handleAPIError(err);
            setError(errorMessage);
            throw new Error(errorMessage);
        }
    };

    const leaveGroup = async (groupId: string) => {
        try {
            setError(null);
            await groupsService.leaveGroup(groupId);
            // Refresh groups and user groups
            await Promise.all([refreshGroups(), refreshUserGroups(), refreshFeed()]);
        } catch (err) {
            const errorMessage = handleAPIError(err);
            setError(errorMessage);
            throw new Error(errorMessage);
        }
    };

    const createGroup = async (name: string, description: string, emoji?: string, location?: { latitude?: number; longitude?: number; city?: string; country?: string; is_private?: boolean }) => {
        try {
            setError(null);
            setIsLoading(true);
            await groupsService.createGroup({
                name,
                description,
                image_emoji: emoji || '✨',
                latitude: location?.latitude,
                longitude: location?.longitude,
                city: location?.city,
                country: location?.country,
                is_private: location?.is_private,
            });
            // Refresh groups and user groups
            await Promise.all([refreshGroups(), refreshUserGroups()]);
        } catch (err) {
            const errorMessage = handleAPIError(err);
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const createPost = async (groupId: string, data: { content: string; isAnonymous?: boolean; poll?: { question: string, options: string[] } }) => {
        try {
            setError(null);
            await postsService.createPost(groupId, data);
            // Refresh feed
            await refreshFeed();
        } catch (err) {
            const errorMessage = handleAPIError(err);
            setError(errorMessage);
            throw new Error(errorMessage);
        }
    };

    const addComment = async (postId: string, content: string) => {
        try {
            setError(null);
            await postsService.createComment(postId, content);
            // Optionally refresh feed to update comment counts
            await refreshFeed();
        } catch (err) {
            const errorMessage = handleAPIError(err);
            setError(errorMessage);
            throw new Error(errorMessage);
        }
    };

    const likePost = async (postId: string, reactionType: string = 'like') => {
        try {
            setError(null);
            await postsService.likePost(postId, reactionType);
            // Update feed locally to reflect like
            setFeed(prev => prev.map(post =>
                post.id === postId
                    ? { ...post, is_liked: true, likes_count: (post.likes_count || 0) + 1, user_reaction_type: reactionType }
                    : post
            ));
        } catch (err) {
            const errorMessage = handleAPIError(err);
            setError(errorMessage);
            throw new Error(errorMessage);
        }
    };

    const unlikePost = async (postId: string) => {
        try {
            setError(null);
            await postsService.unlikePost(postId);
            // Update feed locally to reflect unlike
            setFeed(prev => prev.map(post =>
                post.id === postId
                    ? { ...post, is_liked: false, likes_count: post.likes_count - 1 }
                    : post
            ));
        } catch (err) {
            const errorMessage = handleAPIError(err);
            setError(errorMessage);
            throw new Error(errorMessage);
        }
    };

    const getGroup = async (groupId: string): Promise<Group | null> => {
        try {
            setError(null);
            const group = await groupsService.getGroup(groupId);
            return group;
        } catch (err) {
            const errorMessage = handleAPIError(err);
            setError(errorMessage);
            return null;
        }
    };

    const getGroupPosts = async (groupId: string): Promise<Post[]> => {
        try {
            setError(null);
            const response = await postsService.getGroupPosts(groupId, { limit: 100 });
            return response.posts;
        } catch (err) {
            const errorMessage = handleAPIError(err);
            setError(errorMessage);
            return [];
        }
    };

    const getPostComments = async (postId: string): Promise<Comment[]> => {
        try {
            setError(null);
            const response = await postsService.getComments(postId, { limit: 100 });
            return response.comments;
        } catch (err) {
            const errorMessage = handleAPIError(err);
            setError(errorMessage);
            return [];
        }
    };

    const clearError = () => setError(null);

    const updatePollInFeed = useCallback((postId: string, updatedPoll: any) => {
        setFeed(prev => prev.map(post =>
            post.id === postId
                ? { ...post, poll: updatedPoll }
                : post
        ));
    }, []);

    return (
        <GroupContext.Provider value={{
            groups,
            userGroups,
            feed,
            isLoading,
            error,
            joinGroup,
            leaveGroup,
            createGroup,
            createPost,
            addComment,
            likePost,
            unlikePost,
            getGroup,
            getGroupPosts,
            getPostComments,
            refreshGroups,
            refreshFeed,
            updatePollInFeed,
            clearError
        }}>
            {children}
        </GroupContext.Provider>
    );
};

export const useGroup = () => {
    const context = useContext(GroupContext);
    if (context === undefined) {
        throw new Error('useGroup must be used within a GroupProvider');
    }
    return context;
};
