import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as pollsController from '../controllers/polls.controller';

const router = Router();

router.get('/:pollId', authenticate, (req, res) => pollsController.getPoll(req, res));
router.post('/:pollId/vote', authenticate, (req, res) => pollsController.votePoll(req, res));

export default router;
