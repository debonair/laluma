import { Queue, ConnectionOptions } from 'bullmq';
import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Parse Redis URL safely - handle cases where port may be missing
const getRedisPort = (url: string): number => {
    try {
        const parsed = new URL(url);
        const port = parsed.port;
        return port ? parseInt(port, 10) : 6379;
    } catch {
        return 6379;
    }
};

// Shared centralized connection payload (required by BullMQ docs to avoid instantiating many connections)
export const redisConnection: ConnectionOptions = {
    host: new URL(REDIS_URL).hostname,
    port: getRedisPort(REDIS_URL),
    maxRetriesPerRequest: null, // Required by BullMQ
};

// Also export a raw ioredis connection if generic redis usage is needed
export const redisClient = new Redis(REDIS_URL, {
    maxRetriesPerRequest: null // Required by BullMQ if shared
});

export const MODERATION_QUEUE_NAME = 'moderation-queue';
export const EVENT_MAINTENANCE_QUEUE_NAME = 'event-maintenance-queue';
export const SURVEY_QUEUE_NAME = 'survey-queue';

export const moderationQueue = new Queue(MODERATION_QUEUE_NAME, {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000 // 1s, then 2s, then 4s, etc
        },
        removeOnComplete: true, // Keep Redis clean
        removeOnFail: 100 // Keep last 100 failed jobs for debugging
    }
});

export const eventMaintenanceQueue = new Queue(EVENT_MAINTENANCE_QUEUE_NAME, {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000
        },
        removeOnComplete: true,
        removeOnFail: 100
    }
});

export const surveyQueue = new Queue(SURVEY_QUEUE_NAME, {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000
        },
        removeOnComplete: true,
        removeOnFail: 100
    }
});
