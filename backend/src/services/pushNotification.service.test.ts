import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../db', () => ({
    prisma: {}
}));

// We import the module AFTER mocking so we can control prisma
import { sendPushToUser, registerDeviceToken, removeDeviceToken } from './pushNotification.service';
import { prisma } from '../db';

const mockFindMany = vi.fn();
const mockUpsert = vi.fn();
const mockDeleteMany = vi.fn();

(prisma as any).pushDeviceToken = {
    findMany: mockFindMany,
    upsert: mockUpsert,
    deleteMany: mockDeleteMany
};

describe('pushNotification.service (mock mode – no FIREBASE_SERVER_KEY)', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { });

    beforeEach(() => {
        delete process.env.FIREBASE_SERVER_KEY;
        vi.clearAllMocks();
    });

    afterEach(() => {
        consoleSpy.mockClear();
    });

    it('sendPushToUser skips when user has no registered tokens', async () => {
        mockFindMany.mockResolvedValue([]);
        await sendPushToUser('user-1', { title: 'Test', body: 'Hello' });
        expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('sendPushToUser logs in mock mode when tokens exist but no server key', async () => {
        mockFindMany.mockResolvedValue([{ token: 'fcm-token-abc' }]);
        await sendPushToUser('user-1', { title: 'New message', body: 'Someone sent you a message' });
        expect(consoleSpy).toHaveBeenCalledWith(
            expect.stringContaining('[PushNotification MOCK] → user user-1'),
            expect.objectContaining({ title: 'New message' })
        );
    });

    it('registerDeviceToken upserts into prisma', async () => {
        mockUpsert.mockResolvedValue({});
        await registerDeviceToken('user-2', 'token-xyz', 'ios');
        expect(mockUpsert).toHaveBeenCalledWith(expect.objectContaining({
            where: { token: 'token-xyz' },
            create: expect.objectContaining({ userId: 'user-2', platform: 'ios' })
        }));
    });

    it('removeDeviceToken deletes from prisma', async () => {
        mockDeleteMany.mockResolvedValue({ count: 1 });
        await removeDeviceToken('token-xyz');
        expect(mockDeleteMany).toHaveBeenCalledWith({ where: { token: 'token-xyz' } });
    });

    it('payload strips sensitive content – title must not contain raw message body', async () => {
        const sensitiveContent = 'My secret support group chat';
        mockFindMany.mockResolvedValue([{ token: 'tok' }]);
        await sendPushToUser('user-1', { title: 'New message', body: 'Someone replied to you', data: { conversationId: '123' } });
        // The payload title/body should NOT contain the raw sensitiveContent
        const callArgs = consoleSpy.mock.calls[0];
        const payloadArg = callArgs[1] as { title: string; body: string };
        expect(payloadArg.title).not.toBe(sensitiveContent);
        expect(payloadArg.body).not.toBe(sensitiveContent);
    });
});
