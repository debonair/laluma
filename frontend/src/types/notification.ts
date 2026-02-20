export interface Notification {
    id: string;
    userId: string;
    actorId?: string;
    type: 'like' | 'comment' | 'system' | 'reply';
    message: string;
    isRead: boolean;
    metadata?: Record<string, unknown>;
    createdAt: string;
    actor?: {
        id: string;
        username: string;
        displayName?: string;
        profileImageUrl?: string;
    };
}

export interface NotificationResponse {
    notifications: Notification[];
    pagination: {
        total: number;
        limit: number;
        offset: number;
        hasMore: boolean;
    };
    unreadCount: number;
}
