import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import prisma from '../utils/prisma';

export const requireSubscription = (requiredTier: 'premium' | 'premium_plus' = 'premium') => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
                return;
            }

            const subscription = await prisma.subscription.findUnique({
                where: { userId: req.user.userId }
            });

            if (!subscription || subscription.status !== 'active') {
                res.status(403).json({
                    error: 'Forbidden',
                    message: 'Active subscription required',
                    code: 'SUBSCRIPTION_REQUIRED'
                });
                return;
            }

            // Check tier hierarchy
            // premium_plus > premium > free
            if (requiredTier === 'premium_plus' && subscription.tier !== 'premium_plus') {
                res.status(403).json({
                    error: 'Forbidden',
                    message: 'Premium Plus subscription required',
                    code: 'PREMIUM_PLUS_REQUIRED'
                });
                return;
            }

            if (requiredTier === 'premium' && subscription.tier === 'free') {
                res.status(403).json({
                    error: 'Forbidden',
                    message: 'Premium subscription required',
                    code: 'PREMIUM_REQUIRED'
                });
                return;
            }

            next();
        } catch (error) {
            console.error('Subscription check error:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    };
};
