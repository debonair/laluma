
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting Sprint 5 Verification...');

    // 1. Create a User
    const email = `sprint5_${Date.now()}@test.com`;
    const user = await prisma.user.create({
        data: {
            username: `sprint5_user_${Date.now()}`,
            email,
            passwordHash: 'hashed_password', // Dummy hash
        }
    });
    console.log(`Created user: ${user.username}`);

    // 2. Create Premium Content
    const content = await prisma.content.create({
        data: {
            title: 'Premium Article',
            body: 'This is exclusive premium content.',
            category: 'Tech',
            isPremium: true,
            premiumTier: 'premium',
            status: 'approved',
            isActive: true,
            authorId: user.id // Self-authored for simplicity, but logic checks viewer
        }
    });
    console.log(`Created premium content: ${content.title}`);

    // 3. Verify Access (Free Tier)
    // We simulate the controller logic here by querying subscription
    let subscription = await prisma.subscription.findUnique({ where: { userId: user.id } });
    let tier = subscription?.status === 'active' ? subscription.tier : 'free';

    let hasAccess = !content.isPremium;
    if (content.isPremium) {
        if (content.premiumTier === 'premium_plus') hasAccess = tier === 'premium_plus';
        else hasAccess = tier === 'premium' || tier === 'premium_plus';
    }

    if (!hasAccess) {
        console.log('✅ Access denied for free user (Expected)');
    } else {
        console.error('❌ Access GRANTED for free user (Unexpected)');
        process.exit(1);
    }

    // 4. Upgrade User
    await prisma.subscription.upsert({
        where: { userId: user.id },
        update: { tier: 'premium', status: 'active' },
        create: {
            userId: user.id,
            tier: 'premium',
            status: 'active'
        }
    });
    console.log('Upgraded user to Premium');

    // 5. Verify Access (Premium Tier)
    subscription = await prisma.subscription.findUnique({ where: { userId: user.id } });
    tier = subscription?.status === 'active' ? subscription.tier : 'free';

    hasAccess = !content.isPremium;
    if (content.isPremium) {
        if (content.premiumTier === 'premium_plus') hasAccess = tier === 'premium_plus';
        else hasAccess = tier === 'premium' || tier === 'premium_plus';
    }

    if (hasAccess) {
        console.log('✅ Access granted for premium user (Expected)');
    } else {
        console.error('❌ Access DENIED for premium user (Unexpected)');
        process.exit(1);
    }

    // Cleanup
    await prisma.content.delete({ where: { id: content.id } });
    await prisma.subscription.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
    console.log('Cleanup complete.');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
