import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { getAdminStats } from '../controllers/admin.controller';

const router = Router();

// Secure all admin routes
router.use(authenticate);
router.use(requireRole('app-admin', 'admin'));

router.get('/stats', getAdminStats);

export default router;
