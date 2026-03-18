// backend/src/scheduler.ts

import { eventMaintenanceQueue } from './lib/bullmq';

/**
 * Initialize all repeatable jobs for the system
 */
export const initScheduler = async () => {
    console.log('[Scheduler] Initializing repeatable jobs...');

    // 1. Waitlist Expiration Job (Runs every hour)
    // Story 7.5 AC #7: automatically clear the waitlist 24 hours before the event start time
    await eventMaintenanceQueue.add(
        'waitlist-expiration',
        { triggeredAt: new Date() },
        {
            repeat: {
                pattern: '0 * * * *', // Every hour at minute 0
            },
            jobId: 'waitlist-expiration-job' // Deduplication
        }
    );

    console.log('[Scheduler] Registered waitlist-expiration job');
};
