import { Request, Response } from 'express';
import { z } from 'zod';
import * as brandPartnerService from '../services/brandPartnerService';

const profileUpdateSchema = z.object({
  companyName: z.string().min(2).optional(),
  logoUrl: z.string().url().nullable().optional(),
  website: z.string().url().nullable().optional(),
  bio: z.string().max(500).nullable().optional(),
  category: z.string().nullable().optional(),
  instagramHandle: z.string().nullable().optional(),
  facebookUrl: z.string().url().nullable().optional(),
});

export const getMyProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user || !user.userId) {
      console.error('[BrandPartner] No user found in request');
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    
    console.log(`[BrandPartner] Fetching profile for userId: ${user.userId}`);
    const profile = await brandPartnerService.getPartnerProfile(user.userId);
    
    if (!profile) {
      console.warn(`[BrandPartner] Profile not found for userId: ${user.userId}`);
      res.status(404).json({ error: 'Profile not found' });
      return;
    }
    
    res.json(profile);
  } catch (error: any) {
    console.error('[BrandPartner] Error fetching partner profile:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
    });
  }
};

export const updateMyProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user || !user.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const userId = user.userId;
    console.log(`[BrandPartner] Updating profile for userId: ${userId}`, req.body);
    const validatedData = profileUpdateSchema.parse(req.body);
    
    const profile = await brandPartnerService.updatePartnerProfile(userId, validatedData);
    console.log(`[BrandPartner] Profile updated successfully for userId: ${userId}`);
    res.json({ message: 'Profile updated successfully', profile });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
      return;
    }
    console.error('Error updating partner profile:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getPublicProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const profile = await brandPartnerService.getPublicPartnerProfile(id);
    
    if (!profile) {
      res.status(404).json({ error: 'Partner not found' });
      return;
    }
    
    res.json(profile);
  } catch (error) {
    console.error('Error fetching public partner profile:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
