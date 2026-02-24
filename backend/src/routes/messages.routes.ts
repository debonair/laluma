import express from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { imageUpload, videoUpload } from '../middleware/upload';
import { prisma } from '../db';
import { getIO } from '../socket';
import path from 'path';

const router = express.Router();

// Get list of conversations for current user
router.get('/conversations', authenticate, async (req: express.Request, res: express.Response) => {
    const authReq = req as AuthRequest;
    try {
        const userId = authReq.user!.userId;

        const conversations = await prisma.conversation.findMany({
            where: {
                participants: {
                    some: { userId }
                }
            },
            include: {
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                                displayName: true,
                                profileImageUrl: true
                            }
                        }
                    }
                },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            },
            orderBy: {
                updatedAt: 'desc'
            }
        });

        res.json({ conversations });
    } catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get messages for a specific conversation
router.get('/conversations/:id', authenticate, async (req: express.Request, res: express.Response) => {
    const authReq = req as AuthRequest;
    try {
        const userId = authReq.user!.userId;
        const conversationId = req.params.id as string;

        // Verify user is part of conversation
        const isParticipant = await prisma.conversationParticipant.findUnique({
            where: {
                conversationId_userId: {
                    conversationId,
                    userId
                }
            }
        });

        const resAny = res as any;
        if (!isParticipant) {
            return resAny.status(403).json({ error: 'Not authorized to view this conversation' });
        }

        const messages = await prisma.message.findMany({
            where: { conversationId },
            include: {
                sender: {
                    select: {
                        id: true,
                        username: true,
                        displayName: true
                    }
                }
            },
            orderBy: { createdAt: 'asc' }
        });

        const conversationParticipants = await prisma.conversationParticipant.findMany({
            where: { conversationId },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        displayName: true,
                        profileImageUrl: true
                    }
                }
            }
        });

        // Get the recipient (the other participant in the conversation)
        const recipient = conversationParticipants
            .map(p => p.user)
            .find(u => u.id !== userId);

        // Mark messages as read
        await prisma.message.updateMany({
            where: {
                conversationId,
                senderId: { not: userId },
                isRead: false
            },
            data: { isRead: true }
        });

        res.json({ messages, recipient });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Initialize or find a conversation with a specific user
