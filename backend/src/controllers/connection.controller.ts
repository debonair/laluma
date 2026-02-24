import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import prisma from '../utils/prisma';

export const getConnections = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const userId = req.user!.userId;

        const connections = await prisma.connection.findMany({
            where: {
                OR: [
                    { requesterId: userId },
                    { recipientId: userId }
                ]
            },
            include: {
                requester: { select: { id: true, username: true, displayName: true, profileImageUrl: true, isVerified: true, motherhoodStage: true } },
                recipient: { select: { id: true, username: true, displayName: true, profileImageUrl: true, isVerified: true, motherhoodStage: true } }
            },
            orderBy: { updatedAt: 'desc' }
        });

        res.json({ connections });
    } catch (error) {
        console.error('Get connections error:', error);
        res.status(500).json({ error: 'Failed to fetch connections' });
    }
};

export const sendConnectionRequest = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const requesterId = req.user!.userId;
        const { recipientId } = req.body;

        if (!recipientId || requesterId === recipientId) {
            res.status(400).json({ error: 'Invalid recipient ID' });
            return;
        }

        // Check if connection already exists
        const existingConnection = await prisma.connection.findFirst({
            where: {
                OR: [
                    { requesterId, recipientId },
                    { requesterId: recipientId, recipientId: requesterId }
                ]
            }
        });

        if (existingConnection) {
            res.status(400).json({ error: 'Connection or request already exists' });
            return;
        }

        const connection = await prisma.connection.create({
            data: {
                requesterId,
                recipientId,
                status: 'pending'
            },
            include: {
                requester: { select: { id: true, username: true, displayName: true, profileImageUrl: true, isVerified: true, motherhoodStage: true } },
                recipient: { select: { id: true, username: true, displayName: true, profileImageUrl: true, isVerified: true, motherhoodStage: true } }
            }
        });

        // Also create a notification for the recipient
        await prisma.notification.create({
            data: {
                userId: recipientId,
                actorId: requesterId,
                type: 'system',
                message: 'sent you a connection request (Wave 👋)',
                metadata: { connectionId: connection.id }
            }
        });

        res.status(201).json(connection);
    } catch (error) {
        console.error('Send connection request error:', error);
        res.status(500).json({ error: 'Failed to send connection request' });
    }
};

export const respondToConnectionRequest = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const userId = req.user!.userId;
        const id = req.params.id as string; // connection ID
        const { status } = req.body; // 'accepted' or 'declined'

        if (status !== 'accepted' && status !== 'declined') {
            res.status(400).json({ error: 'Status must be accepted or declined' });
            return;
        }

        const connection = await prisma.connection.findUnique({
            where: { id }
        });

        if (!connection) {
            res.status(404).json({ error: 'Connection request not found' });
            return;
        }

        if (connection.recipientId !== userId) {
            res.status(403).json({ error: 'Not authorized to respond to this request' });
            return;
        }

        if (connection.status !== 'pending') {
            res.status(400).json({ error: 'Request is already processed' });
            return;
        }

        if (status === 'declined') {
            // we delete the request if declined, to allow future re-requesting if necessary
            // or we could keep it as 'declined'
            await prisma.connection.delete({ where: { id } });
            res.json({ success: true, message: 'Request declined' });
            return;
        }

        // Must be accepted
        const updatedConnection = await prisma.connection.update({
            where: { id },
            data: { status: 'accepted' },
            include: {
                requester: { select: { id: true, username: true, displayName: true, profileImageUrl: true, isVerified: true, motherhoodStage: true } },
                recipient: { select: { id: true, username: true, displayName: true, profileImageUrl: true, isVerified: true, motherhoodStage: true } }
            }
        });

        // Notify the requester that it was accepted
        await prisma.notification.create({
            data: {
                userId: connection.requesterId,
                actorId: userId,
                type: 'system',
                message: 'accepted your connection request!',
                metadata: { connectionId: connection.id }
            }
        });

        res.json(updatedConnection);
    } catch (error) {
        console.error('Respond connection request error:', error);
        res.status(500).json({ error: 'Failed to respond to connection request' });
    }
};
