import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getPoll, votePoll } from './polls.controller';
import prisma from '../utils/prisma';

vi.mock('../socket', () => ({
    getIO: vi.fn().mockReturnValue({ emit: vi.fn() })
}));

const mockedPrisma = prisma as any;

describe('Polls Controller', () => {
    let mockReq: any;
    let mockRes: any;

    beforeEach(() => {
        mockReq = {
            params: {},
            body: {},
            user: { userId: 'user-1' }
        };
        mockRes = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn()
        };
        vi.clearAllMocks();
    });

    describe('getPoll', () => {
        it('returns poll with aggregated data', async () => {
            mockReq.params.pollId = '550e8400-e29b-41d4-a716-446655440000';
            mockedPrisma.poll.findUnique.mockResolvedValue({
                id: '550e8400-e29b-41d4-a716-446655440000',
                question: 'Test?',
                votes: [{ optionId: '550e8400-e29b-41d4-a716-446655440001' }],
                options: [
                    { id: '550e8400-e29b-41d4-a716-446655440001', text: 'Yes', _count: { votes: 10 } },
                    { id: '550e8400-e29b-41d4-a716-446655440002', text: 'No', _count: { votes: 5 } }
                ]
            });

            await getPoll(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                id: '550e8400-e29b-41d4-a716-446655440000',
                question: 'Test?',
                totalVotes: 15,
                hasVoted: true,
                userVoteOptionId: '550e8400-e29b-41d4-a716-446655440001',
                options: expect.arrayContaining([
                    expect.objectContaining({ id: '550e8400-e29b-41d4-a716-446655440001', votes: 10, percentage: 67 }),
                    expect.objectContaining({ id: '550e8400-e29b-41d4-a716-446655440002', votes: 5, percentage: 33 })
                ])
            }));
        });
    });

    describe('votePoll', () => {
        it('upserts vote and returns success', async () => {
            const pollId = '550e8400-e29b-41d4-a716-446655440000';
            const optionId = '550e8400-e29b-41d4-a716-446655440001';
            mockReq.params.pollId = pollId;
            mockReq.body = { optionId };

            // Mock the poll lookup first
            mockedPrisma.poll.findUnique.mockResolvedValue({
                id: pollId,
                options: [{ id: optionId }, { id: '550e8400-e29b-41d4-a716-446655440002' }]
            });

            await votePoll(mockReq, mockRes);

            expect(mockedPrisma.pollVote.upsert).toHaveBeenCalledWith({
                where: { pollId_userId: { pollId, userId: 'user-1' } },
                update: { optionId },
                create: { pollId, userId: 'user-1', optionId }
            });
            expect(mockRes.json).toHaveBeenCalledWith({ success: true, message: 'Vote recorded' });
        });
    });
});
