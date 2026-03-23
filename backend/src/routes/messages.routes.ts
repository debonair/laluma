import express from 'express';
import { authenticate } from '../middleware/auth';
import { imageUpload } from '../middleware/upload';
import {
    getConversations,
    getUnreadCount,
    getMessages,
    initConversation,
    sendMessage,
    sendAttachmentMessage,
    markAsRead,
    getPotentialParticipants
} from '../controllers/messages.controller';

const router = express.Router();

router.get('/conversations', authenticate, getConversations as any);
router.get('/unread-count', authenticate, getUnreadCount as any);
router.get('/potential-participants', authenticate, getPotentialParticipants as any);
router.get('/conversations/:id', authenticate, getMessages as any);
router.post('/init', authenticate, initConversation as any);
router.post('/send', authenticate, sendMessage as any);

const attachmentUpload = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    imageUpload.single('attachment')(req, res, (err) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        next();
    });
};

router.post('/send/attachment', authenticate, attachmentUpload, sendAttachmentMessage as any);
router.post('/read', authenticate, markAsRead as any);

export default router;
