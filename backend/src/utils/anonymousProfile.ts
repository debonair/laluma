const ADJECTIVES = [
    'Amethyst', 'Azure', 'Crimson', 'Emerald', 'Golden',
    'Indigo', 'Jade', 'Magenta', 'Onyx', 'Ruby',
    'Sapphire', 'Silver', 'Teal', 'Violet', 'Cyan',
    'Coral', 'Amber', 'Copper', 'Cobalt', 'Plum'
];

const NOUNS = [
    'Bear', 'Cat', 'Dog', 'Elephant', 'Fox',
    'Giraffe', 'Hawk', 'Iguana', 'Jaguar', 'Koala',
    'Lion', 'Monkey', 'Owl', 'Panda', 'Rabbit',
    'Tiger', 'Wolf', 'Zebra', 'Dolphin', 'Penguin'
];

/**
 * Generates a consistent but collision-resistant anonymous display name and avatar URL.
 * While randomness works, hashing the identifier ensures the same user in the same thread
 * gets the same anonymous persona, reducing confusion in replies.
 * 
 * @param identifier An application-unique identifier for determinism (e.g. IdentityLinkId)
 */
export const generateAnonymousProfile = (identifier: string) => {
    // Simple hash to map identifier to stable indices
    let hash = 0;
    for (let i = 0; i < identifier.length; i++) {
        hash = (hash << 5) - hash + identifier.charCodeAt(i);
        hash |= 0;
    }

    // Ensure positive hash
    const positiveHash = Math.abs(hash);

    const adjIndex = positiveHash % ADJECTIVES.length;
    // Shift slightly so adj and noun aren't always paired the same way if lists grew identically
    const nounIndex = Math.floor(positiveHash / ADJECTIVES.length) % NOUNS.length;

    const adjective = ADJECTIVES[adjIndex];
    const noun = NOUNS[nounIndex];

    const displayName = `${adjective} ${noun}`;

    // For avatars, we can use a deterministic placeholder service like DiceBear
    // Since we're rendering 'anonymous' on frontend currently per AC, we just provide a distinct URL
    const seed = `${adjective}${noun}`;
    const avatarUrl = `https://api.dicebear.com/7.x/shapes/svg?seed=${seed}&backgroundColor=transparent`;

    return {
        displayName,
        avatarUrl
    };
};
