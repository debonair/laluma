import { getIO } from '../socket';

/**
 * Emit a real-time notification to a specific user via Socket.IO.
 * The user must be connected and joined to their `user_${userId}` room.
 */
export function emitNotification(userId: string, notification: {
    id: string;
    type: string;
    message: string;
    metadata?: any;
    createdAt: string;
}) {
    getIO().to(`user_${userId}`).emit('new_notification', notification);
}
