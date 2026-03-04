import { generateAnonymousProfile } from './anonymousProfile';

describe('Anonymous Profile Generator', () => {

    it('should generate a mapped Color+Noun display name', () => {
        const profile = generateAnonymousProfile('some-unique-user-id');

        expect(profile).toHaveProperty('displayName');
        expect(profile).toHaveProperty('avatarUrl');

        const parts = profile.displayName.split(' ');
        expect(parts.length).toBe(2);
        expect(profile.avatarUrl).toContain('api.dicebear.com');
    });

    it('should be deterministic for the same identifier', () => {
        const id = '123e4567-e89b-12d3-a456-426614174000';

        const profile1 = generateAnonymousProfile(id);
        const profile2 = generateAnonymousProfile(id);

        expect(profile1.displayName).toBe(profile2.displayName);
        expect(profile1.avatarUrl).toBe(profile2.avatarUrl);
    });

    it('should generate different profiles for different identifiers (high probability)', () => {
        const profile1 = generateAnonymousProfile('user-id-a');
        const profile2 = generateAnonymousProfile('user-id-b');

        // Note: It IS possible for collisions in small lists (20x20=400 combinations)
        // This test assumes A and B don't collision-map.
        expect(profile1.displayName).not.toBe(profile2.displayName);
    });
});
