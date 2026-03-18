// backend/src/workers/eventMaintenanceWorker.ts

import { Worker, Job } from 'bullmq';
import { redisConnection, EVENT_MAINTENANCE_QUEUE_NAME } from '../lib/bullmq';
import { WaitlistExpirationJobPayload } from '../jobs/waitlistExpirationJob';
import prisma from '../utils/prisma';

/**
 * Worker to handle event maintenance tasks:
 * 1. Clearing waitlists for events starting in < 24 hours (AC #7)
 */
export const eventMaintenanceWorker = new Worker(
    EVENT_MAINTENANCE_QUEUE_NAME,
    async (job: Job<WaitlistExpirationJobPayload>) => {
        console.log(`[Event Maintenance Worker] Running maintenance check...`);

        const now = new Date();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        // Find events starting within the next 24 hours that still have waitlisted registrations
        const eventsStartingSoon = await prisma.event.findMany({
            where: {
                startTime: {
                    gt: now,
                    lt: tomorrow
                },
                registrations: {
                    some: {
                        status: 'waitlisted'
                    }
                }
            },
            include: {
                registrations: {
                    where: {
                        status: 'waitlisted'
                    }
                }
            }
        });

        console.log(`[Event Maintenance Worker] Found ${eventsStartingSoon.length} events needing waitlist cleanup`);

        for (const event of eventsStartingSoon) {
            console.log(`[Event Maintenance Worker] Clearing waitlist for event: ${event.title} (${event.id})`);

            // 1. Delete all EventWaitlist entries for this event
            await prisma.eventWaitlist.deleteMany({
                where: {
                    eventId: event.id
                }
            });

            // 2. Clear waitlisted registrations
            // We can either delete them or set them to 'cancelled'
            // For Story 7.5, AC #7 just says "clear the waitlist", so deleting is most consistent with a "clear"
            await prisma.eventRegistration.deleteMany({
                where: {
                    eventId: event.id,
                    status: 'waitlisted'
                }
            });
            
            console.log(`[Event Maintenance Worker] Waitlist cleared for event ${event.id}`);
        }

        return {
            processedEvents: eventsStartingSoon.length
        };
    },
    {
        connection: redisConnection,
        concurrency: 1
    }
);

eventMaintenanceWorker.on('completed', (job) => {
    console.log(`[Event Maintenance Worker] Job ${job.id} completed`);
});

eventMaintenanceWorker.on('failed', (job, err) => {
    console.error(`[Event Maintenance Worker] Job ${job?.id} failed:`, err);
});

export const stopEventMaintenanceWorker = async () => {
    await eventMaintenanceWorker.close();
};
