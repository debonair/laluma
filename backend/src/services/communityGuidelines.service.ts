import type { CommunityGuidelines, User } from '@prisma/client';
import prisma from '../utils/prisma';

/**
 * HTML escape function to prevent XSS when content is rendered
 * This provides basic sanitization for stored content
 */
const escapeHtml = (text: string): string => {
    const map: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, char => map[char]);
};

/**
 * Community Guidelines Service
 * Business logic for managing community guidelines versions
 */
export const communityGuidelinesService = {
    /**
     * Create a new version of community guidelines
     * Each publish creates a new version record for audit purposes
     */
    async createGuidelines(data: { content: string; createdBy: string }): Promise<CommunityGuidelines> {
        // Get the latest version number to increment
        const latest = await prisma.communityGuidelines.findFirst({
            orderBy: { version: 'desc' },
        });

        const nextVersion = latest ? latest.version + 1 : 1;

        return prisma.communityGuidelines.create({
            data: {
                content: data.content,
                version: nextVersion,
                publishedAt: new Date(),
                createdBy: data.createdBy,
            },
        });
    },

    /**
     * Get the latest published guidelines (current version)
     */
    async getCurrentGuidelines(): Promise<CommunityGuidelines | null> {
        return prisma.communityGuidelines.findFirst({
            orderBy: { publishedAt: 'desc' },
        });
    },

    /**
     * Get a specific guidelines version by ID
     */
    async getGuidelinesById(id: string): Promise<CommunityGuidelines | null> {
        return prisma.communityGuidelines.findUnique({
            where: { id },
        });
    },

    /**
     * Get all guidelines versions with pagination (for admin)
     */
    async getAllGuidelines(page: number = 1, limit: number = 10): Promise<{
        data: (CommunityGuidelines & { creator?: Pick<User, 'id' | 'username' | 'displayName'> })[];
        total: number;
        page: number;
        totalPages: number;
    }> {
        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            prisma.communityGuidelines.findMany({
                orderBy: { publishedAt: 'desc' },
                skip,
                take: limit,
                include: {
                    creator: {
                        select: {
                            id: true,
                            username: true,
                            displayName: true,
                        },
                    },
                },
            }),
            prisma.communityGuidelines.count(),
        ]);

        return {
            data,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    },

    /**
     * Update an existing guidelines version (draft edit)
     */
    async updateGuidelines(id: string, content: string): Promise<CommunityGuidelines | null> {
        return prisma.communityGuidelines.update({
            where: { id },
            data: { content },
        });
    },
};
