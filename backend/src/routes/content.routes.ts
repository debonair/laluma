import { Router } from 'express';
import { authenticate, optionalAuthenticate } from '../middleware/auth';
import { videoUpload } from '../middleware/upload';
import {
    getContent,
    getContentById,
    createContent,
    updateContent,
    deleteContent,
    incrementViewCount,
    addComment,
    getComments,
    likeContent,
    unlikeContent,
    bookmarkContent,
    removeBookmark,
    getUserBookmarks,
    uploadVideo,
    moderateComment
} from '../controllers/content.controller';

const router = Router();

// Public routes (no auth required for reading)
router.get('/', optionalAuthenticate, getContent);
router.get('/bookmarks', authenticate, getUserBookmarks);
router.get('/:id', optionalAuthenticate, getContentById);
router.get('/:id/comments', getComments);

// Protected routes (require authentication)
router.put('/comments/:id/moderate', authenticate, moderateComment);
router.post('/:id/view', incrementViewCount);
router.post('/:id/comments', authenticate, addComment);
router.post('/:id/like', authenticate, likeContent);
router.delete('/:id/like', authenticate, unlikeContent);
router.post('/:id/bookmark', authenticate, bookmarkContent);
router.delete('/:id/bookmark', authenticate, removeBookmark);

// Admin routes (require authentication - add admin middleware later)
router.post('/', authenticate, createContent);
router.put('/:id', authenticate, updateContent);
router.delete('/:id', authenticate, deleteContent);
router.post('/upload-video', authenticate, videoUpload.single('video'), uploadVideo);

export default router;
