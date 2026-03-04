export const containsBlockedKeywords = (text: string): boolean => {
    if (!text) return false;

    // Load from environment or use a reasonable default list built for safety
    const rawKeywords = process.env.BLOCKLIST_KEYWORDS || 'abuse,scam,spam,illegal';

    const keywords = rawKeywords
        .split(',')
        .map(k => k.trim().toLowerCase())
        .filter(k => k.length > 0);

    if (keywords.length === 0) return false;

    const escapeRegExp = (string: string) => {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };

    for (const keyword of keywords) {
        // Using \b ensures we match whole words, not partial overlaps.
        // e.g. "ass" won't block "glass".
        const regex = new RegExp(`\\b${escapeRegExp(keyword)}\\b`, 'i');
        if (regex.test(text)) {
            return true;
        }
    }

    return false;
};
