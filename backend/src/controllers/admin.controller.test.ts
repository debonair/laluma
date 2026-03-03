import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAdminStats, getUsers, updateUserRole, updateUserStatus } from './admin.controller';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/auth';
import { Response } from 'express';

vi.mock('../utils/prisma', () => ({
    default: {
        user: { count: vi.fn(), findMany: vi.fn(), update: vi.fn() },
        group: { count: vi.fn() },
        contentSubmission: { count: vi.fn() },
        content: { count: vi.fn() },
    },
}));

// Mock Keycloak admin client
const mockKcUpdate = vi.hoisted(() => vi.fn());

vi.mock('../utils/keycloak', () => ({
    getKeycloakAdminClient: vi.fn().mockResolvedValue({
        users: { update: mockKcUpdate }
    })
}));

describe('Admin Controller', () => {
    let mockReq: Partial<AuthRequest>;
    let mockRes: Partial<Response>;
    let jsonMock: any;
    let statusMock: any;

    beforeEach(() => {
        vi.clearAllMocks();
        jsonMock = vi.fn();
        statusMock = vi.fn().mockReturnValue({ json: jsonMock });

        mockReq = {
            user: { userId: 'admin-1', username: 'adminuser', roles: ['admin'] },
            params: {},
            body: {}
        };
        mockRes = { status: statusMock, json: jsonMock };
    });

    describe('getAdminStats', () => {
        it('returns standard dashboard metrics', async () => {
            vi.mocked(prisma.user.count).mockResolvedValueOnce(100);
            vi.mocked(prisma.group.count).mockResolvedValueOnce(10);
            vi.mocked(prisma.contentSubmission.count).mockResolvedValueOnce(5);
            vi.mocked(prisma.content.count).mockResolvedValueOnce(50);

            await getAdminStats(mockReq as AuthRequest, mockRes as Response);

            expect(jsonMock).toHaveBeenCalledWith({
                stats: {
                    totalUsers: 100,
                    totalGroups: 10,
                    pendingSubmissions: 5,
                    activeContent: 50
                }
            });
        });
    });

    describe('getUsers', () => {
        it('fetches a list of users', async () => {
            const returnedUsers = [{ id: 'user-1', email: 'test@mail.com', role: 'member', isActive: true }];
            vi.mocked(prisma.user.findMany).mockResolvedValueOnce(returnedUsers as any);

            await getUsers(mockReq as AuthRequest, mockRes as Response);

            expect(prisma.user.findMany).toHaveBeenCalled();
            expect(jsonMock).toHaveBeenCalledWith({ users: returnedUsers, total: 1 });
        });
    });

    describe('updateUserRole', () => {
        it('returns 400 for an invalid role', async () => {
            mockReq.params = { id: 'user-1' };
            mockReq.body = { role: 'superadmin' };

            await updateUserRole(mockReq as AuthRequest, mockRes as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Invalid role provided' });
        });

        it('updates user role successfully', async () => {
            mockReq.params = { id: 'user-1' };
            mockReq.body = { role: 'moderator' };

            vi.mocked(prisma.user.update).mockResolvedValueOnce({ id: 'user-1', role: 'moderator' } as any);

            await updateUserRole(mockReq as AuthRequest, mockRes as Response);

            expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: 'user-1' },
                data: { role: 'moderator' }
            }));
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                message: 'User role updated fully'
            }));
        });
    });

    describe('updateUserStatus', () => {
        it('returns 400 if isActive is not boolean', async () => {
            mockReq.params = { id: 'user-1' };
            mockReq.body = { isActive: 'false' };

            await updateUserStatus(mockReq as AuthRequest, mockRes as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
        });

        it('updates user status in Prisma and disables in Keycloak', async () => {
            mockReq.params = { id: 'user-1' };
            mockReq.body = { isActive: false };

            vi.mocked(prisma.user.update).mockResolvedValueOnce({
                id: 'user-1',
                isActive: false,
                keycloakId: 'kc-123'
            } as any);

            await updateUserStatus(mockReq as AuthRequest, mockRes as Response);

            expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: 'user-1' },
                data: { isActive: false }
            }));

            expect(mockKcUpdate).toHaveBeenCalledWith({ id: 'kc-123' }, { enabled: false });

            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                message: 'User status updated'
            }));
        });
    });
});
