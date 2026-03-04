import { Router } from 'express';
import { authenticate, optionalAuthenticate, requireRole } from '../middleware/auth';
import {
    createGuidelines,
    updateGuidelines,
    getAllGuidelines,
    getCurrentGuidelines,
    getGuidelinesById,
} from '../controllers/communityGuidelines.controller';

const router = Router();

// Public route - get current guidelines (no auth required)
router.get('/current', optionalAuthenticate, getCurrentGuidelines);

// Protected route - get specific version (auth required for admin review)
router.get('/:id', authenticate, getGuidelinesById);

export default router;
