import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure upload directories exist
const videoDir = './uploads/videos';
const imageDir = './uploads/images';

if (!fs.existsSync(videoDir)) fs.mkdirSync(videoDir, { recursive: true });
if (!fs.existsSync(imageDir)) fs.mkdirSync(imageDir, { recursive: true });

// ─── Video Upload ─────────────────────────────────────────────────────────────

const videoStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, videoDir),
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const videoFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = /mp4|mov|avi|webm|mkv/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = file.mimetype.startsWith('video/');
    if (extname && mimetype) cb(null, true);
    else cb(new Error('Only video files are allowed (mp4, mov, avi, webm, mkv)'));
};

export const videoUpload = multer({
    storage: videoStorage,
    limits: { fileSize: 100 * 1024 * 1024 },
    fileFilter: videoFilter
});

// ─── Image Upload ─────────────────────────────────────────────────────────────

const imageStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, imageDir),
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const imageFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = file.mimetype.startsWith('image/');
    if (extname && mimetype) cb(null, true);
    else cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
};

export const imageUpload = multer({
    storage: imageStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: imageFilter
});
