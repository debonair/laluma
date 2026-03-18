import { vi, beforeEach } from 'vitest';

export const prismaMock = {
    user: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        findMany: vi.fn(),
    },
    group: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        count: vi.fn(),
    },
    groupMember: {
        findUnique: vi.fn(),
        create: vi.fn(),
        delete: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn()
    },
    connection: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    },
    notification: {
        create: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
    },
    post: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn()
    },
    comment: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn()
    },
    postLike: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn()
    },
    commentLike: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn()
    },
    content: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
    },
    subscription: {
        findUnique: vi.fn(),
    },
    contentLike: {
        findUnique: vi.fn(),
        create: vi.fn(),
        delete: vi.fn(),
    },
    contentBookmark: {
        findUnique: vi.fn(),
        create: vi.fn(),
        delete: vi.fn(),
        findMany: vi.fn(),
    },
    systemStatus: {
        findFirst: vi.fn(),
        create: vi.fn(),
        updateMany: vi.fn(),
    },
    poll: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
    },
    pollVote: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        upsert: vi.fn(),
    },
    $transaction: vi.fn((val) => Promise.resolve(val))
};

vi.mock('../utils/prisma', () => {
    return {
        default: prismaMock,
        __esModule: true
    };
});

vi.mock('../db', () => {
    return {
        prisma: prismaMock,
        __esModule: true
    };
});

beforeEach(() => {
    vi.clearAllMocks();
});
