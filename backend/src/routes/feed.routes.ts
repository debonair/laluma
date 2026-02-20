import { Router } from 'express';
import { getActivityFeed } from '../controllers/feed.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getActivityFeed);

export default router;
