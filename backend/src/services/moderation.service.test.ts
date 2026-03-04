import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { containsBlockedKeywords } from './moderation.service';

describe('Moderation Service', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        vi.resetModules();
        process.env = { ...originalEnv };
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    it('returns false for empty text', () => {
        expect(containsBlockedKeywords('')).toBe(false);
    });

    it('returns true when a default blocked keyword is found', () => {
        expect(containsBlockedKeywords('This is a scam right here')).toBe(true);
    });

    it('returns false when no blocked keywords are found', () => {
        expect(containsBlockedKeywords('This is a wonderful, safe community post.')).toBe(false);
    });

    it('respects word boundaries so partial matches are ignored', () => {
        // "spam" is blocked, but "spamp" (if it were a word) shouldn't be blocked just by default \b bounds.
        // Let's test with a custom list.
        process.env.BLOCKLIST_KEYWORDS = 'ass';
        // "glass" shouldn't trigger "ass"
        expect(containsBlockedKeywords('She drank from the glass')).toBe(false);
        // "ass" should trigger it
        expect(containsBlockedKeywords('You are an ass')).toBe(true);
    });

    it('is case-insensitive', () => {
        process.env.BLOCKLIST_KEYWORDS = 'BaDwOrD';
        expect(containsBlockedKeywords('This is a badword')).toBe(true);
        expect(containsBlockedKeywords('This is a BADWORD')).toBe(true);
        expect(containsBlockedKeywords('This is a BAdwORd')).toBe(true);
    });

    it('handles multiple comma-separated keywords from env', () => {
        process.env.BLOCKLIST_KEYWORDS = 'apple,banana,orange';
        expect(containsBlockedKeywords('I like to eat a banana')).toBe(true);
        expect(containsBlockedKeywords('I like an apple')).toBe(true);
        expect(containsBlockedKeywords('I like a grape')).toBe(false);
    });

    it('handles spaces in env variable gracefully', () => {
        process.env.BLOCKLIST_KEYWORDS = ' apple ,  banana  , orange ';
        expect(containsBlockedKeywords('I like to eat a banana')).toBe(true);
    });
});
