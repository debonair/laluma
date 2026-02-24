import { Router } from 'express';
import { getListings, createListing, getListingReviews, addReview } from '../controllers/directory.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getListings);
router.post('/', authenticate, createListing);
router.get('/:id/reviews', authenticate, getListingReviews);
router.post('/:id/reviews', authenticate, addReview);

export default router;
