import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getStatus, setStatus } from './status.controller';
import prisma from '../utils/prisma';

const mockedPrisma = prisma as any;

describe('Status Controller', () => {
    let mockReq: any;
    let mockRes: any;

    beforeEach(() => {
        mockReq = { body: {}, user: { userId: 'admin-1', roles: ['admin'] } };
        mockRes = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn()
        };
        vi.clearAllMocks();
    });

    describe('getStatus', () => {
        it('returns null when no active status exists', async () => {
            mockedPrisma.systemStatus.findFirst.mockResolvedValueOnce(null);

            await getStatus(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith({ status: null });
        });

        it('returns the active status message', async () => {
            const now = new Date();
            mockedPrisma.systemStatus.findFirst.mockResolvedValueOnce({
                id: 's-1',
                message: 'Planned maintenance tonight',
                type: 'info',
                updatedAt: now
            });

            await getStatus(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith({
                status: expect.objectContaining({
                    id: 's-1',
                    message: 'Planned maintenance tonight',
                    type: 'info'
                })
            });
        });
    });

    describe('setStatus', () => {
        it('returns 400 when message is an empty string', async () => {
            mockReq.body = { message: '' };

            await setStatus(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
        });

        it('clears status when message is null', async () => {
            mockReq.body = { message: null };
            mockedPrisma.systemStatus.updateMany.mockResolvedValueOnce({ count: 1 });

            await setStatus(mockReq, mockRes);

            expect(mockedPrisma.systemStatus.updateMany).toHaveBeenCalledWith({
                where: { isActive: true },
                data: { isActive: false }
            });
            expect(mockRes.json).toHaveBeenCalledWith({
                status: null,
                message: 'System status cleared'
            });
        });

        it('creates a new active status and deactivates old ones', async () => {
            mockReq.body = { message: 'High volume in crisis support', type: 'warning' };
            mockedPrisma.systemStatus.updateMany.mockResolvedValueOnce({ count: 0 });
            const now = new Date();
            mockedPrisma.systemStatus.create.mockResolvedValueOnce({
                id: 's-new',
                message: 'High volume in crisis support',
                type: 'warning',
                isActive: true,
                updatedAt: now
            });

            await setStatus(mockReq, mockRes);

            expect(mockedPrisma.systemStatus.updateMany).toHaveBeenCalledWith({
                where: { isActive: true },
                data: { isActive: false }
            });
            expect(mockedPrisma.systemStatus.create).toHaveBeenCalledWith(expect.objectContaining({
                data: { message: 'High volume in crisis support', type: 'warning', isActive: true }
            }));
            expect(mockRes.status).toHaveBeenCalledWith(201);
        });
    });
});
