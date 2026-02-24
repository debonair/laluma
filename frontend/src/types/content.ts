export interface Content {
    id: string;
    title: string;
    body: string;
    excerpt?: string;
    category: string;
    authorName?: string;
    thumbnailUrl?: string;
    videoUrl?: string;
    videoDuration?: number;
    discountCode?: string;
    discountValue?: string;
    eventDate?: string;
    eventLocation?: string;
    latitude?: number;
    longitude?: number;
    contentType: 'article' | 'video' | 'mixed' | 'event' | 'promotion';
    isPremium: boolean;
    premiumTier?: 'premium' | 'premium_plus';
    isFeatured: boolean;
    viewCount: number;
    likesCount: number;
    commentsCount: number;
    bookmarksCount: number;
    publishedAt?: string;
    createdAt: string;
    hasAccess?: boolean; // Frontend specific
}

export interface ContentResponse {
    content: Content[];
    pagination: {
        total: number;
        limit: number;
        offset: number;
        hasMore: boolean;
    };
}
