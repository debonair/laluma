import { Router } from 'express';
import { getCurrentUser, updateCurrentUser, searchUsers, getPublicProfile } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/me', authenticate, getCurrentUser);
router.patch('/me', authenticate, updateCurrentUser);
router.get('/search', authenticate, searchUsers);
router.get('/:id', authenticate, getPublicProfile);

export default router;
