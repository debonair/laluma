import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import prisma from '../utils/prisma';
import { getIO } from '../socket';

const voteSchema = z.object({
    optionId: z.string().uuid()
});

export const getPoll = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const pollId = req.params.pollId as string;

        const poll = await prisma.poll.findUnique({
            where: { id: pollId },
            include: {
                options: {
                    include: {
                        _count: {
                            select: { votes: true }
                        }
                    },
                    orderBy: { order: 'asc' }
                },
                votes: {
                    where: { userId: req.user?.userId || 'unknown' }
                }
            }
        });

        if (!poll) {
            res.status(404).json({
                error: 'Not Found',
                message: 'Poll not found',
                code: 'POLL_NOT_FOUND'
            });
            return;
        }

        // Calculate total votes
        const options = (poll as any).options;
        const totalVotes = options.reduce((sum: number, opt: any) => sum + opt._count.votes, 0);

        const response = {
            id: poll.id,
            postId: poll.postId,
            contentId: poll.contentId,
            question: poll.question,
            totalVotes,
            hasVoted: req.user ? (poll as any).votes.length > 0 : false,
            userVoteOptionId: req.user && (poll as any).votes.length > 0 ? (poll as any).votes[0].optionId : null,
            options: options.map((opt: any) => ({
                id: opt.id,
                text: opt.text,
                votes: opt._count.votes,
                percentage: totalVotes > 0 ? Math.round((opt._count.votes / totalVotes) * 100) : 0
            }))
        };

        res.json(response);
    } catch (error) {
        console.error('Get poll error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'An error occurred',
            code: 'INTERNAL_ERROR'
        });
    }
};

export const votePoll = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const pollId = req.params.pollId as string;
        const data = voteSchema.parse(req.body);
        const userId = req.user!.userId;

        // Check if poll exists
        const poll = await prisma.poll.findUnique({
            where: { id: pollId },
            include: { options: true }
        });

        if (!poll) {
            res.status(404).json({ error: 'Not Found', message: 'Poll not found', code: 'POLL_NOT_FOUND' });
            return;
        }

        // Verify option belongs to poll
        const options = (poll as any).options;
        if (!options.some((opt: any) => opt.id === data.optionId)) {
            res.status(400).json({ error: 'Bad Request', message: 'Invalid option for this poll', code: 'INVALID_OPTION' });
            return;
        }

        // Check if already voted
        const existingVote = await prisma.pollVote.findUnique({
            where: {
                pollId_userId: { pollId, userId }
            }
        });

        if (existingVote) {
            res.status(400).json({ error: 'Bad Request', message: 'You have already voted', code: 'ALREADY_VOTED' });
            return;
        }

        await prisma.pollVote.create({
            data: {
                pollId,
                userId,
                optionId: data.optionId
            }
        });

        res.json({ success: true });

        // Optionally notify socket that feed/poll updated
        getIO().emit('feed_updated');

    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Validation Error', message: 'Invalid data', details: error.errors });
            return;
        }
        console.error('Vote poll error:', error);
        res.status(500).json({ error: 'Internal Error' });
    }
};
