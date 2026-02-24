import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import crypto from 'crypto';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Helper to execute Keycloak commands
function runKcadm(cmd: string): string {
    const fullCmd = `docker exec luma-keycloak /opt/keycloak/bin/kcadm.sh ${cmd} 2>&1`;
    try {
        return execSync(fullCmd, { encoding: 'utf-8' }).trim();
    } catch (e: any) {
        console.error(`Error running kcadm: ${cmd}`);
        console.error(e.stdout || e.message);
        throw e;
    }
}

async function ensureKeycloakUser(username: string, email: string, firstName: string, lastName: string): Promise<string> {
    const realm = 'luma-realm';

    // Check if user exists
    try {
        const out = runKcadm(`get users -r ${realm} -q username=${username}`);
        const users = JSON.parse(out);
        if (users && users.length > 0) {
            console.log(`Keycloak: User '${username}' already exists. Reseting password...`);
            runKcadm(`set-password -r ${realm} --username ${username} --new-password password123`);
            return users[0].id; // Return existing keycloakId
        }
    } catch (e) {
        console.log(`Failed to fetch user ${username}, assuming they do not exist...`);
    }

    // Create user
    console.log(`Keycloak: Creating user '${username}'...`);
    const createOut = runKcadm(`create users -r ${realm} -s username=${username} -s email=${email} -s enabled=true -s firstName=${firstName} -s lastName=${lastName}`);

    // The output is usually: Created new user with id 'GUID'
    const match = createOut.match(/id '([^']+)'/);
    if (!match) {
        throw new Error(`Failed to parse user ID from output: ${createOut}`);
    }
    const keycloakId = match[1];

    // Set password
    console.log(`Keycloak: Setting password for '${username}' to 'password123'...`);
    runKcadm(`set-password -r ${realm} --username ${username} --new-password password123`);

    return keycloakId;
}

// Same sample content from seed-content.ts
const sampleContent = [
    {
        title: "Understanding Postpartum Depression: Signs and Support",
        body: `Postpartum depression (PPD) affects 1 in 7 new mothers and is more than just "baby blues." It's a serious mental health condition that requires attention and support.\n\n## Common Signs\n- Persistent sadness or low mood\n- Loss of interest in activities you once enjoyed\n- Difficulty bonding with your baby\n- Changes in sleep or appetite\n- Feelings of worthlessness or guilt\n\n## What You Can Do\n1. **Talk to someone**: Reach out to your healthcare provider, a therapist, or a trusted friend\n2. **Join a support group**: Connecting with other mothers can help you feel less alone\n3. **Prioritize self-care**: Even small moments of rest can make a difference\n4. **Ask for help**: Don't hesitate to lean on your support network\n\nRemember, PPD is treatable, and seeking help is a sign of strength, not weakness.`,
        excerpt: "Learn to recognize the signs of postpartum depression and discover resources for support and recovery.",
        category: "Wellness",
        authorName: "Dr. Sarah Johnson",
        isPremium: false,
        isFeatured: true,
        status: "approved",
        publishedAt: new Date('2024-01-15')
    },
    {
        title: "Sleep Training Methods: Finding What Works for Your Family",
        body: `Sleep training is a personal decision, and there's no one-size-fits-all approach. Here's an overview of popular methods to help you make an informed choice.\n\n## Popular Methods\n\n### Cry It Out (CIO)\nPut baby down awake and allow them to self-soothe without intervention.\n**Pros**: Often works quickly\n**Cons**: Can be emotionally difficult for parents\n\n### Ferber Method\nCheck on baby at increasing intervals while they learn to self-soothe.\n**Pros**: Provides reassurance while teaching independence\n**Cons**: Requires consistency and patience\n\nTrust your instincts and choose what feels right for your family.`,
        excerpt: "Explore different sleep training methods and find the approach that works best for your family.",
        category: "Parenting",
        authorName: "Sleep Consultant Emma Thompson",
        isPremium: true,
        premiumTier: "premium",
        isFeatured: false,
        status: "approved",
        publishedAt: new Date('2024-02-01')
    },
    {
        title: "Mommy & Me Yoga in the Park",
        body: `Join us for a relaxing and rejuvenating yoga session designed specifically for mothers and their little ones (ages 0-3). Let's stretch, breathe, and bond in the beautiful outdoors.\n\n## What to Bring\n- A yoga mat (or two!)\n- Water bottle\n- Sunscreen and hats\n- Snacks for the little ones\n\nNo prior yoga experience is necessary. This is a judgment-free zone where crying babies and feeding breaks are completely expected and welcomed!`,
        excerpt: "A relaxing outdoor yoga session for mothers and toddlers.",
        category: "Health & Fitness",
        authorName: "Luma Community Team",
        contentType: "event",
        eventDate: new Date('2026-03-15T10:00:00Z'),
        eventLocation: "Centennial Park, Main Lawn",
        isPremium: false,
        isFeatured: true,
        status: "approved",
        publishedAt: new Date('2024-02-15')
    },
    {
        title: "Exclusive: 20% Off All Organic Baby Food at FreshBites",
        body: `We've partnered with FreshBites to bring Luma mothers an exclusive discount on their premium, organic baby food delivery service.\n\nFreshBites sources only the highest quality local organic produce to create nutritious, delicious meals for your growing baby. Their meals are freshly prepared, flash-frozen to lock in nutrients, and delivered straight to your door.\n\n## How to Claim\n1. Visit the FreshBites website\n2. Select your meal plan\n3. Enter the discount code at checkout\n\n*Valid for new customers only on their first month's subscription.*`,
        excerpt: "Get 20% off your first month of premium organic baby food delivery.",
        category: "Nutrition",
        authorName: "Luma Partnerships",
        contentType: "promotion",
        discountCode: "LUMA20MB",
        discountValue: "20% Off",
        sponsorName: "FreshBites",
        isPremium: false,
        isFeatured: true,
        status: "approved",
        publishedAt: new Date('2024-02-10')
    }
];

