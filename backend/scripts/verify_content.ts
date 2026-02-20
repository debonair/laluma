
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const userCount = await prisma.user.count();
        console.log(`Users: ${userCount}`);

        // Find or create a user for authorship
        let author = await prisma.user.findFirst();
        if (!author) {
            console.log('No users found. Creating a test author...');
            author = await prisma.user.create({
                data: {
                    email: 'author@example.com',
                    passwordHash: 'hashed_password_placeholder', // Only needed if logging in as author
                    username: 'test_author',
                    displayName: 'Test Author'
                }
            });
        }

        const contentCount = await prisma.content.count();
        console.log(`Content items: ${contentCount}`);

        const premiumContent = await prisma.content.findFirst({ where: { isPremium: true } });
        const freeContent = await prisma.content.findFirst({ where: { isPremium: false } });

        if (!freeContent) {
            console.log('Creating free content...');
            await prisma.content.create({
                data: {
                    title: 'Free Article for Testing',
                    body: 'This is a free article. Everyone should be able to see this content.',
                    excerpt: 'A free article accessible to everyone.',
                    category: 'General',
                    contentType: 'article',
                    isPremium: false,
                    status: 'approved',
                    authorId: author.id
                }
            });
            console.log('Created free content.');
        } else {
            console.log('Free content exists.');
        }

        if (!premiumContent) {
            console.log('Creating premium content...');
            await prisma.content.create({
                data: {
                    title: 'Premium Article for Testing',
                    body: 'This is premium content. Only subscribers should see this.',
                    excerpt: 'Exclusive premium content. Subscribe to read more.',
                    category: 'Exclusive',
                    contentType: 'article',
                    isPremium: true,
                    premiumTier: 'premium',
                    status: 'approved',
                    authorId: author.id
                }
            });
            console.log('Created premium content.');
        } else {
            console.log('Premium content exists.');
        }

    } catch (error) {
        console.error('Error verifying content:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
