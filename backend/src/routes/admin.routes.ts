import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { getAdminStats, getUsers, updateUserRole, updateUserStatus } from '../controllers/admin.controller';
import { createGuidelines, updateGuidelines, getAllGuidelines } from '../controllers/communityGuidelines.controller';

const router = Router();

// Secure all admin routes
router.use(authenticate);
router.use(requireRole('app-admin', 'admin'));

router.get('/stats', getAdminStats);
router.get('/users', getUsers);
router.patch('/users/:id/role', updateUserRole);
router.patch('/users/:id/status', updateUserStatus);

// Community Guidelines routes
router.post('/community-guidelines', createGuidelines);
router.put('/community-guidelines/:id', updateGuidelines);
router.get('/community-guidelines', getAllGuidelines);

export default router;
