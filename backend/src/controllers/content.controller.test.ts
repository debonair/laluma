import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getContent, getDiscoverContent, getContentById, createContent } from './content.controller';
import prisma from '../utils/prisma';

// Type assertion for mocked prisma
const mockedPrisma = prisma as any;

describe('Content Controller', () => {
    let mockReq: any;
    let mockRes: any;

    beforeEach(() => {
        mockReq = {
            query: {},
            params: {},
            body: {},
            user: { userId: 'user-1', roles: ['user'] }
        };
        mockRes = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn(),
            send: vi.fn()
        };
        vi.clearAllMocks();
    });

    describe('getContent', () => {
        it('fetches content with proper pagination and access rights', async () => {
            const mockContent = [
                { id: '1', title: 'Content 1', isPremium: false, authorId: 'user-2', author: { id: 'user-2', username: 'john' } },
                { id: '2', title: 'Premium Content', isPremium: true, premiumTier: 'premium', authorId: 'user-3', author: { id: 'user-3', username: 'jane' } }
            ];

            mockedPrisma.content.findMany.mockResolvedValueOnce(mockContent);
            mockedPrisma.content.count.mockResolvedValueOnce(2);
            mockedPrisma.subscription.findUnique.mockResolvedValueOnce({ status: 'active', tier: 'premium' });

            await getContent(mockReq, mockRes);

            expect(mockedPrisma.content.findMany).toHaveBeenCalled();
            expect(mockRes.json).toHaveBeenCalledWith({
                content: [
                    { ...mockContent[0], hasAccess: true },
                    { ...mockContent[1], hasAccess: true } // Has access because user has premium tier
                ],
                pagination: {
                    total: 2,
                    limit: 20,
                    offset: 0,
                    hasMore: false
                }
            });
        });

        it('handles anonymous author scrubbing', async () => {
            const mockContent = [
                { id: 'anon-1', title: 'Anon', isPremium: false, isAnonymous: true, authorId: 'user-2', author: { id: 'user-2', username: 'real-name' } }
            ];

            mockedPrisma.content.findMany.mockResolvedValueOnce(mockContent);
            mockedPrisma.content.count.mockResolvedValueOnce(1);
            mockedPrisma.subscription.findUnique.mockResolvedValueOnce(null);

            await getContent(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                content: expect.arrayContaining([
                    expect.objectContaining({
                        title: 'Anon',
                        author: expect.objectContaining({ id: 'anonymous', username: 'anonymous' })
                    })
                ])
            }));
        });
    });

    describe('getDiscoverContent', () => {
        it('fetches promotions and nearby events', async () => {
            mockReq.query = { latitude: '40', longitude: '-74', radius: '10' };

            const mockPromotions = [{ id: 'promo-1', title: 'Promo 1' }];
            const mockEvents = [
                { id: 'event-1', title: 'Near Event', latitude: 40.01, longitude: -74.01 }, // ~1km away
                { id: 'event-2', title: 'Far Event', latitude: 41, longitude: -75 }       // ~140km away
            ];

            mockedPrisma.content.findMany
                .mockResolvedValueOnce(mockPromotions)
                .mockResolvedValueOnce(mockEvents);

            await getDiscoverContent(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith({
                promotions: mockPromotions,
                events: [mockEvents[0]] // Only the near event is included
            });
        });
    });

    describe('getContentById', () => {
        it('returns 404 if content not found', async () => {
            mockReq.params.id = 'not-found';
            mockedPrisma.content.findUnique.mockResolvedValueOnce(null);

            await getContentById(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Content not found' });
        });

        it('returns full content and interaction status if accessed', async () => {
            mockReq.params.id = 'content-1';
            const mockContent = { id: 'content-1', title: 'Test', isPremium: false, body: 'Full body' };

            mockedPrisma.content.findUnique.mockResolvedValueOnce(mockContent);
            mockedPrisma.contentLike.findUnique.mockResolvedValueOnce({ id: 'like-1' });
            mockedPrisma.contentBookmark.findUnique.mockResolvedValueOnce(null);

            await getContentById(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                id: 'content-1',
                body: 'Full body',
                hasAccess: true,
                userInteractions: { liked: true, bookmarked: false }
            }));
        });

        it('scrubs body content if user lacks premium access', async () => {
            mockReq.params.id = 'content-1';
            const mockContent = { id: 'content-1', title: 'Test', isPremium: true, premiumTier: 'premium', body: 'Secret body', videoUrl: 'http://vid' };

            mockedPrisma.content.findUnique.mockResolvedValueOnce(mockContent);
            mockedPrisma.subscription.findUnique.mockResolvedValueOnce(null); // No subscription
            mockedPrisma.contentLike.findUnique.mockResolvedValueOnce(null);
            mockedPrisma.contentBookmark.findUnique.mockResolvedValueOnce(null);

            await getContentById(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                id: 'content-1',
                title: 'Test',
                body: '',
                videoUrl: null,
                hasAccess: false
            }));
        });
    });

    describe('createContent', () => {
        it('validates input schema', async () => {
            mockReq.body = { title: '' }; // Invalid title

            await createContent(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                error: 'Invalid input'
            }));
        });

        it('creates content successfully', async () => {
            mockReq.body = {
                title: 'New Post',
                category: 'General',
                contentType: 'article',
                status: 'draft'
            };

            const createdContent = { id: 'new-1', title: 'New Post' };
            mockedPrisma.content.create.mockResolvedValueOnce(createdContent);

            await createContent(mockReq, mockRes);

            expect(mockedPrisma.content.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    title: 'New Post',
                    authorId: 'user-1'
                })
            }));
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith(createdContent);
        });
    });
});
