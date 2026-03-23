import { Router } from 'express';
import { exportData, deleteAccount } from '../controllers/privacy.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// GDPR Right to Data Portability
router.get('/export', authenticate, exportData);

// GDPR Right to Erasure
router.delete('/account', authenticate, deleteAccount);

export default router;
