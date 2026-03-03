import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getUploadUrl } from './media.controller';

vi.mock('@aws-sdk/s3-request-presigner', () => {
    return {
        getSignedUrl: vi.fn().mockResolvedValue('https://mock-signed-url.com/uploads/posts/123.jpeg?token=abc')
    };
});

vi.mock('@aws-sdk/client-s3', () => {
    return {
        S3Client: vi.fn(),
        PutObjectCommand: vi.fn()
    };
});

describe('Media Controller', () => {
    let mockReq: any;
    let mockRes: any;

    beforeEach(() => {
        mockReq = { body: {} };
        mockRes = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn()
        };
        vi.clearAllMocks();
    });

    describe('getUploadUrl', () => {
        it('returns 400 if invalid contentType', async () => {
            mockReq.body = { contentType: 'application/pdf', size: 1024, path: 'posts' };

            await getUploadUrl(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
        });

        it('returns 400 if size exceeds 10MB', async () => {
            mockReq.body = { contentType: 'image/jpeg', size: 15 * 1024 * 1024, path: 'posts' };

            await getUploadUrl(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
        });

        it('returns 200 with signed URL and access URL on valid payload', async () => {
            mockReq.body = { contentType: 'image/jpeg', size: 1024, path: 'posts' };

            await getUploadUrl(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                upload_url: 'https://mock-signed-url.com/uploads/posts/123.jpeg?token=abc',
                expires_in: 300,
                object_key: expect.stringMatching(/^uploads\/posts\/.*\.jpeg$/),
                access_url: expect.stringMatching(/.*\.amazonaws\.com\/uploads\/posts\/.*\.jpeg$/)
            }));
        });
    });
});
