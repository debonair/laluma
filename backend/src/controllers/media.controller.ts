import { Request, Response } from 'express';
import { z } from 'zod';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';

const uploadRequestSchema = z.object({
    contentType: z.string().regex(/^image\/(jpeg|png|gif|webp)$/, 'Only jpeg, png, gif, and webp images are allowed'),
    size: z.number().max(10 * 1024 * 1024, 'File size must be under 10MB'),
    path: z.enum(['posts', 'comments']).default('posts')
});

const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'dummy',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'dummy'
    },
    // Allows endpoint overrides for localized testing/R2
    endpoint: process.env.AWS_ENDPOINT_URL,
    forcePathStyle: true
});

/**
 * POST /api/media/upload-url
 * Returns a short-lived pre-signed URL to upload an object securely to S3.
 */
export const getUploadUrl = async (req: Request, res: Response): Promise<void> => {
    try {
        const { contentType, path } = uploadRequestSchema.parse(req.body);

        // Extract file extension and build secure key
        const extension = contentType.split('/')[1];
        const uniqueId = crypto.randomUUID();
        const objectKey = `uploads/${path}/${uniqueId}.${extension}`;

        const bucketName = process.env.AWS_BUCKET_NAME || 'luma-uploads';

        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: objectKey,
            ContentType: contentType,
        });

        // Generate URL (valid for 5 minutes)
        const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

        // Build generic access URL based on S3 configurations
        // Often a CDN sits in front, or direct read URL via S3 public bucket logic
        const publicHost = process.env.AWS_PUBLIC_DOMAIN || `https://${bucketName}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com`;
        const accessUrl = process.env.AWS_PUBLIC_DOMAIN ? `${publicHost}/${objectKey}` : `${publicHost}/${objectKey}`;

        res.status(200).json({
            upload_url: uploadUrl,
            access_url: accessUrl,
            object_key: objectKey,
            expires_in: 300
        });

    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Bad Request', code: 'VALIDATION_ERROR', details: error.errors });
            return;
        }
        res.status(500).json({ error: 'Failed to generate upload URL', code: 'S3_PRESIGN_ERROR' });
    }
};
