import { Router } from 'express';
import * as brandPartnerController from '../controllers/brandPartnerController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

/**
 * @route POST /api/brand-partners/inquiry
 * @desc Submit a brand partnership inquiry (Public)
 * @access Public
 */
router.post('/inquiry', brandPartnerController.submitInquiry);

/**
 * @route GET /api/brand-partners/inquiries
 * @desc List all brand inquiries (Admin/Moderator)
 * @access Private
 */
router.get('/inquiries', authenticate, requireRole('admin', 'moderator'), brandPartnerController.getInquiries);

/**
 * @route PATCH /api/brand-partners/inquiries/:id/status
 * @desc Approve or reject a brand inquiry (Admin only)
 * @access Private
 */
router.patch('/inquiries/:id/status', authenticate, requireRole('admin'), brandPartnerController.updateInquiryStatus);

export default router;
