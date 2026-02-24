import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { z } from 'zod';

const createListingSchema = z.object({
    name: z.string().min(1).max(200),
    category: z.string(),
    address: z.string().optional(),
    latitude: z.number(),
    longitude: z.number(),
    description: z.string().optional()
});

const createReviewSchema = z.object({
    rating: z.number().min(1).max(5),
    content: z.string().min(1).max(1000)
});

export const getListings = async (req: Request, res: Response): Promise<void> => {
    try {
        const userLat = parseFloat(req.query.latitude as string);
        const userLng = parseFloat(req.query.longitude as string);
        const radius = parseInt(req.query.radius as string) || 50;
        const category = typeof req.query.category === 'string' ? req.query.category : undefined;

        let listings = await prisma.directoryListing.findMany({
            where: {
                ...(category ? { category } : {})
            },
            include: {
                reviews: {
                    select: { rating: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        let enrichedListings = listings.map((listing: any) => {
            const avgRating = listing.reviews.length > 0
                ? listing.reviews.reduce((sum: number, rev: any) => sum + rev.rating, 0) / listing.reviews.length
                : 0;
            return {
                ...listing,
                averageRating: avgRating,
                reviewCount: listing.reviews.length
            };
        });

        if (!isNaN(userLat) && !isNaN(userLng)) {
            enrichedListings = enrichedListings.filter((listing: any) => {
                const R = 6371;
                const dLat = (listing.latitude - userLat) * Math.PI / 180;
                const dLon = (listing.longitude - userLng) * Math.PI / 180;
                const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.cos(userLat * Math.PI / 180) * Math.cos(listing.latitude * Math.PI / 180) *
                    Math.sin(dLon / 2) * Math.sin(dLon / 2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                const distance = R * c;
                return distance <= radius;
            });
        }

        res.json({ listings: enrichedListings });
    } catch (error) {
        console.error('Failed to get directory listings:', error);
        res.status(500).json({ error: 'Failed to fetch directory listings' });
    }
};

export const createListing = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = createListingSchema.parse(req.body);

        const listing = await prisma.directoryListing.create({
            data
        });

        res.status(201).json(listing);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: error.errors });
            return;
        }
        console.error('Failed to create directory listing:', error);
        res.status(500).json({ error: 'Failed to create directory listing' });
    }
};

export const getListingReviews = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = req.params.id as string;
        const reviews = await prisma.directoryReview.findMany({
            where: { listingId: id },
            include: { author: { select: { id: true, username: true, displayName: true, profileImageUrl: true, isVerified: true } } },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ reviews });
    } catch (error) {
        console.error('Failed to fetch reviews:', error);
        res.status(500).json({ error: 'Failed to fetch reviews' });
    }
};

export const addReview = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = req.params.id as string;
        const userId = (req as any).user!.userId;
        const data = createReviewSchema.parse(req.body);

        const existingReview = await prisma.directoryReview.findFirst({
            where: { listingId: id, authorId: userId }
        });

        if (existingReview) {
            res.status(400).json({ error: 'You have already reviewed this listing' });
            return;
        }

        const review = await prisma.directoryReview.create({
            data: {
                listingId: id,
                authorId: userId,
                rating: data.rating,
                content: data.content
            }
        });

        res.status(201).json(review);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: error.errors });
            return;
        }
        console.error('Failed to add directory review:', error);
        res.status(500).json({ error: 'Failed to add review' });
    }
};
