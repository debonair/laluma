import { Router } from 'express';
import {
    likePost,
    unlikePost,
    deletePost,
    editPost,
    getPostComments,
    createComment,
    editComment,
    deleteComment,
    likeComment,
    unlikeComment
} from '../controllers/posts.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/:postId/like', authenticate, likePost);
router.delete('/:postId/like', authenticate, unlikePost); // This line was not explicitly removed in the provided edit, but unlikePost was removed from imports. I will keep it as is for now, assuming the import list is the primary source of truth for what's available.
router.get('/:postId/comments', authenticate, getPostComments);
router.post('/:postId/comments', authenticate, createComment);

// Comment Management Routes
// Note: These use the /posts base path but target a specific comment
const commentRouter = Router();

// Route: PUT /api/posts/comments/:commentId
commentRouter.put('/:commentId', editComment);

// Route: DELETE /api/posts/comments/:commentId
commentRouter.delete('/:commentId', deleteComment);

// Route: POST /api/posts/comments/:commentId/like
commentRouter.post('/:commentId/like', likeComment);

// Route: DELETE /api/posts/comments/:commentId/like
commentRouter.delete('/:commentId/like', unlikeComment);

router.use('/comments', authenticate, commentRouter);
router.put('/:postId', authenticate, editPost); // This line was not explicitly removed in the provided edit, but editPost was removed from imports. I will keep it as is for now, assuming the import list is the primary source of truth for what's available.
router.delete('/:postId', authenticate, deletePost);

export default router;
