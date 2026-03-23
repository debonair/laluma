import prisma from '../utils/prisma';
import { surveyQueue } from '../lib/bullmq';
import * as notificationService from './pushNotification.service';

/**
 * Survey Service
 * Handles survey retrieval, submission, and automated triggering.
 */

/**
 * Get all active surveys that a user is eligible for but hasn't completed
 */
export const getPendingSurveys = async (userId: string) => {
    // Find all active surveys
    const activeSurveys = await (prisma as any).survey.findMany({
        where: { isActive: true }
    });

    // Find surveys already tracked for this user
    const trackedSurveys = await (prisma as any).userSurveyTracking.findMany({
        where: { 
            userId,
            status: { in: ['completed', 'dismissed'] }
        },
        select: { surveyId: true }
    });

    const completedIds = trackedSurveys.map((t: any) => t.surveyId);

    // Filter out completed ones
    return activeSurveys.filter((s: any) => !completedIds.includes(s.id));
};

/**
 * Submit a survey response
 */
export const submitResponse = async (userId: string, surveyId: string, responses: any) => {
    return await prisma.$transaction(async (tx) => {
        // 1. Create the response record
        const response = await (tx as any).surveyResponse.create({
            data: {
                userId,
                surveyId,
                responses
            }
        });

        // 2. Update tracking status
        await (tx as any).userSurveyTracking.upsert({
            where: {
                userId_surveyId: { userId, surveyId }
            },
            update: {
                status: 'completed',
                completedAt: new Date()
            },
            create: {
                userId,
                surveyId,
                status: 'completed',
                completedAt: new Date()
            }
        });

        return response;
    });
};

/**
 * Trigger logic for the Day-7 Survey
 * Identifies users who signed up exactly 7 days ago and haven't been notified yet.
 */
export const triggerDay7Surveys = async () => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Create a range for the "7 days ago" date to catch everyone who signed up on that day
    const startOfDay = new Date(sevenDaysAgo.setHours(0, 0, 0, 0));
    const endOfDay = new Date(sevenDaysAgo.setHours(23, 59, 59, 999));

    // Find the survey definition
    const day7Survey = await (prisma as any).survey.findUnique({
        where: { slug: 'day-7-aha' }
    });

    if (!day7Survey || !day7Survey.isActive) {
        console.warn('[SurveyService] Day-7 survey not found or inactive');
        return 0;
    }

    // Find users who signed up 7 days ago and haven't been tracked for this survey yet
    const eligibleUsers = await prisma.user.findMany({
        where: {
            createdAt: {
                gte: startOfDay,
                lte: endOfDay
            },
            // @ts-ignore - Prisma generated types might be delayed
            surveyTracking: {
                none: {
                    surveyId: day7Survey.id
                }
            }
        },
        select: {
            id: true,
            displayName: true
        }
    });

    console.log(`[SurveyService] Found ${eligibleUsers.length} users eligible for Day-7 survey`);

    for (const user of eligibleUsers) {
        try {
            // 1. Mark as sent in tracking
            await (prisma as any).userSurveyTracking.create({
                data: {
                    userId: user.id,
                    surveyId: day7Survey.id,
                    status: 'sent'
                }
            });

            // 2. Send notification
            await notificationService.sendPushToUser(
                user.id,
                {
                    title: 'We value your feedback! 🌿',
                    body: `Hi ${user.displayName || 'there'}, you've been with Luma for a week. How is it going?`,
                    data: {
                        type: 'system',
                        deepLink: `luma://survey/${day7Survey.id}`,
                        surveyId: day7Survey.id,
                        surveySlug: day7Survey.slug
                    }
                }
            );

            console.log(`[SurveyService] Triggered Day-7 survey for user ${user.id}`);
        } catch (error) {
            console.error(`[SurveyService] Failed to trigger survey for user ${user.id}:`, error);
        }
    }

    return eligibleUsers.length;
};
