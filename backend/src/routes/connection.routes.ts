import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getConnections, sendConnectionRequest, respondToConnectionRequest } from '../controllers/connection.controller';

const router = Router();

// All connection routes require authentication
router.use(authenticate);

// Get all connections (pending, accepted)
router.get('/', getConnections);

// Send a wave / connection request
router.post('/request', sendConnectionRequest);

// Accept or decline a connection request
router.put('/:id/respond', respondToConnectionRequest);

export default router;
