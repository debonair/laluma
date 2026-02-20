import express from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { prisma } from '../db';
import { io } from '../index';

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

        // Mark messages as read
        await prisma.message.updateMany({
            where: {
                conversationId,
                senderId: { not: userId },
                isRead: false
            },
            data: { isRead: true }
        });

        res.json({ messages });
    } catch (error) {
        console.error('Error fetching messages:', error);
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
        io.to(`user_${recipientId}`).emit('new_message', message);
        // Also emit to the sender to confirm local delivery across devices
        io.to(`user_${senderId}`).emit('new_message', message);

        res.json({ message });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
