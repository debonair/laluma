// backend/src/jobs/moderatePostJob.ts

export interface ModeratePostJobPayload {
    postId: string;
    content: string;
    isComment: boolean;
}

// Any other job definitions for other systems will go into their own files.
