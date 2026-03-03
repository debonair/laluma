import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getConnections, sendConnectionRequest, respondToConnectionRequest } from './connection.controller';
import prisma from '../utils/prisma';

const mockedPrisma = prisma as any;

describe('Connections Controller', () => {
    let mockReq: any;
    let mockRes: any;

    beforeEach(() => {
        mockReq = {
            query: {},
            params: {},
            body: {},
            user: { userId: 'user-1' }
        };
        mockRes = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn(),
            send: vi.fn()
        };
        vi.clearAllMocks();
    });

    describe('getConnections', () => {
        it('returns connections for the user', async () => {
            const connections = [{ id: 'conn-1', requesterId: 'user-1', recipientId: 'user-2' }];
            mockedPrisma.connection.findMany.mockResolvedValueOnce(connections);

            await getConnections(mockReq, mockRes);

            expect(mockedPrisma.connection.findMany).toHaveBeenCalled();
            expect(mockRes.json).toHaveBeenCalledWith({ connections });
        });
    });

    describe('sendConnectionRequest', () => {
        it('returns 400 if recipientId represents self', async () => {
            mockReq.body = { recipientId: 'user-1' };

            await sendConnectionRequest(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid recipient ID' });
        });

        it('returns 400 if connection already exists', async () => {
            mockReq.body = { recipientId: 'user-2' };
            mockedPrisma.connection.findFirst.mockResolvedValueOnce({ id: 'existing-conn' });

            await sendConnectionRequest(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Connection or request already exists' });
        });

        it('creates connection and notification', async () => {
            mockReq.body = { recipientId: 'user-2' };
            mockedPrisma.connection.findFirst.mockResolvedValueOnce(null);

            const newConn = { id: 'conn-1', requesterId: 'user-1', recipientId: 'user-2', status: 'pending' };
            mockedPrisma.connection.create.mockResolvedValueOnce(newConn);
            mockedPrisma.notification.create.mockResolvedValueOnce({ id: 'notif-1' });

            await sendConnectionRequest(mockReq, mockRes);

            expect(mockedPrisma.connection.create).toHaveBeenCalled();
            expect(mockedPrisma.notification.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({ userId: 'user-2', actorId: 'user-1' })
            }));
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith(newConn);
        });
    });

    describe('respondToConnectionRequest', () => {
        it('validates status enum', async () => {
            mockReq.params.id = 'conn-1';
            mockReq.body = { status: 'invalid' };

            await respondToConnectionRequest(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
        });

        it('returns 403 if user is not the recipient', async () => {
            mockReq.params.id = 'conn-1';
            mockReq.body = { status: 'accepted' };
            // Mock connection where recipient is 'user-2'
            mockedPrisma.connection.findUnique.mockResolvedValueOnce({ recipientId: 'user-2' });

            await respondToConnectionRequest(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(403);
        });

        it('deletes connection if declined', async () => {
            mockReq.params.id = 'conn-1';
            mockReq.body = { status: 'declined' };
            mockedPrisma.connection.findUnique.mockResolvedValueOnce({ id: 'conn-1', recipientId: 'user-1', status: 'pending' });

            await respondToConnectionRequest(mockReq, mockRes);

            expect(mockedPrisma.connection.delete).toHaveBeenCalledWith({ where: { id: 'conn-1' } });
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });

        it('updates connection to accepted and sends notification', async () => {
            mockReq.params.id = 'conn-1';
            mockReq.body = { status: 'accepted' };
            mockedPrisma.connection.findUnique.mockResolvedValueOnce({ id: 'conn-1', recipientId: 'user-1', requesterId: 'user-2', status: 'pending' });
            mockedPrisma.connection.update.mockResolvedValueOnce({ id: 'conn-1', status: 'accepted' });

            await respondToConnectionRequest(mockReq, mockRes);

            expect(mockedPrisma.connection.update).toHaveBeenCalledWith(expect.objectContaining({
                data: { status: 'accepted' }
            }));
            expect(mockedPrisma.notification.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({ userId: 'user-2', actorId: 'user-1' })
            }));
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'accepted' }));
        });
    });
});
