import { Router } from 'express';
import { getItems, createItem, updateItemStatus, deleteItem } from '../controllers/marketplace.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getItems);
router.post('/', authenticate, createItem);
router.patch('/:id/status', authenticate, updateItemStatus);
router.delete('/:id', authenticate, deleteItem);

export default router;
