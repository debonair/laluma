import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getGroups, createGroup, getGroup, joinGroup, getRecommendedGroups } from './groups.controller';
import prisma from '../utils/prisma';

const mockedPrisma = prisma as any;

describe('Groups Controller', () => {
    let mockReq: any;
    let mockRes: any;

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

    describe('getGroups', () => {
        it('fetches groups without location', async () => {
            mockedPrisma.group.findMany.mockResolvedValueOnce([
                { id: '1', name: 'Group 1', latitude: null, longitude: null, members: [] }
            ]);
            mockedPrisma.group.count.mockResolvedValueOnce(1);

            await getGroups(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith({
                groups: expect.arrayContaining([expect.objectContaining({ id: '1' })]),
                total: 1,
                has_more: false
            });
        });

        it('filters and sorts groups by geographic location', async () => {
            mockReq.query = { latitude: '40', longitude: '-74', radius: '10' };

            mockedPrisma.group.findMany.mockResolvedValueOnce([
                { id: 'g-far', name: 'Far Group', latitude: 41, longitude: -75, members: [] }, // ~140km away
                { id: 'g-near', name: 'Near Group', latitude: 40.01, longitude: -74.01, members: [] } // ~1km away
            ]);
            mockedPrisma.group.count.mockResolvedValueOnce(2);

            await getGroups(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                groups: [expect.objectContaining({ id: 'g-near' })], // Only near is returned
                total: 1 // Because filter reduces total returned
            }));
        });
    });

    describe('createGroup', () => {
        it('validates schema', async () => {
            mockReq.body = { name: '' };

            await createGroup(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                code: 'VALIDATION_ERROR'
            }));
        });

        it('creates an admin member upon group creation', async () => {
            mockReq.body = {
                name: 'New Moms',
                description: 'A group',
                city: 'Austin'
            };

            const createdGroup = { id: 'new-1', name: 'New Moms', memberCount: 1, createdAt: new Date() };
            mockedPrisma.group.create.mockResolvedValueOnce(createdGroup);

            await createGroup(mockReq, mockRes);

            expect(mockedPrisma.group.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    name: 'New Moms',
                    createdById: 'user-1',
                    members: {
                        create: { userId: 'user-1', role: 'admin' }
                    }
                })
            }));
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                id: 'new-1',
                name: 'New Moms',
                is_member: true
            }));
        });
    });

    describe('getGroup', () => {
        it('returns 404 if group is not found', async () => {
            mockReq.params.groupId = 'not-found';
            mockedPrisma.group.findUnique.mockResolvedValueOnce(null);

            await getGroup(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });

        it('returns group details and member status', async () => {
            mockReq.params.groupId = 'g-1';
            mockedPrisma.group.findUnique.mockResolvedValueOnce({
                id: 'g-1',
                name: 'G1',
                members: [{ userId: 'user-1' }], // User is a member
                createdBy: { id: 'user-1', username: 'john' }
            });

            await getGroup(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                id: 'g-1',
                is_member: true,
                created_by: expect.objectContaining({ username: 'john' })
            }));
        });
    });

    describe('joinGroup', () => {
        it('returns 409 if already a member', async () => {
            mockReq.params.groupId = 'g-1';
            mockedPrisma.group.findUnique.mockResolvedValueOnce({ id: 'g-1' });
            // Mock existing member
            mockedPrisma.groupMember.findUnique.mockResolvedValueOnce({ id: 'mem-1' });

            await joinGroup(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(409);
        });

        it('adds member in a transaction if not a member', async () => {
            mockReq.params.groupId = 'g-1';
            mockedPrisma.group.findUnique.mockResolvedValueOnce({ id: 'g-1' });
            mockedPrisma.groupMember.findUnique.mockResolvedValueOnce(null); // Not a member

            await joinGroup(mockReq, mockRes);

            expect(mockedPrisma.$transaction).toHaveBeenCalled();
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true
            }));
        });
    });

    describe('getRecommendedGroups', () => {
        it('returns 401 if user is not authenticated', async () => {
            mockReq.user = undefined;
            await getRecommendedGroups(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(401);
        });

        it('returns up to 3 recommended groups based on lifeStage and fallback', async () => {
            mockedPrisma.user.findUnique.mockResolvedValueOnce({
                lifeStage: 'new_mom',
                journeyContext: 'solo_by_choice'
            });

            // Mock 1 matched group
            mockedPrisma.group.findMany.mockResolvedValueOnce([
                { id: 'g-match-1', name: 'New Mom Group', memberCount: 10, members: [] }
            ]);

            // Mock 2 fallback groups to reach 3 total
            mockedPrisma.group.findMany.mockResolvedValueOnce([
                { id: 'g-fall-1', name: 'General Support', memberCount: 100, members: [] },
                { id: 'g-fall-2', name: 'Local Meetups', memberCount: 50, members: [] }
            ]);

            await getRecommendedGroups(mockReq, mockRes);

            // First query checks match
            expect(mockedPrisma.group.findMany).toHaveBeenNthCalledWith(1, expect.objectContaining({
                where: expect.objectContaining({
                    OR: [
                        { name: { contains: 'new mom', mode: 'insensitive' } },
                        { description: { contains: 'new mom', mode: 'insensitive' } }
                    ]
                })
            }));

            // Second query fetches fallbacks not in matched list
            expect(mockedPrisma.group.findMany).toHaveBeenNthCalledWith(2, expect.objectContaining({
                take: 2,
                where: expect.objectContaining({
                    id: { notIn: ['g-match-1'] }
                })
            }));

            expect(mockRes.json).toHaveBeenCalledWith({
                groups: [
                    expect.objectContaining({ id: 'g-match-1' }),
                    expect.objectContaining({ id: 'g-fall-1' }),
                    expect.objectContaining({ id: 'g-fall-2' })
                ]
            });
        });
    });
});
