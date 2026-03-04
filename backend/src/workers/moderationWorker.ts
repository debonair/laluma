import { Worker, Job } from 'bullmq';
import { redisConnection, MODERATION_QUEUE_NAME } from '../lib/bullmq';
import { ModeratePostJobPayload } from '../jobs/moderatePostJob';
import prisma from '../utils/prisma';

// Create a worker that processes jobs from the moderation queue
export const moderationWorker = new Worker(
    MODERATION_QUEUE_NAME,
    async (job: Job<ModeratePostJobPayload>) => {
        const { postId, content, isComment } = job.data;

        console.log(`[Moderation Worker] Processing ${isComment ? 'comment' : 'post'} ${postId}`);

        // TODO: In the future, this is where we will call AWS Comprehend or Perspective API.
        // For now (Story 6.2), we simulate the request with a simple mock timeout and an arbitrary flag rule
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network latency

        const isFlaggedByAI = content.toLowerCase().includes('placeholder-bad');
        const confidenceScore = isFlaggedByAI ? 0.95 : 0.05;

        // In Epic 6, we'll actually update a `ModerationQueue` item or write it to the db.
        // Even without those models existing yet, we can record the AI analysis to the post record if it exists,
        // or just log it to satisfy FR21 criteria for now. 
        // We do NOT have the `ModerationEntity` schema yet for tracking queues (Story 6.5).

        if (isFlaggedByAI) {
            console.log(`[Moderation Worker] WARNING: AI flagged item ${postId} with confidence ${confidenceScore}`);
            // If it's a post, we can update it or hide it, or if there's a dedicated queue.
            // Since we don't have a moderation table, we will just leave a console trace confirming the pipeline works.
        } else {
            console.log(`[Moderation Worker] Item ${postId} passed AI safety filter (score: ${confidenceScore})`);
        }

        return {
            flagged: isFlaggedByAI,
            confidence: confidenceScore
        };
    },
    {
        connection: redisConnection,
        concurrency: 5 // Process up to 5 posts concurrently
    }
);

// Event listeners for structured logging
moderationWorker.on('completed', (job: Job<ModeratePostJobPayload, any, string>) => {
    console.log(`[Moderation Worker] Job ${job.id} completed successfully`);
});

moderationWorker.on('failed', (job: Job<ModeratePostJobPayload, any, string> | undefined, err: Error) => {
    console.error(`[Moderation Worker] Job ${job?.id} failed with error:`, err);
});

// Used to cleanly shutdown when app stops
export const stopModerationWorker = async () => {
    await moderationWorker.close();
};
