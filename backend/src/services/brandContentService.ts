import prisma from '../utils/prisma';
import { BrandContentStatus } from '@prisma/client';

export interface CreateBrandContentData {
  partnerId: string;
  title: string;
  content: string;
  imageUrl?: string;
  discountCode?: string;
}

/**
 * Gets the number of active (Pending or Revision Requested) submissions for a partner.
 */
export const getActiveSubmissionCount = async (partnerId: string): Promise<number> => {
  return await prisma.brandContent.count({
    where: {
      partnerId,
      status: {
        in: [BrandContentStatus.PENDING, BrandContentStatus.IN_REVIEW, BrandContentStatus.REVISION_REQUESTED],
      },
    },
  });
};

/**
 * Creates or updates a content draft for a brand partner.
 */
export const saveDraft = async (id: string | undefined, data: CreateBrandContentData) => {
  if (id) {
    return await prisma.brandContent.update({
      where: { id },
      data: {
        ...data,
        status: BrandContentStatus.DRAFT,
      },
    });
  }

  return await prisma.brandContent.create({
    data: {
      ...data,
      status: BrandContentStatus.DRAFT,
    },
  });
};

/**
 * Submits a draft for editorial review.
 * Enforces a quota of max 2 active submissions per partner.
 */
export const submitForReview = async (id: string, partnerId: string) => {
  const activeSubmissionsCount = await prisma.brandContent.count({
    where: {
      partnerId,
      status: {
        in: [BrandContentStatus.PENDING, BrandContentStatus.REVISION_REQUESTED],
      },
    },
  });

  if (activeSubmissionsCount >= 2) {
    throw new Error('QUOTA_EXCEEDED');
  }

  return await prisma.brandContent.update({
    where: { id, partnerId },
    data: {
      status: BrandContentStatus.PENDING,
    },
  });
};

/**
 * Gets all content for a specific partner.
 */
export const getPartnerContent = async (partnerId: string) => {
  return await prisma.brandContent.findMany({
    where: { partnerId },
    orderBy: { updatedAt: 'desc' },
  });
};

/**
 * Gets the list of all content pending review (Editorial view).
 */
export const getEditorialQueue = async () => {
  return await prisma.brandContent.findMany({
    where: { status: BrandContentStatus.PENDING },
    include: {
      partner: {
        select: {
          companyName: true,
          logoUrl: true,
          category: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });
};

/**
 * Updates the status of a content submission by an editor.
 */
export const reviewContent = async (id: string, status: BrandContentStatus, editorialNotes?: string) => {
  return await prisma.brandContent.update({
    where: { id },
    data: {
      status,
      editorialNotes,
    },
  });
};

/**
 * Aggregates performance analytics for a brand partner.
 */
export const getPartnerAnalytics = async (partnerId: string, userId: string) => {
  const [contentStats, submissionCounts] = await Promise.all([
    // Aggregate engagement from published Content
    prisma.content.aggregate({
      where: { authorId: userId },
      _sum: {
        viewCount: true,
        likesCount: true,
        commentsCount: true,
      }
    }),
    // Count submissions by status
    prisma.brandContent.groupBy({
      by: ['status'],
      where: { partnerId },
      _count: true,
    })
  ]);

  // Format submission counts into a simpler object
  const submissions = {
    total: submissionCounts.reduce((acc, curr) => acc + curr._count, 0),
    pending: submissionCounts.find(s => s.status === 'PENDING')?._count || 0,
    approved: submissionCounts.find(s => s.status === 'APPROVED')?._count || 0,
    drafts: submissionCounts.find(s => s.status === 'DRAFT')?._count || 0,
  };

  return {
    views: contentStats._sum.viewCount || 0,
    likes: contentStats._sum.likesCount || 0,
    comments: contentStats._sum.commentsCount || 0,
    submissions,
  };
};
