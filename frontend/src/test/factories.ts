import { Content } from '../types/content';
import { Group } from '../services/groups.service';
import { Poll } from '../services/posts.service';

/**
 * Factory for creating strongly typed Mock Content objects
 */
export const getMockContent = (overrides?: Partial<Content>): Content => {
    return {
        id: 'content-123',
        title: 'Mock Article Title',
        body: '<p>This is a complete mock body</p>',
        excerpt: 'Mock excerpt',
        category: 'Article',
        authorId: 'author-123',
        authorName: 'Mock Author',
        isPremium: false,
        viewCount: 10,
        likesCount: 5,
        commentsCount: 2,
        publishedAt: new Date().toISOString(),
        isAnonymous: false,
        ...overrides,
    };
};

/**
 * Factory for creating strongly typed Mock Group objects
 */
export const getMockGroup = (overrides?: Partial<Group>): Group => {
    return {
        id: 'group-123',
        name: 'Mock Group',
        description: 'A mock group for testing',
        image_emoji: '🧪',
        member_count: 5,
        is_member: true,
        created_at: new Date().toISOString(),
        ...overrides
    };
};

/**
 * Factory for creating strongly typed Mock Poll objects
 */
export const getMockPoll = (overrides?: Partial<Poll>): Poll => {
    return {
        id: 'poll-123',
        question: 'What is your favorite color?',
        options: [
            { id: 'opt-1', text: 'Red', votes: 5, percentage: 50 },
            { id: 'opt-2', text: 'Blue', votes: 5, percentage: 50 }
        ],
        totalVotes: 10,
        hasVoted: false,
        isActive: true,
        ...overrides
    };
};
