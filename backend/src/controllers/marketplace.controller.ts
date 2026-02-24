import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { z } from 'zod';

const createItemSchema = z.object({
    title: z.string().min(1).max(100),
    description: z.string().max(1000),
    price: z.number().min(0),
    condition: z.string(),
    category: z.string(),
    latitude: z.number(),
    longitude: z.number()
});

export const getItems = async (req: Request, res: Response): Promise<void> => {
    try {
        const userLat = parseFloat(req.query.latitude as string);
        const userLng = parseFloat(req.query.longitude as string);
        const radius = parseInt(req.query.radius as string) || 50; // default 50km
        const category = typeof req.query.category === 'string' ? req.query.category : undefined;

        let items = await prisma.marketplaceItem.findMany({
            where: {
                status: 'available',
                ...(category ? { category } : {})
            },
            include: { seller: { select: { id: true, username: true, displayName: true, profileImageUrl: true, isVerified: true } } },
            orderBy: { createdAt: 'desc' }
        });

        if (!isNaN(userLat) && !isNaN(userLng)) {
            items = items.filter((item: any) => {
                const R = 6371;
                const dLat = (item.latitude - userLat) * Math.PI / 180;
                const dLon = (item.longitude - userLng) * Math.PI / 180;
                const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.cos(userLat * Math.PI / 180) * Math.cos(item.latitude * Math.PI / 180) *
                    Math.sin(dLon / 2) * Math.sin(dLon / 2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                const distance = R * c;
                return distance <= radius;
            });
        }

        res.json({ items });
    } catch (error) {
        console.error('Failed to get marketplace items:', error);
        res.status(500).json({ error: 'Failed to fetch items' });
    }
};

export const createItem = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user!.userId;
        const data = createItemSchema.parse(req.body);

        const item = await prisma.marketplaceItem.create({
            data: {
                ...data,
                sellerId: userId
            },
            include: { seller: { select: { id: true, username: true, displayName: true, profileImageUrl: true, isVerified: true } } }
        });

        res.status(201).json(item);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: error.errors });
            return;
        }
        console.error('Failed to create marketplace item:', error);
        res.status(500).json({ error: 'Failed to create item' });
    }
};

export const updateItemStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = req.params.id as string;
        const { status } = req.body;
        const userId = (req as any).user!.userId;

        const item = await prisma.marketplaceItem.findUnique({ where: { id } });

        if (!item) {
            res.status(404).json({ error: 'Item not found' });
            return;
        }

        if (item.sellerId !== userId) {
            res.status(403).json({ error: 'Not authorized to update this item' });
            return;
        }

        const updatedItem = await prisma.marketplaceItem.update({
            where: { id },
            data: { status },
            include: { seller: { select: { id: true, username: true, displayName: true, profileImageUrl: true, isVerified: true } } }
        });

        res.json(updatedItem);
    } catch (error) {
        console.error('Failed to update marketplace item:', error);
        res.status(500).json({ error: 'Failed to update item' });
    }
};

export const deleteItem = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = req.params.id as string;
        const userId = (req as any).user!.userId;

        const item = await prisma.marketplaceItem.findUnique({ where: { id } });

        if (!item) {
            res.status(404).json({ error: 'Item not found' });
            return;
        }

        if (item.sellerId !== userId && !(req as any).user!.roles.includes('app-admin')) {
            res.status(403).json({ error: 'Not authorized to delete this item' });
            return;
        }

        await prisma.marketplaceItem.delete({ where: { id } });

        res.json({ success: true });
    } catch (error) {
        console.error('Failed to delete marketplace item:', error);
        res.status(500).json({ error: 'Failed to delete item' });
    }
};
