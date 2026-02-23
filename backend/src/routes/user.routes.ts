import { Router } from 'express';
import { getCurrentUser, updateCurrentUser, searchUsers, getPublicProfile, getNearbyUsers, uploadProfileImage } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth';
import { imageUpload } from '../middleware/upload';

const router = Router();

router.get('/me', authenticate, getCurrentUser);
router.patch('/me', authenticate, updateCurrentUser);
router.post('/me/avatar', authenticate, imageUpload.single('avatar'), uploadProfileImage);
router.get('/search', authenticate, searchUsers);
router.get('/nearby', authenticate, getNearbyUsers);
router.get('/:id', authenticate, getPublicProfile);

export default router;
