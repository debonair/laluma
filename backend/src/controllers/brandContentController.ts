import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as brandContentService from '../services/brandContentService';
import * as brandPartnerService from '../services/brandPartnerService';
import { BrandContentStatus } from '@prisma/client';
import { z } from 'zod';

const contentSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  content: z.string().min(20, 'Content must be at least 20 characters'),
  imageUrl: z.string().url().optional().or(z.literal('')),
  discountCode: z.string().optional(),
});

/**
 * Saves a content draft for the authenticated brand partner.
 */
export const saveDraft = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const profile = await brandPartnerService.getPartnerProfile(userId);
    if (!profile) {
      return res.status(403).json({ error: 'Forbidden', message: 'No brand profile found' });
    }

    const validatedData = contentSchema.parse(req.body);
    const contentId = req.params.id as string | undefined;

    const content = await brandContentService.saveDraft(contentId, {
      partnerId: profile.id,
      ...validatedData,
    });

    res.status(200).json(content);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation Error', details: error.errors });
    }
    console.error('Error saving brand content draft:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Submits a draft for editorial review.
 */
export const submitForReview = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const profile = await brandPartnerService.getPartnerProfile(userId);
    if (!profile) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const contentId = req.params.id as string;
    const content = await brandContentService.submitForReview(contentId, profile.id);

    res.status(200).json({ message: 'Submitted for review', content });
  } catch (error: any) {
    if (error.message === 'QUOTA_EXCEEDED') {
      return res.status(429).json({ 
        error: 'Quota Exceeded', 
        message: 'Maximum of 2 active submissions allowed. Please wait for previous items to be reviewed.' 
      });
    }
    console.error('Error submitting content:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Gets all content for the authenticated partner.
 */
export const getMyContent = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const profile = await brandPartnerService.getPartnerProfile(userId);
    if (!profile) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const content = await brandContentService.getPartnerContent(profile.id);
    res.status(200).json(content);
  } catch (error) {
    console.error('Error fetching partner content:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Gets the submission quota for the partner.
 */
export const getQuota = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const profile = await brandPartnerService.getPartnerProfile(userId);
    if (!profile) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const activeCount = await brandContentService.getActiveSubmissionCount(profile.id);
    res.status(200).json({ activeCount, limit: 2 });
  } catch (error) {
    console.error('Error fetching brand quota:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Gets the editorial queue (Admin/Editorial use).
 */
export const getEditorialQueue = async (req: AuthRequest, res: Response) => {
  try {
    const queue = await brandContentService.getEditorialQueue();
    res.status(200).json(queue);
  } catch (error) {
    console.error('Error fetching editorial queue:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Reviews a content submission (Editorial use).
 */
export const reviewContent = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status, editorialNotes } = req.body;

    if (!Object.values(BrandContentStatus).includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const content = await brandContentService.reviewContent(id, status, editorialNotes);
    res.status(200).json({ message: `Content ${status.toLowerCase()} successfully`, content });
  } catch (error) {
    console.error('Error reviewing content:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Gets performance analytics for the authenticated partner.
 */
export const getAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const profile = await brandPartnerService.getPartnerProfile(userId);
    if (!profile) {
      return res.status(403).json({ error: 'Forbidden', message: 'No brand profile found' });
    }

    const analytics = await brandContentService.getPartnerAnalytics(profile.id, userId);
    res.status(200).json(analytics);
  } catch (error) {
    console.error('Error fetching partner analytics:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
