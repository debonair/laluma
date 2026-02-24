import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getPoll, votePoll } from '../controllers/polls.controller';

const router = Router();

router.get('/:pollId', authenticate, getPoll);
router.post('/:pollId/vote', authenticate, votePoll);

export default router;
