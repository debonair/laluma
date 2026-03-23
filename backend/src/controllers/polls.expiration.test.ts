import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getPoll, votePoll } from './polls.controller';
import prisma from '../utils/prisma';

vi.mock('../utils/prisma', () => ({
    default: {
        poll: {
            findUnique: vi.fn(),
        },
        pollVote: {
            upsert: vi.fn(),
        },
    },
}));

vi.mock('../socket', () => ({
    getIO: vi.fn(() => ({
        emit: vi.fn()
    }))
}));

describe('Poll Expiration', () => {
    let mockReq: any;
    let mockRes: any;

    beforeEach(() => {
        mockReq = {
            params: { pollId: 'poll-123' },
            body: {},
            user: { userId: 'user-123' }
        };
        mockRes = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn(),
        };
        vi.clearAllMocks();
    });

    it('getPoll identifies expired poll', async () => {
        const pastDate = new Date();
        pastDate.setMinutes(pastDate.getMinutes() - 5);

        (prisma.poll.findUnique as any).mockResolvedValue({
            id: 'poll-123',
            question: 'Expired?',
            expiresAt: pastDate,
            options: [],
            votes: []
        });

        await getPoll(mockReq, mockRes);

        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
            isExpired: true
        }));
    });

    it('getPoll identifies active poll', async () => {
        const futureDate = new Date();
        futureDate.setHours(futureDate.getHours() + 1);

        (prisma.poll.findUnique as any).mockResolvedValue({
            id: 'poll-123',
            question: 'Active?',
            expiresAt: futureDate,
            options: [],
            votes: []
        });

        await getPoll(mockReq, mockRes);

        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
            isExpired: false
        }));
    });

    it('votePoll rejects voting on expired poll', async () => {
        const pastDate = new Date();
        pastDate.setMinutes(pastDate.getMinutes() - 5);

        (prisma.poll.findUnique as any).mockResolvedValue({
            id: 'poll-123',
            expiresAt: pastDate,
            options: [{ id: '550e8400-e29b-41d4-a716-446655440000' }] // Use a UUID-like ID for zod validation if needed, though schema is uuid
        });
        
        mockReq.body = { optionId: '550e8400-e29b-41d4-a716-446655440000' };

        await votePoll(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
            code: 'POLL_EXPIRED'
        }));
    });

    it('votePoll allows voting on active poll', async () => {
        const futureDate = new Date();
        futureDate.setHours(futureDate.getHours() + 1);
        const optionId = '550e8400-e29b-41d4-a716-446655440000';

        (prisma.poll.findUnique as any).mockResolvedValue({
            id: 'poll-123',
            expiresAt: futureDate,
            options: [{ id: optionId }]
        });
        
        mockReq.body = { optionId };

        await votePoll(mockReq, mockRes);

        expect(mockRes.status).not.toHaveBeenCalledWith(400);
        expect(prisma.pollVote.upsert).toHaveBeenCalled();
    });
});
