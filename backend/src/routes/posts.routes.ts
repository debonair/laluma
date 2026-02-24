import { Router } from 'express';
import {
    likePost,
    unlikePost,
    getPostComments,
    createComment,
    deletePost
} from '../controllers/posts.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/:postId/like', authenticate, likePost);
router.delete('/:postId/like', authenticate, unlikePost);
router.get('/:postId/comments', authenticate, getPostComments);
router.post('/:postId/comments', authenticate, createComment);
router.delete('/:postId', authenticate, deletePost);

export default router;
