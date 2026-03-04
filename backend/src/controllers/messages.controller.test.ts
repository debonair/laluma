import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getConversations, sendMessage, markAsRead } from './messages.controller';
import { prisma } from '../db';
import { getIO } from '../socket';

vi.mock('../db', () => ({
    prisma: {
        conversation: {
            findMany: vi.fn(),
            findFirst: vi.fn(),
            create: vi.fn(),
            update: vi.fn()
        },
        conversationParticipant: {
            findUnique: vi.fn(),
            findMany: vi.fn(),
            update: vi.fn()
        },
        message: {
            count: vi.fn(),
            findMany: vi.fn(),
            create: vi.fn(),
            updateMany: vi.fn()
        },
        userBlock: {
            findFirst: vi.fn(),
            findMany: vi.fn()
        }
    }
}));

vi.mock('../socket', () => {
    const mockEmit = vi.fn();
    const mockTo = vi.fn().mockReturnValue({ emit: mockEmit });
    return {
        getIO: vi.fn().mockReturnValue({ to: mockTo, emit: mockEmit }),
        __mockTo: mockTo,
        __mockEmit: mockEmit
    };
});

// Mock push service so we can assert it was called correctly
vi.mock('../services/pushNotification.service', () => ({
    sendPushToUser: vi.fn().mockResolvedValue(undefined)
}));

import { sendPushToUser } from '../services/pushNotification.service';

describe('Messages Controller', () => {
    let mockReq: any;
    let mockRes: any;

    beforeEach(() => {
        mockReq = {
            user: { userId: 'user-1' },
            body: {},
            params: {},
            query: {}
        };
        mockRes = {
            json: vi.fn(),
            status: vi.fn().mockReturnThis()
        };
        (prisma.userBlock.findFirst as any).mockResolvedValue(null);
        (prisma.userBlock.findMany as any).mockResolvedValue([]);
        vi.clearAllMocks();
    });

    it('getConversations fetches properly', async () => {
        (prisma.conversation.findMany as any).mockResolvedValue([{ id: 'conv-1' }]);

        await getConversations(mockReq, mockRes);
        expect(prisma.conversation.findMany).toHaveBeenCalled();
        expect(mockRes.json).toHaveBeenCalledWith({ conversations: [{ id: 'conv-1' }] });
    });

    it('sendMessage creates message and emits socket event', async () => {
        mockReq.body = { recipientId: 'user-2', content: 'hello' };

        (prisma.conversation.findFirst as any).mockResolvedValue({ id: 'conv-1' });
        (prisma.message.create as any).mockResolvedValue({
            id: 'msg-1',
            content: 'hello',
            sender: { id: 'user-1', username: 'alice', displayName: 'Alice' }
        });

        await sendMessage(mockReq, mockRes);

        expect(prisma.message.create).toHaveBeenCalled();
        const io = getIO();
        expect(io.to).toHaveBeenCalledWith('user_user-2');
    });

    it('sendMessage fires push notification with deep-link data', async () => {
        mockReq.body = { recipientId: 'user-2', content: 'hey!' };

        (prisma.conversation.findFirst as any).mockResolvedValue({ id: 'conv-42' });
        (prisma.message.create as any).mockResolvedValue({
            id: 'msg-2',
            content: 'hey!',
            sender: { id: 'user-1', username: 'alice', displayName: 'Alice' }
        });

        await sendMessage(mockReq, mockRes);

        // Give the unhandled promise a tick to settle
        await new Promise(r => setImmediate(r));

        expect(sendPushToUser).toHaveBeenCalledWith(
            'user-2',
            expect.objectContaining({
                title: 'New message',
                data: expect.objectContaining({
                    deepLink: 'luma://conversation/conv-42',
                    conversationId: 'conv-42',
                    type: 'direct_message'
                })
            })
        );
    });

    it('markAsRead updates messages and emits to sender', async () => {
        mockReq.body = { conversationId: 'conv-1' };

        (prisma.conversationParticipant.findMany as any).mockResolvedValue([
            { userId: 'user-1' },
            { userId: 'user-2' }
        ]);

        await markAsRead(mockReq, mockRes);

        expect(prisma.conversationParticipant.update).toHaveBeenCalled();
        expect(prisma.message.updateMany).toHaveBeenCalled();

        const io = getIO();
        const room = (io.to as any)('user_user-2');
        expect(room.emit).toHaveBeenCalledWith('messages_read', expect.objectContaining({
            conversationId: 'conv-1',
            readBy: 'user-1'
        }));
        expect(mockRes.json).toHaveBeenCalledWith({ success: true });
    });
});
