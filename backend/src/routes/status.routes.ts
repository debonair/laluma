import { Router } from 'express';
import { getStatus, setStatus } from '../controllers/status.controller';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// Public endpoint to fetch current status
router.get('/', getStatus);

// Admin-only endpoint to publish/clear status
router.post('/', authenticate, requireRole('admin', 'app-admin'), setStatus);

export default router;
