import { Router } from 'express';
import * as brandPartnerController from '../controllers/brandPartnerController';
import * as brandPartnerProfileController from '../controllers/brandPartnerProfileController';
import * as brandContentController from '../controllers/brandContentController';
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

/**
 * @route GET /api/brand-partners/profile
 * @desc Get current partner's profile
 * @access Private (Brand Partner)
 */
router.get('/profile', authenticate, requireRole('brand_partner'), brandPartnerProfileController.getMyProfile);

/**
 * @route PATCH /api/brand-partners/profile
 * @desc Update current partner's profile
 * @access Private (Brand Partner)
 */
router.patch('/profile', authenticate, requireRole('brand_partner'), brandPartnerProfileController.updateMyProfile);

/**
 * @route GET /api/brand-partners/profiles/:id
 * @desc Get public partner profile by ID
 * @access Public
 */
router.get('/profiles/:id', brandPartnerProfileController.getPublicProfile);

/**
 * @route POST /api/brand-partners/content
 * @desc Save a content draft
 */
router.post('/content', authenticate, requireRole('brand_partner'), brandContentController.saveDraft);

/**
 * @route POST /api/brand-partners/content/:id
 * @desc Update a content draft
 */
router.post('/content/:id', authenticate, requireRole('brand_partner'), brandContentController.saveDraft);

/**
 * @route POST /api/brand-partners/content/:id/submit
 * @desc Submit content for editorial review
 */
router.post('/content/:id/submit', authenticate, requireRole('brand_partner'), brandContentController.submitForReview);

/**
 * @route GET /api/brand-partners/content
 * @desc Get all content submissions for the current partner
 */
router.get('/content', authenticate, requireRole('brand_partner'), brandContentController.getMyContent);

/**
 * @route GET /api/brand-partners/quota
 * @desc Get the submission quota for the current partner
 */
router.get('/quota', authenticate, requireRole('brand_partner'), brandContentController.getQuota);

/**
 * @route GET /api/brand-partners/analytics
 * @desc Get performance analytics for the current partner
 */
router.get('/analytics', authenticate, requireRole('brand_partner'), brandContentController.getAnalytics);

export default router;
