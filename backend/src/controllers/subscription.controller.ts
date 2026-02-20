import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const subscribeSchema = z.object({
    tier: z.enum(['free', 'premium', 'premium_plus']),
    period: z.enum(['monthly', 'yearly']).optional()
});

export const subscribe = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const validatedData = subscribeSchema.parse(req.body);

        // In a real app, this would integrate with Stripe.
        // For now, we'll just mock the subscription update.

        const subscription = await prisma.subscription.upsert({
            where: { userId },
            update: {
                tier: validatedData.tier,
                status: 'active',
                currentPeriodStart: new Date(),
                currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 days
                cancelAtPeriodEnd: false
            },
            create: {
                userId,
                tier: validatedData.tier,
                status: 'active',
                currentPeriodStart: new Date(),
                currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            }
        });

        res.json(subscription);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Invalid input', details: error.errors });
            return;
        }
        console.error('Error subscribing:', error);
        res.status(500).json({ error: 'Failed to subscribe' });
    }
};

export const cancelSubscription = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        // Mock cancellation: set cancelAtPeriodEnd to true
        const subscription = await prisma.subscription.update({
            where: { userId },
            data: {
                cancelAtPeriodEnd: true,
                // In reality, status might stay 'active' until period end
            }
        });

        res.json(subscription);
    } catch (error) {
        console.error('Error canceling subscription:', error);
        res.status(500).json({ error: 'Failed to cancel subscription' });
    }
};

export const getSubscriptionStatus = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const subscription = await prisma.subscription.findUnique({
            where: { userId }
        });

        if (!subscription) {
            // Return a default free object if no record exists
            res.json({
                tier: 'free',
                status: 'active',
                userId
            });
            return;
        }

        res.json(subscription);
    } catch (error) {
        console.error('Error getting subscription status:', error);
        res.status(500).json({ error: 'Failed to get subscription status' });
    }
};
