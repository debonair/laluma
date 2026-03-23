import { Router } from 'express';
import * as brandContentController from '../controllers/brandContentController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// Secure all editorial routes
router.use(authenticate);
router.use(requireRole('admin', 'editorial'));

/**
 * @route GET /api/editorial/queue
 * @desc Get the list of all brand content pending review
 */
router.get('/queue', brandContentController.getEditorialQueue);

/**
 * @route PATCH /api/editorial/content/:id/review
 * @desc Review a brand content submission (Approve/Reject/Revision)
 */
router.patch('/content/:id/review', brandContentController.reviewContent);

export default router;
