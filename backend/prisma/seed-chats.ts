import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('💬 Seeding conversations and messages...');

    // Fetch existing users
    const sarah = await prisma.user.findUnique({ where: { username: 'sarah' } });
    const emily = await prisma.user.findUnique({ where: { username: 'emily' } });
    const maya = await prisma.user.findUnique({ where: { username: 'maya' } });
    const chloe = await prisma.user.findUnique({ where: { username: 'chloe' } });

    if (!sarah || !emily || !maya || !chloe) {
        console.error('❌ Could not find seeded users. Please run npm run seed first.');
        return;
    }

    const chatData = [
        {
            participants: [sarah.id, emily.id],
            messages: [
                { senderId: emily.id, content: "Hey Sarah! How's the little one doing?", delay: 86400000 * 2 }, // 2 days ago
                { senderId: sarah.id, content: "He's good! Finally slept for a 4-hour stretch last night. Total game changer.", delay: 86400000 * 1.9 },
                { senderId: emily.id, content: "That's huge! I remember that first 4-hour stretch. It feels like a vacation.", delay: 86400000 * 1.8 },
                { senderId: emily.id, content: "Are you coming to the stroller walk on Sunday?", delay: 86400000 * 1.7 },
                { senderId: sarah.id, content: "Yes! If I can get out of the house on time. 😂", delay: 86400000 * 1.6 },
                { senderId: emily.id, content: "Haha, I'll bring the extra strong coffee then!", delay: 86400000 * 1.5 },
            ]
        },
        {
            participants: [sarah.id, maya.id],
            messages: [
                { senderId: sarah.id, content: "Hi Maya, I saw your post about the Ferber method. Do you have a specific schedule you followed?", delay: 86400000 * 3 },
                { senderId: maya.id, content: "Hi! Yes, I used the 5-10-15 minute intervals. It was tough the first two nights but really smoothed out after that.", delay: 86400000 * 2.9 },
                { senderId: sarah.id, content: "Did you find the baby got more worked up when you went in?", delay: 86400000 * 2.8 },
                { senderId: maya.id, content: "Sometimes, yes. The key for us was staying only for 1-2 minutes and not picking her up. Just a pat and some 'shushing'.", delay: 86400000 * 2.7 },
                { senderId: sarah.id, content: "Okay, I'm going to try that tonight. Wish me luck!", delay: 86400000 * 2.6 },
            ]
        },
        {
            participants: [chloe.id, sarah.id],
            messages: [
                { senderId: chloe.id, content: "Hey! I'm Chloe, I just moved to the neighborhood. I see our babies are about the same age!", delay: 86400000 * 0.5 },
                { senderId: sarah.id, content: "Welcome Chloe! Yes, my son is 4 months. How about yours?", delay: 86400000 * 0.4 },
                { senderId: chloe.id, content: "Mine is 3 months! Would love to grab a coffee sometime once I'm unpacked.", delay: 86400000 * 0.3 },
            ]
        }
    ];

    for (const chat of chatData) {
        // Find or create conversation
        let conversation = await prisma.conversation.findFirst({
            where: {
                participants: {
                    every: {
                        userId: { in: chat.participants }
                    }
                }
            }
        });

        if (!conversation) {
            conversation = await prisma.conversation.create({
                data: {
                    participants: {
                        create: chat.participants.map(userId => ({ userId }))
                    }
                }
            });
            console.log(`✅ Created conversation between ${chat.participants.length} users`);
        }

        // Add messages
        for (const msg of chat.messages) {
            const createdAt = new Date(Date.now() - msg.delay);
            await prisma.message.create({
                data: {
                    conversationId: conversation.id,
                    senderId: msg.senderId,
                    content: msg.content,
                    createdAt,
                    isRead: true
                }
            });
        }
        
        // Update conversation's updatedAt to the last message time
        await prisma.conversation.update({
            where: { id: conversation.id },
            data: { updatedAt: new Date() }
        });
    }

    console.log('✅ Chat seed complete!');
}

main()
    .catch((e) => {
        console.error('❌ Chat seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
