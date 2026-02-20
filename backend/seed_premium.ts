
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding Premium Content...');

    const passwordHash = await hash('password123', 10);

    // 1. Create Free User
    const user = await prisma.user.upsert({
        where: { email: 'free_user@test.com' },
        update: {},
        create: {
            username: 'free_user',
            email: 'free_user@test.com',
            passwordHash,
            displayName: 'Free User'
        }
    });

    // Ensure no subscription
    await prisma.subscription.deleteMany({ where: { userId: user.id } });
    console.log('Created/Reset free_user@test.com');

    // 2. Create Premium Content
    const content = await prisma.content.create({
        data: {
            title: 'The Future of Motherhood Technology',
            body: '<p>This is a premium article discussing the latest trends in femtech and motherhood support tools.</p><p>It contains exclusive insights not available to free users.</p>',
            excerpt: 'Exclusive insights into the future of motherhood tech.',
            category: 'Tech',
            isPremium: true,
            premiumTier: 'premium',
            status: 'approved',
            isActive: true,
            authorId: user.id // Self-authored for simplicity
        }
    });
    console.log(`Created premium content: ${content.title} (ID: ${content.id})`);

    console.log('Done.');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
