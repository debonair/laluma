import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import prisma from './utils/prisma';
import dotenv from 'dotenv';
import jwksClient from 'jwks-rsa';

dotenv.config();

// Keycloak Configuration
const KEYCLOAK_REALM = process.env.KEYCLOAK_REALM || 'luma-realm';
const KEYCLOAK_URL = process.env.KEYCLOAK_URL || 'http://localhost:8080';

// JWKS Client to fetch Keycloak public keys
const client = jwksClient({
    jwksUri: `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/certs`,
    cache: true,
    rateLimit: true,
});

function getKey(header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) {
    client.getSigningKey(header.kid, (err, key) => {
        if (err) {
            callback(err, undefined);
            return;
        }
        const signingKey = key?.getPublicKey();
        callback(null, signingKey);
    });
}

// Extend Socket interface to include our user payload
export interface AuthenticatedSocket extends Socket {
    user?: {
        userId: string;
        username: string;
    };
}

let ioInstance: SocketIOServer;

export function getIO(): SocketIOServer {
    if (!ioInstance) {
        throw new Error('Socket.io not initialized!');
    }
    return ioInstance;
}

export function setupSocketIO(server: HttpServer) {
    const io = new SocketIOServer(server, {
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:5173',
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    ioInstance = io;

    // 1. Authentication Middleware
    io.use((socket: AuthenticatedSocket, next) => {
        const token = socket.handshake.auth.token || socket.handshake.headers['authorization']?.split(' ')[1];

        if (!token) {
            return next(new Error('Authentication error: Token missing'));
        }

        jwt.verify(token, getKey, { algorithms: ['RS256'] }, async (err: any, decoded: any) => {
            if (err) {
                return next(new Error('Authentication error: Invalid token'));
            }

            try {
                const keycloakId = decoded?.sub || decoded?.jti;
                if (!keycloakId) {
                    return next(new Error('Authentication error: Invalid token claims'));
                }

                // Look up user in database
                const user = await prisma.user.findUnique({
                    where: { keycloakId }
                });

                if (!user) {
                    return next(new Error('Authentication error: User not found'));
                }

                // Attach user to socket
                socket.user = {
                    userId: user.id,
                    username: user.username
                };

                next();
            } catch (error) {
                console.error('Socket authentication error:', error);
                next(new Error('Authentication error: Internal server error'));
            }
        });
    });

    // 2. Connection Logic
    io.on('connection', (socket: AuthenticatedSocket) => {
        if (!socket.user) return; // Should be impossible due to middleware
        const userId = socket.user.userId;

        console.log(`Socket connected: User ${socket.user.username} (${socket.id})`);

        // Join a private room unique to this user to receive direct messages
        socket.join(`user_${userId}`);

        // Join all group rooms so user gets real-time new_post events
        prisma.groupMember.findMany({
            where: { userId },
            select: { groupId: true }
        }).then((memberships: { groupId: string }[]) => {
            memberships.forEach(({ groupId }) => {
                socket.join(`group_${groupId}`);
            });
        }).catch((err: any) => {
            console.error('Failed to join group rooms on socket connect:', err);
        });

        // Direct Messaging Typing Indicator
        socket.on('typing', ({ conversationId, recipientId, isTyping }) => {
            if (!userId || !recipientId) return;
            // Send typing status to the recipient's private room
            socket.to(`user_${recipientId}`).emit('is_typing', { 
                conversationId, 
                userId, 
                isTyping 
            });
        });

        socket.on('disconnect', () => {
            console.log(`Socket disconnected: User ${socket.user?.username} (${socket.id})`);
        });
    });

    return io;
}
