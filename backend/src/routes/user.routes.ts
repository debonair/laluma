import { Router } from 'express';
import { getCurrentUser, updateCurrentUser, searchUsers, getPublicProfile, getNearbyUsers, uploadProfileImage, verifyUser, updateOnboardingContext, blockUser, unblockUser } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth';
import { imageUpload } from '../middleware/upload';

const router = Router();

router.get('/me', authenticate, getCurrentUser);
router.patch('/me', authenticate, updateCurrentUser);
router.put('/me/onboarding', authenticate, updateOnboardingContext);
router.post('/me/avatar', authenticate, imageUpload.single('avatar'), uploadProfileImage);
router.post('/me/verify', authenticate, verifyUser);
router.get('/search', authenticate, searchUsers);
router.get('/nearby', authenticate, getNearbyUsers);
router.get('/:id', authenticate, getPublicProfile);
router.post('/:id/block', authenticate, blockUser);
router.delete('/:id/block', authenticate, unblockUser);
export default router;