async function main() {
    console.log('🌱 Starting universal seed (Keycloak + Prisma)...');

    // 1. Authenticate kcadm.sh as admin
    console.log('Logging into Keycloak Admin CLI...');
    runKcadm('config credentials --server http://localhost:8080 --realm master --user admin --password admin');

    // 2. Synchronize Users
    const usersData = [
        { username: 'admin', email: 'admin@luma.com', first: 'Luma', last: 'Admin', bio: 'Platform Administrator', stage: 'Toddler', role: 'admin' },
        { username: 'sarah', email: 'sarah@luma.com', first: 'Sarah', last: 'Miller', bio: 'First time mom finding her way!', stage: 'Newborn', role: 'user' },
        { username: 'emily', email: 'emily@luma.com', first: 'Emily', last: 'Chen', bio: 'Mom of two, coffee enthusiast.', stage: 'Pre-school', role: 'user' }
    ];

    const seededUsers = [];
    for (const u of usersData) {
        const kcId = await ensureKeycloakUser(u.username, u.email, u.first, u.last);

        let dbUser = await prisma.user.findUnique({ where: { username: u.username } });
        if (!dbUser) {
            dbUser = await prisma.user.create({
                data: {
                    keycloakId: kcId,
                    username: u.username,
                    email: u.email,
                    displayName: `${u.first} ${u.last}`,
                    aboutMe: u.bio,
                    motherhoodStage: u.stage,
                    role: u.role,
                    passwordHash: await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10), // Unused mock
                    preferences: {
                        create: { lookingFor: ['Friends', 'Advice'], locationRadius: 50, locationAnywhere: false }
                    }
                }
            });
            console.log(`✅ Synced User to Prisma: ${u.username}`);
        } else {
            console.log(`ℹ️ User already seeded in Prisma: ${u.username}`);
            // Ensure keycloak ID and role are perfectly matched in case of a re-seed via wipe
            if (dbUser.keycloakId !== kcId || dbUser.role !== u.role) {
                dbUser = await prisma.user.update({
                    where: { id: dbUser.id },
                    data: { keycloakId: kcId, role: u.role }
                });
                console.log(`✅ Updated User role/ID in Prisma: ${u.username}`);
            }
        }
        seededUsers.push(dbUser);
    }

    const [admin, sarah, emily] = seededUsers;

    // 3. Seed Groups
    const groupName = "New Moms Support Group";
    let group = await prisma.group.findUnique({ where: { name: groupName } });

    if (!group) {
        group = await prisma.group.create({
            data: {
                name: groupName,
                description: "A safe space for new mothers to ask questions, share milestones, and support each other.",
                imageEmoji: "👶",
                createdById: admin.id,
                memberCount: 3,
                members: {
                    create: [
                        { userId: admin.id, role: 'admin' },
                        { userId: sarah.id, role: 'member' },
                        { userId: emily.id, role: 'moderator' }
                    ]
                }
            }
        });
        console.log(`✅ Created Group: ${groupName}`);

        // Seed Posts inside the Group
        const post1 = await prisma.post.create({
            data: {
                groupId: group.id,
                authorId: sarah.id,
                content: "Is anyone else's baby struggling to sleep through the night at 4 months?",
                likesCount: 1,
                commentsCount: 1,
                likes: { create: [{ userId: emily.id }] }
            }
        });

        await prisma.comment.create({
            data: {
                postId: post1.id,
                authorId: emily.id,
                content: "Yes! 4-month sleep regression is so real. Hang in there, it passes in a few weeks!"
            }
        });
        console.log(`✅ Created Group Posts and Comments`);
    } else {
        console.log(`ℹ️ Group already seeded: ${groupName}`);
    }

    // 4. Seed DM Conversation (Sarah <-> Emily)
    const existingConvos = await prisma.conversationParticipant.findMany({
        where: { userId: sarah.id },
        include: { conversation: { include: { participants: true } } }
    });

    const hasDM = existingConvos.some(cp => cp.conversation.participants.some(p => p.userId === emily.id));

    if (!hasDM) {
        await prisma.conversation.create({
            data: {
                participants: {
                    create: [{ userId: sarah.id }, { userId: emily.id }]
                },
                messages: {
                    create: [
                        { content: "Hey Emily! Thanks for the comment on my post earlier today.", senderId: sarah.id, isRead: true },
                        { content: "Of course! Sleep deprivation is the hardest part. Are you trying any specific methods?", senderId: emily.id, isRead: true },
                        { content: "Just establishing a routine for now. Do you have time for coffee later this week?", senderId: sarah.id, isRead: false },
                    ]
                }
            }
        });
        console.log(`✅ Created Direct Message Conversation (Sarah ↔ Emily)`);
    } else {
        console.log(`ℹ️ DM Conversation already seeded.`);
    }

    // 5. Seed Static Content (Articles)
    for (const content of sampleContent) {
        const existing = await prisma.content.findFirst({ where: { title: content.title } });
        if (!existing) {
            await prisma.content.create({ data: { ...content, authorId: admin.id } });
            console.log(`✅ Created Content Article: ${content.title}`);
        } else {
            console.log(`ℹ️ Content previously seeded: ${content.title}`);
        }
    }

    console.log('\n======================================================');
    console.log('✨ Seed completed successfully!');
    console.log('You can now log in using the following test credentials:');
    console.log('------------------------------------------------------');
    console.log('👤 Standard User 1 (Mothers):');
    console.log('   Email/Username: sarah');
    console.log('   Password:       password123');
    console.log('------------------------------------------------------');
    console.log('👤 Standard User 2:');
    console.log('   Email/Username: emily');
    console.log('   Password:       password123');
    console.log('------------------------------------------------------');
    console.log('🛡️  Admin User (Platform testing):');
    console.log('   Email/Username: admin');
    console.log('   Password:       password123');
    console.log('======================================================\n');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
