import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { getAdminStats, getUsers, updateUserRole, updateUserStatus } from '../controllers/admin.controller';

const router = Router();

// Secure all admin routes
router.use(authenticate);
router.use(requireRole('app-admin', 'admin'));

router.get('/stats', getAdminStats);
router.get('/users', getUsers);
router.patch('/users/:id/role', updateUserRole);
router.patch('/users/:id/status', updateUserStatus);

export default router;
