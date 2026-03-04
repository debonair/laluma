import { Response } from 'express';
import { prisma } from '../db';
import { getIO } from '../socket';
import { AuthRequest } from '../middleware/auth';
import { sendPushToUser } from '../services/pushNotification.service';

export const getConversations = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.userId;

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
};

export const getUnreadCount = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.userId;

        const unreadCount = await prisma.message.count({
            where: {
                conversation: {
                    participants: {
                        some: { userId }
                    }
                },
                senderId: { not: userId },
                isRead: false
            }
        });

        res.json({ unreadCount });
    } catch (error) {
        console.error('Error fetching unread count:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getMessages = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.userId;
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
};

export const initConversation = async (req: AuthRequest, res: Response) => {
    const resAny = res as any;
    try {
        const senderId = req.user!.userId;
        const { recipientId } = req.body;

        if (!recipientId) {
            return resAny.status(400).json({ error: 'Recipient ID is required' });
        }

        if (senderId === recipientId) {
            return resAny.status(400).json({ error: 'Cannot start a conversation with yourself' });
        }

        const isBlocked = await prisma.userBlock.findFirst({
            where: {
                OR: [
                    { blockerId: senderId, blockedId: recipientId },
                    { blockerId: recipientId, blockedId: senderId }
                ]
            }
        });

        if (isBlocked) {
            return resAny.status(403).json({ error: 'Cannot start conversation. User is blocked or has blocked you.' });
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
};

export const sendMessage = async (req: AuthRequest, res: Response) => {
    const resAny = res as any;
    try {
        const senderId = req.user!.userId;
        const { recipientId, content } = req.body;

        if (!recipientId || !content) {
            return resAny.status(400).json({ error: 'Recipient ID and content are required' });
        }

        const isBlocked = await prisma.userBlock.findFirst({
            where: {
                OR: [
                    { blockerId: senderId, blockedId: recipientId },
                    { blockerId: recipientId, blockedId: senderId }
                ]
            }
        });

        if (isBlocked) {
            return resAny.status(403).json({ error: 'Cannot send message. User is blocked or has blocked you.' });
        }

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

        await prisma.conversation.update({
            where: { id: conversation.id },
            data: { updatedAt: new Date() }
        });

        getIO().to(`user_${recipientId}`).emit('new_message', message);
        getIO().to(`user_${senderId}`).emit('new_message', message);

        // Push notification with deep-link so tapping opens the conversation
        const senderName = message.sender?.displayName ?? message.sender?.username ?? 'Someone';
        sendPushToUser(recipientId, {
            title: 'New message',
            body: `${senderName} sent you a message`,
            data: {
                deepLink: `luma://conversation/${conversation.id}`,
                conversationId: conversation.id,
                type: 'direct_message'
            }
        }).catch((err: Error) => console.error('[Push] sendMessage push failed:', err));

        res.json({ message });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const sendAttachmentMessage = async (req: AuthRequest, res: Response) => {
    const resAny = res as any;
    try {
        const senderId = req.user!.userId;
        const { recipientId, content } = req.body;
        const file = req.file;

        if (!recipientId) {
            return resAny.status(400).json({ error: 'Recipient ID is required' });
        }

        if (!file && !content) {
            return resAny.status(400).json({ error: 'Either content or an attachment is required' });
        }

        const isBlocked = await prisma.userBlock.findFirst({
            where: {
                OR: [
                    { blockerId: senderId, blockedId: recipientId },
                    { blockerId: recipientId, blockedId: senderId }
                ]
            }
        });

        if (isBlocked) {
            return resAny.status(403).json({ error: 'Cannot send message. User is blocked or has blocked you.' });
        }

        let attachmentUrl = null;
        let attachmentType = null;

        if (file) {
            attachmentUrl = `/uploads/images/${file.filename}`;
            attachmentType = file.mimetype.startsWith('image/') ? 'image' : 'file';
        }

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

        await prisma.conversation.update({
            where: { id: conversation.id },
            data: { updatedAt: new Date() }
        });

        getIO().to(`user_${recipientId}`).emit('new_message', message);
        getIO().to(`user_${senderId}`).emit('new_message', message);

        // Push notification with deep-link for attachment messages
        const senderName = message.sender?.displayName ?? message.sender?.username ?? 'Someone';
        sendPushToUser(recipientId, {
            title: 'New message',
            body: `${senderName} sent you an attachment`,
            data: {
                deepLink: `luma://conversation/${conversation.id}`,
                conversationId: conversation.id,
                type: 'direct_message'
            }
        }).catch((err: Error) => console.error('[Push] sendAttachmentMessage push failed:', err));

        res.json({ message });
    } catch (error) {
        console.error('Error sending attachment message:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const markAsRead = async (req: AuthRequest, res: Response) => {
    const resAny = res as any;
    try {
        const userId = req.user!.userId;
        const { conversationId } = req.body;

        if (!conversationId) {
            return resAny.status(400).json({ error: 'Conversation ID is required' });
        }

        await prisma.conversationParticipant.update({
            where: {
                conversationId_userId: {
                    conversationId,
                    userId
                }
            },
            data: { lastReadAt: new Date() }
        });

        await prisma.message.updateMany({
            where: {
                conversationId,
                senderId: { not: userId },
                isRead: false
            },
            data: { isRead: true }
        });

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
};
