import { Router } from 'express';
import { getUploadUrl } from '../controllers/media.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Endpoint for authenticated users to get secure upload URL
router.post('/upload-url', authenticate, getUploadUrl);

export default router;
