import { Router } from 'express';
import { authenticate, optionalAuthenticate, requireRole } from '../middleware/auth';
import { videoUpload } from '../middleware/upload';
import {
    getContent,
    getDiscoverContent,
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
router.get('/discover', optionalAuthenticate, getDiscoverContent);
router.get('/bookmarks', authenticate, getUserBookmarks);
router.get('/:id', optionalAuthenticate, getContentById);
router.get('/:id/comments', getComments);

// Protected routes (require authentication)
router.post('/:id/view', incrementViewCount);
router.post('/:id/comments', authenticate, addComment);
router.post('/:id/like', authenticate, likeContent);
router.delete('/:id/like', authenticate, unlikeContent);
router.post('/:id/bookmark', authenticate, bookmarkContent);
router.delete('/:id/bookmark', authenticate, removeBookmark);

// Admin routes (require app-admin role)
router.put('/comments/:id/moderate', authenticate, requireRole('app-admin'), moderateComment);
router.post('/', authenticate, requireRole('app-admin'), createContent);
router.put('/:id', authenticate, requireRole('app-admin'), updateContent);
router.delete('/:id', authenticate, requireRole('app-admin'), deleteContent);
router.post('/upload-video', authenticate, requireRole('app-admin'), videoUpload.single('video'), uploadVideo);

export default router;
