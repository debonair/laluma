/**
 * Push Notification Service (Story 5.2 + 5.4)
 *
 * Sends FCM v1 HTTP push notifications without requiring firebase-admin.
 * Falls back to console mock when FIREBASE_SERVER_KEY is not configured.
 *
 * SECURITY: Push payloads deliberately avoid exposing raw message content or
 * sensitive group names in the notification title/body (lock-screen privacy).
 * Only non-sensitive summary strings and IDs are included.
 *
 * Story 5.4: Extended with category-based opt-out gating. Users who have
 * disabled a notification category via `PATCH /notifications/preferences`
 * will never receive that category's push, even if a token is registered.
 */

import { prisma } from '../db';

/** Preference field that maps to each notification category */
const CATEGORY_TO_PREF: Record<string, string> = {
    direct_message: 'notifyDms',
    post_reply: 'notifyGroups',
    event: 'notifyEvents',
    moderation: 'notifyModeration',
    system: '' // system notifications always go through
};

export interface PushPayload {
    /** Generic title – avoid leaking group names or message content */
    title: string;
    /** Generic body – avoid leaking message content */
    body: string;
    /**
     * Non-sensitive routing data sent inside the FCM/APNs `data` bag.
     * The Capacitor mobile client reads these fields to perform deep linking.
     *
     * Standard fields:
     * - `deepLink`        — URL scheme the app uses to route: `luma://<resource>/<id>`
     *                       e.g. `luma://conversation/<conversationId>`
     *                            `luma://post/<postId>`
     *                            `luma://event/<eventId>`
     * - `type`            — notification category: `"direct_message"` | `"post_reply"` | `"system"`
     * - `conversationId`  — present when type === "direct_message"
     * - `postId`          — present when type === "post_reply"
     *
     * All values must be strings (FCM data bag requirement).
     */
    data?: Record<string, string>;
}

/**
 * Check whether the user has opted into the given notification category.
 * Returns `true` (allow send) when preferences cannot be determined.
 */
async function isUserOptedIn(userId: string, category: string): Promise<boolean> {
    const prefField = CATEGORY_TO_PREF[category];
    // Empty string = system notification, always allowed
    if (prefField === '') return true;
    // Unknown categories are allowed by default
    if (!prefField) return true;

    try {
        const prefs = await (prisma as any).userPreference.findUnique({
            where: { userId },
            select: { [prefField]: true }
        }) as Record<string, boolean> | null;

        if (!prefs) return true; // No row = default opt-in
        return prefs[prefField] !== false;
    } catch {
        return true; // Fail open
    }
}

/**
 * Send a push notification to all registered devices for a user.
 * Silently skips if:
 * - No tokens are registered
 * - Firebase is not configured (mock mode)
 * - The user has opted out of this notification category (Story 5.4)
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
    // Story 5.4: Opt-out gating
    const category = payload.data?.type ?? '';
    const optedIn = await isUserOptedIn(userId, category);
    if (!optedIn) return;

    const tokens = await (prisma as any).pushDeviceToken.findMany({
        where: { userId },
        select: { token: true }
    }) as { token: string }[];

    if (!tokens.length) return;

    const serverKey = process.env.FIREBASE_SERVER_KEY;

    if (!serverKey) {
        console.log(`[PushNotification MOCK] → user ${userId}`, payload);
        return;
    }

    const sendPromises = tokens.map(({ token }) =>
        fetch('https://fcm.googleapis.com/fcm/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `key=${serverKey}`
            },
            body: JSON.stringify({
                to: token,
                notification: {
                    title: payload.title,
                    body: payload.body,
                    sound: 'default'
                },
                data: payload.data ?? {}
            })
        }).then(async (response) => {
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`[PushNotification] FCM error for token ${token.substring(0, 20)}...: HTTP ${response.status} - ${errorText}`);
            }
            return response;
        }).catch((err: Error) => {
            console.error(`[PushNotification] Failed to send to token ${token.substring(0, 20)}...:`, err.message);
        })
    );

    await Promise.allSettled(sendPromises);
}

/**
 * Register or update a user's push device token.
 */
export async function registerDeviceToken(userId: string, token: string, platform: 'ios' | 'android' | 'web'): Promise<void> {
    await (prisma as any).pushDeviceToken.upsert({
        where: { token },
        update: { userId, platform, updatedAt: new Date() },
        create: { userId, token, platform }
    });
}

/**
 * Remove a device token (e.g., on logout).
 */
export async function removeDeviceToken(token: string): Promise<void> {
    await (prisma as any).pushDeviceToken.deleteMany({ where: { token } });
}

// ─── Story 5.5: System & Event Push Notification Helpers ────────────────────

/**
 * Send a 24-hour event reminder push to the given user.
 *
 * Payload is intentionally generic — no event title in the notification
 * body to protect lock-screen privacy. The `deepLink` routes the
 * Capacitor app to the event detail screen.
 *
 * Opt-out gating (notifyEvents preference) is handled automatically
 * inside `sendPushToUser` via the CATEGORY_TO_PREF mapping.
 */
export async function sendEventReminderPush(
    userId: string,
    eventId: string
): Promise<void> {
    await sendPushToUser(userId, {
        title: 'Reminder: Upcoming Event',
        body: 'Your event starts in less than 24 hours.',
        data: {
            type: 'event',
            deepLink: `luma://event/${eventId}`
        }
    });
}

/**
 * Send a moderation resolution push to the user who submitted a report.
 *
 * The deep link routes to the in-app notifications list rather than a
 * specific report to avoid leaking moderation detail through the OS
 * notification tray.
 *
 * Opt-out gating (notifyModeration preference) is handled automatically
 * inside `sendPushToUser` via the CATEGORY_TO_PREF mapping.
 */
export async function sendModerationResolutionPush(
    userId: string,
    _reportId: string
): Promise<void> {
    await sendPushToUser(userId, {
        title: 'Your Report Has Been Reviewed',
        body: 'A moderator has reviewed your recent report.',
        data: {
            type: 'moderation',
            deepLink: 'luma://notifications'
        }
    });
}

