import { Router } from 'express';
import { subscribe, cancelSubscription, getSubscriptionStatus } from '../controllers/subscription.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/subscribe', authenticate, subscribe);
router.post('/cancel', authenticate, cancelSubscription);
router.get('/status', authenticate, getSubscriptionStatus);

export default router;
