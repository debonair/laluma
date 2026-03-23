import { Worker, Job } from 'bullmq';
import { redisConnection, SURVEY_QUEUE_NAME } from '../lib/bullmq';
import * as surveyService from '../services/survey.service';

/**
 * Worker to handle survey-related background tasks:
 * 1. Periodic check to trigger Day-7 surveys for users.
 */
export const surveyWorker = new Worker(
    SURVEY_QUEUE_NAME,
    async (job: Job) => {
        console.log(`[Survey Worker] Processing job: ${job.name} (${job.id})`);

        if (job.name === 'trigger-day7-surveys') {
            const triggeredCount = await surveyService.triggerDay7Surveys();
            return { triggeredCount };
        }

        return { status: 'unknown-job-type' };
    },
    {
        connection: redisConnection,
        concurrency: 1
    }
);

surveyWorker.on('completed', (job) => {
    console.log(`[Survey Worker] Job ${job.id} completed successfully`);
});

surveyWorker.on('failed', (job, err) => {
    console.error(`[Survey Worker] Job ${job?.id} failed:`, err);
});

export const stopSurveyWorker = async () => {
    await surveyWorker.close();
};
