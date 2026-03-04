import { encryptIdentity, decryptIdentity } from './crypto';

describe('Crypto Utility Service', () => {

    it('should successfully encrypt and decrypt a valid string', () => {
        const originalText = '123e4567-e89b-12d3-a456-426614174000'; // Mock UUID

        const encrypted = encryptIdentity(originalText);

        expect(encrypted).toBeDefined();
        expect(encrypted).not.toEqual(originalText);
        expect(encrypted.split(':').length).toBe(3); // format check

        const decrypted = decryptIdentity(encrypted);
        expect(decrypted).toEqual(originalText);
    });

    it('should throw an error on tampered data', () => {
        const originalText = 'some-secret-id';
        const encrypted = encryptIdentity(originalText);

        const parts = encrypted.split(':');
        // Modify the payload slightly
        parts[2] = parts[2].replace(/[0-9a-f]/, 'f');
        const tampered = parts.join(':');

        expect(() => {
            decryptIdentity(tampered);
        }).toThrow();
    });

    it('should return empty/null if fed empty/null', () => {
        expect(encryptIdentity('')).toBe('');
        // @ts-ignore - testing runtime safety
        expect(encryptIdentity(null)).toBe(null);

        expect(decryptIdentity('')).toBe('');
        // @ts-ignore
        expect(decryptIdentity(undefined)).toBe(undefined);
    });

    it('should throw on completely invalid format when decrypting', () => {
        expect(() => {
            decryptIdentity('not-even-hex-or-parts');
        }).toThrow('Invalid encrypted identity format.');
    });
});