router.post('/init', authenticate, async (req: express.Request, res: express.Response) => {
    const authReq = req as AuthRequest;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resAny = res as any;
    try {
        const senderId = authReq.user!.userId;
        const { recipientId } = req.body;

        if (!recipientId) {
            return resAny.status(400).json({ error: 'Recipient ID is required' });
        }

        if (senderId === recipientId) {
            return resAny.status(400).json({ error: 'Cannot start a conversation with yourself' });
        }

        // Find existing conversation
        let conversation = await prisma.conversation.findFirst({
            where: {
                AND: [
                    { participants: { some: { userId: senderId } } },
                    { participants: { some: { userId: recipientId } } }
                ]
            }
        });

        // Create new if none exists
        if (!conversation) {
            conversation = await prisma.conversation.create({
                data: {
                    participants: {
                        create: [
                            { userId: senderId },
                            { userId: recipientId }
                        ]
                    }
                }
            });
        }

        res.json({ conversationId: conversation.id });
    } catch (error) {
        console.error('Error initializing conversation:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Send a direct message
router.post('/send', authenticate, async (req: express.Request, res: express.Response) => {
    const authReq = req as AuthRequest;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resAny = res as any;
    try {
        const senderId = authReq.user!.userId;
        const { recipientId, content } = req.body;

        if (!recipientId || !content) {
            return resAny.status(400).json({ error: 'Recipient ID and content are required' });
        }

        // Find existing conversation or create new one
        let conversation = await prisma.conversation.findFirst({
            where: {
                AND: [
                    { participants: { some: { userId: senderId } } },
                    { participants: { some: { userId: recipientId } } }
                ]
            }
        });

        if (!conversation) {
            conversation = await prisma.conversation.create({
                data: {
                    participants: {
                        create: [
                            { userId: senderId },
                            { userId: recipientId }
                        ]
                    }
                }
            });
        }

        // Create the message
        const message = await prisma.message.create({
            data: {
                content,
                senderId,
                conversationId: conversation.id
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        username: true,
                        displayName: true
                    }
                }
            }
        });

        // Update conversation timestamp
        await prisma.conversation.update({
            where: { id: conversation.id },
            data: { updatedAt: new Date() }
        });

        // Emit socket event to the recipient's private room
        getIO().to(`user_${recipientId}`).emit('new_message', message);
        // Also emit to the sender to confirm local delivery across devices
        getIO().to(`user_${senderId}`).emit('new_message', message);

        res.json({ message });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Middleware to handle both image and video uploads for attachments
const attachmentUpload = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    // We'll try image first, if that fails with MulterError we could try video,
    // but a unified generic upload is simpler if we want to allow any file.
    // For now, let's use the existing imageUpload and adapt it loosely or strictly to images.
    imageUpload.single('attachment')(req, res, (err) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        next();
    });
};

// Send a message with an attachment
router.post('/send/attachment', authenticate, attachmentUpload, async (req: express.Request, res: express.Response) => {
    const authReq = req as AuthRequest;
    const resAny = res as any;
    try {
        const senderId = authReq.user!.userId;
        const { recipientId, content } = req.body;
        const file = req.file;

        if (!recipientId) {
            return resAny.status(400).json({ error: 'Recipient ID is required' });
        }

        if (!file && !content) {
            return resAny.status(400).json({ error: 'Either content or an attachment is required' });
        }

        let attachmentUrl = null;
        let attachmentType = null;

        if (file) {
            attachmentUrl = `/uploads/images/${file.filename}`;
            attachmentType = file.mimetype.startsWith('image/') ? 'image' : 'file';
        }

        // Find existing conversation or create new one
        let conversation = await prisma.conversation.findFirst({
            where: {
                AND: [
                    { participants: { some: { userId: senderId } } },
                    { participants: { some: { userId: recipientId } } }
                ]
            }
        });

        if (!conversation) {
            conversation = await prisma.conversation.create({
                data: {
                    participants: {
                        create: [
                            { userId: senderId },
                            { userId: recipientId }
                        ]
                    }
                }
            });
        }

        // Create the message
        const message = await prisma.message.create({
            data: {
                content: content || '',
                senderId,
                conversationId: conversation.id,
                attachmentUrl,
                attachmentType
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        username: true,
                        displayName: true
                    }
                }
            }
        });

        // Update conversation timestamp
        await prisma.conversation.update({
            where: { id: conversation.id },
            data: { updatedAt: new Date() }
        });

        // Emit socket events
        getIO().to(`user_${recipientId}`).emit('new_message', message);
        getIO().to(`user_${senderId}`).emit('new_message', message);

        res.json({ message });
    } catch (error) {
        console.error('Error sending attachment message:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Mark conversation as read
router.post('/read', authenticate, async (req: express.Request, res: express.Response) => {
    const authReq = req as AuthRequest;
    const resAny = res as any;
    try {
        const userId = authReq.user!.userId;
        const { conversationId } = req.body;

        if (!conversationId) {
            return resAny.status(400).json({ error: 'Conversation ID is required' });
        }

        // Update participant's lastReadAt
        await prisma.conversationParticipant.update({
            where: {
                conversationId_userId: {
                    conversationId,
                    userId
                }
            },
            data: { lastReadAt: new Date() }
        });

        // Mark unread messages sent by OTHERS in this conversation as read
        await prisma.message.updateMany({
            where: {
                conversationId,
                senderId: { not: userId },
                isRead: false
            },
            data: { isRead: true }
        });

        // Find the other participant to notify them
        const participants = await prisma.conversationParticipant.findMany({
            where: { conversationId }
        });

        const otherParticipant = participants.find(p => p.userId !== userId);

        if (otherParticipant) {
            getIO().to(`user_${otherParticipant.userId}`).emit('messages_read', { conversationId, readBy: userId, timestamp: new Date() });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error marking conversation as read:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
