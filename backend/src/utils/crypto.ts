import crypto from 'crypto';

// The key should be a 32-byte (64 char hex) string for aes-256-gcm
// In production, ANONYMOUS_ENCRYPTION_KEY MUST be set
const getEncryptionKey = (): string => {
    const key = process.env.ANONYMOUS_ENCRYPTION_KEY;
    if (!key) {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('ANONYMOUS_ENCRYPTION_KEY environment variable must be set in production');
        }
        // Fallback for development only
        console.warn('[CRYPTO] ANONYMOUS_ENCRYPTION_KEY not set, using random key. Anonymous identities will not persist across restarts in dev.');
        return crypto.randomBytes(32).toString('hex');
    }
    return key;
};

const ENCRYPTION_KEY = getEncryptionKey();

// 12 bytes is standard for GCM
const IV_LENGTH = 12;

/**
 * Encrypts a string (e.g. userId) using AES-256-GCM.
 * Returns a payload consisting of iv:authTag:encryptedHex.
 * @param text The string to encrypt.
 */
export const encryptIdentity = (text: string): string => {
    if (!text) return text;

    const key = Buffer.from(ENCRYPTION_KEY, 'hex');

    if (key.length !== 32) {
        throw new Error('Encryption key must be exactly 32 bytes (64 hex characters).');
    }

    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag().toString('hex');

    // Combine IV, Auth Tag, and Encrypted Payload
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
};

/**
 * Decrypts a string that was encrypted by `encryptIdentity`.
 * @param encryptedText The string formatted as iv:authTag:encryptedHex.
 */
export const decryptIdentity = (encryptedText: string): string => {
    if (!encryptedText) return encryptedText;

    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
        throw new Error('Invalid encrypted identity format.');
    }

    const [ivHex, authTagHex, encryptedDataHex] = parts;

    const key = Buffer.from(ENCRYPTION_KEY, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedDataHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
};
