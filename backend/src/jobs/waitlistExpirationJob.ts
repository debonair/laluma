// backend/src/jobs/waitlistExpirationJob.ts

export interface WaitlistExpirationJobPayload {
    triggeredAt: Date;
}

/**
 * This job identifies events starting in less than 24 hours
 * and clears their waitlists to ensure attendance stability.
 */
