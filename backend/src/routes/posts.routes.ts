import { Router } from 'express';
import {
    likePost,
    unlikePost,
    getPostComments,
    createComment
} from '../controllers/posts.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/:postId/like', authenticate, likePost);
router.delete('/:postId/like', authenticate, unlikePost);
router.get('/:postId/comments', authenticate, getPostComments);
router.post('/:postId/comments', authenticate, createComment);

export default router;
