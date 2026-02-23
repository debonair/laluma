import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import {
    createSubmission,
    getUserSubmissions,
    getAllSubmissions,
    approveSubmission,
    rejectSubmission
} from '../controllers/submissions.controller';

const router = Router();

// User routes
router.post('/', authenticate, createSubmission);
router.get('/mine', authenticate, getUserSubmissions);

// Admin routes
router.get('/', authenticate, requireRole('app-admin'), getAllSubmissions);
router.post('/:id/approve', authenticate, requireRole('app-admin'), approveSubmission);
router.post('/:id/reject', authenticate, requireRole('app-admin'), rejectSubmission);

export default router;
