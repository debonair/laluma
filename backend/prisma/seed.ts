import { PrismaClient, UserRole, EventStatus, RegistrationStatus } from '@prisma/client';
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
        console.warn(`Warning: Keycloak command failed (is Docker running?): ${cmd}`);
        // If Keycloak fails, we return a mock ID so the Prisma seeding can still attempt to proceed
        return `mock-kc-id-${crypto.randomBytes(4).toString('hex')}`;
    }
}

async function ensureKeycloakUser(username: string, email: string, firstName: string, lastName: string): Promise<string> {
    const realm = 'luma-realm';

    // Check if user exists
    try {
        const out = runKcadm(`get users -r ${realm} -q username=${username}`);
        if (out.startsWith('mock-kc-id')) return out;
        
        const users = JSON.parse(out);
        if (users && users.length > 0) {
            console.log(`Keycloak: User '${username}' already exists. Reseting password...`);
            runKcadm(`set-password -r ${realm} --username ${username} --new-password password123`);
            return users[0].id;
        }
    } catch (e) {
        console.log(`Failed to fetch user ${username}, assuming they do not exist...`);
    }

    // Create user
    console.log(`Keycloak: Creating user '${username}'...`);
    const createOut = runKcadm(`create users -r ${realm} -s username=${username} -s email=${email} -s enabled=true -s firstName=${firstName} -s lastName=${lastName}`);
    
    if (createOut.startsWith('mock-kc-id')) return createOut;

    const match = createOut.match(/id '([^']+)'/);
    if (!match) {
        return `mock-kc-id-${crypto.randomBytes(4).toString('hex')}`;
    }
    const keycloakId = match[1];

    console.log(`Keycloak: Setting password for '${username}' to 'password123'...`);
    runKcadm(`set-password -r ${realm} --username ${username} --new-password password123`);

    return keycloakId;
}

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
        body: `We've partnered with FreshBites to bring Luma mothers an exclusive discount on their premium, organic baby food delivery service.\n\nFreshBites sources only the highest quality local organic produce to create nutritious, delicious meals for your growing baby.\n\n## How to Claim\n1. Visit the FreshBites website\n2. Select your meal plan\n3. Enter the discount code at checkout\n\n*Valid for new customers only on their first month's subscription.*`,
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
        { username: 'admin', email: 'admin@luma.com', first: 'Luma', last: 'Admin', bio: 'Platform Administrator', stage: 'Toddler', role: UserRole.admin },
        { username: 'sarah', email: 'sarah@luma.com', first: 'Sarah', last: 'Miller', bio: 'First time mom finding her way!', stage: 'Newborn', role: UserRole.member },
        { username: 'emily', email: 'emily@luma.com', first: 'Emily', last: 'Chen', bio: 'Mom of two, coffee enthusiast.', stage: 'Pre-school', role: UserRole.member },
        { username: 'chloe', email: 'chloe@luma.com', first: 'Chloe', last: 'Davis', bio: 'Nature lover and new mom.', stage: 'Newborn', role: UserRole.member },
        { username: 'maya', email: 'maya@luma.com', first: 'Maya', last: 'Patel', bio: 'Passionate about gentle parenting.', stage: 'Toddler', role: UserRole.moderator },
        { username: 'olivia', email: 'olivia@luma.com', first: 'Olivia', last: 'Wilson', bio: 'Writer and educator.', stage: 'Pre-school', role: UserRole.editorial },
        { username: 'brand_partner', email: 'partner@freshbites.com', first: 'Fresh', last: 'Bites', bio: 'Organic baby food for your little ones.', stage: 'N/A', role: UserRole.brand_partner },
    ];

    const seededUsers = [];
    for (const u of usersData) {
        const kcId = await ensureKeycloakUser(u.username, u.email, u.first, u.last);

        let dbUser = await prisma.user.findUnique({ where: { username: u.username } });
        const passwordHash = await bcrypt.hash('password123', 10);

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
                    passwordHash,
                    hasCompletedOnboarding: true,
                    preferences: {
                        create: { lookingFor: ['Friends', 'Advice'], locationRadius: 50, locationAnywhere: false }
                    }
                }
            });
            console.log(`✅ Synced User to Prisma: ${u.username}`);
        } else {
            console.log(`ℹ️ User already seeded in Prisma: ${u.username}`);
            dbUser = await prisma.user.update({
                where: { id: dbUser.id },
                data: { keycloakId: kcId, role: u.role }
            });
        }
        seededUsers.push(dbUser);
    }

    const [admin, sarah, emily, chloe, maya, olivia, brandPartner] = seededUsers;

    // 3. Seed Groups
    const groupsData = [
        { name: "New Moms Support Group", description: "A safe space for new mothers to ask questions.", emoji: "👶", creator: admin, type: 'public' },
        { name: "Toddler Tantrum Survivors", description: "Sharing tips and solidarity for the toddler years.", emoji: "😤", creator: maya, type: 'public' },
        { name: "Local Meetups - Seattle", description: "Connecting moms in the PNW.", emoji: "🌲", creator: emily, type: 'public' },
        { name: "Secret Sleep Squad", description: "Private group for sleep training discussions.", emoji: "😴", creator: sarah, type: 'private' },
    ];

    for (const g of groupsData) {
        const otherMembers = [sarah, emily, chloe].filter(u => u.id !== g.creator.id);
        
        const group = await prisma.group.upsert({
            where: { name: g.name },
            update: {
                memberCount: 1 + (otherMembers?.length || 0),
            },
            create: {
                name: g.name,
                description: g.description,
                imageEmoji: g.emoji,
                createdById: g.creator.id,
                isPrivate: g.type === 'private',
                memberCount: 1 + (otherMembers?.length || 0),
                members: {
                    create: [
                        { userId: g.creator.id, role: 'admin' },
                        ...otherMembers.map(u => ({ userId: u.id, role: 'member' as const }))
                    ]
                }
            }
        });
        console.log(`✅ Upserted Group: ${g.name}`);

        // Seed Posts in groups (Idempotent)
        const welcomeContent = `Welcome to the ${g.name}! So glad to have everyone here.`;
        const existingWelcome = await prisma.post.findFirst({ where: { groupId: group.id, content: welcomeContent } });
        if (!existingWelcome) {
            await prisma.post.create({
                data: {
                    groupId: group.id,
                    authorId: g.creator.id,
                    content: welcomeContent,
                    likes: { create: [{ userId: sarah.id }, { userId: emily.id }] },
                    likesCount: 2
                }
            });
        }

        if (g.name === "New Moms Support Group") {
            const supportContent = "Has anyone tried the Ferber method? Day 3 and I'm exhausted.";
            let supportPost = await prisma.post.findFirst({ where: { groupId: group.id, content: supportContent } });
            if (!supportPost) {
                supportPost = await prisma.post.create({
                    data: {
                        groupId: group.id,
                        authorId: sarah.id,
                        content: supportContent,
                        commentsCount: 3
                    }
                });
            }

            const existingComment = await prisma.comment.findFirst({ where: { postId: supportPost.id, content: "It works! Stay strong." } });
            if (!existingComment) {
                await prisma.comment.create({
                    data: {
                        postId: supportPost.id,
                        authorId: emily.id,
                        content: "It works! Stay strong.",
                        replies: {
                            create: {
                                authorId: sarah.id,
                                content: "Thanks for the encouragement!",
                                postId: supportPost.id
                            }
                        }
                    }
                });

                await prisma.comment.create({
                    data: {
                        postId: supportPost.id,
                        authorId: maya.id,
                        content: "Every baby is different, trust your gut."
                    }
                });
            }

            // Add a poll
            const pollContent = "Quick poll: What's your biggest challenge right now?";
            const existingPoll = await prisma.post.findFirst({ where: { groupId: group.id, content: pollContent } });
            if (!existingPoll) {
                await prisma.post.create({
                    data: {
                        groupId: group.id,
                        authorId: maya.id,
                        content: pollContent,
                        poll: {
                            create: {
                                question: "Biggest challenge?",
                                options: {
                                    create: [
                                        { text: "Sleep", order: 0 },
                                        { text: "Feeding", order: 1 },
                                        { text: "Self-care", order: 2 }
                                    ]
                                }
                            }
                        }
                    }
                });
            }
        }
    }

    // 4. Social Graph (Connections, Blocks)
    console.log('🔗 Seeding social graph...');
    await prisma.connection.upsert({
        where: { requesterId_recipientId: { requesterId: sarah.id, recipientId: emily.id } },
        update: {},
        create: { requesterId: sarah.id, recipientId: emily.id, status: 'accepted' }
    });
    await prisma.connection.upsert({
        where: { requesterId_recipientId: { requesterId: chloe.id, recipientId: sarah.id } },
        update: {},
        create: { requesterId: chloe.id, recipientId: sarah.id, status: 'pending' }
    });
    await prisma.userBlock.upsert({
        where: { blockerId_blockedId: { blockerId: admin.id, blockedId: chloe.id } }, // Admin blocks a problematic user mock
        update: {},
        create: { blockerId: admin.id, blockedId: chloe.id }
    });

    // 5. Marketplace
    console.log('🛍️ Seeding marketplace...');
    const marketplaceItems = [
        { title: "Nuna Leaf Curv", description: "Like new baby bouncer.", price: 120, condition: "Excellent", category: "Gear", seller: sarah },
        { title: "Graco Pack 'n Play", description: "Portable playard.", price: 50, condition: "Good", category: "Gear", seller: emily },
    ];

    for (const item of marketplaceItems) {
        const existing = await prisma.marketplaceItem.findFirst({ where: { title: item.title, sellerId: item.seller.id } });
        if (!existing) {
            await prisma.marketplaceItem.create({
                data: {
                    title: item.title,
                    description: item.description,
                    status: "available",
                    price: item.price,
                    condition: item.condition,
                    category: item.category,
                    latitude: 47.6062,
                    longitude: -122.3321,
                    sellerId: item.seller.id
                }
            });
        }
    }

    // 6. Events
    console.log('📅 Seeding events...');
    const eventTitle = "Sunday Stroller Walk";
    const existingEvent = await prisma.event.findFirst({ where: { title: eventTitle } });
    if (!existingEvent) {
        await prisma.event.create({
            data: {
                title: eventTitle,
                description: "Meet at the park for a coffee and a walk.",
                startTime: new Date('2026-04-05T10:00:00Z'),
                endTime: new Date('2026-04-05T12:00:00Z'),
                status: EventStatus.published,
                capacity: 10,
                organizerId: emily.id,
                registrations: {
                    create: [
                        { userId: emily.id, status: RegistrationStatus.confirmed },
                        { userId: sarah.id, status: RegistrationStatus.confirmed },
                        { userId: chloe.id, status: RegistrationStatus.confirmed },
                    ]
                },
                registeredCount: 3
            }
        });
    }

    // 7. Notifications
    console.log('🔔 Seeding notifications...');
    await prisma.notification.create({
        data: {
            userId: sarah.id,
            actorId: emily.id,
            type: "post_like",
            message: "Emily Chen liked your post.",
            isRead: false,
        }
    });

    // 8. Static Content & Articles
    console.log('📄 Seeding static content...');
    for (const content of sampleContent) {
        await prisma.content.upsert({
            where: { id: crypto.randomUUID() }, // Just creating them
            update: {},
            create: { ...content, authorId: admin.id }
        });
    }

    // 9. Brand Inquiries & Submissions
    console.log('🏢 Seeding business items...');
    await prisma.brandInquiry.create({
        data: {
            companyName: "Healthy Tots",
            contactName: "John Smith",
            email: "john@healthytots.com",
            intent: "Partnership",
            valuesAlignment: "We believe in organic nutrition.",
            status: "pending"
        }
    });

    await prisma.contentSubmission.create({
        data: {
            userId: olivia.id,
            title: "Tips for Flying with a Toddler",
            body: "Coming from a mom who has done 15 flights in 2 years...",
            category: "Travel",
            status: "pending"
        }
    });

    // 10. Directory Listings (South Africa)
    console.log('📍 Seeding South African directory listings...');
    const saDirectory = [
        {
            name: "Dr. Nomvula Mkhize - Pediatrician",
            category: "Pediatricians",
            address: "MediClinic Sandton, Bryanston, Sandton",
            latitude: -26.0697,
            longitude: 28.0247,
            description: "Expert pediatric care specializing in newborn health and developmental milestones."
        },
        {
            name: "Dr. Pieter van der Merwe",
            category: "Pediatricians",
            address: "Netcare Blaauwberg Hospital, Cape Town",
            latitude: -33.8217,
            longitude: 18.4907,
            description: "Focused on child wellness, vaccinations, and chronic pediatric conditions."
        },
        {
            name: "Dr. Sarah Govender",
            category: "Pediatricians",
            address: "St. Augustines Hospital, Durban",
            latitude: -29.8519,
            longitude: 31.0022,
            description: "Expert in adolescent health and pediatric nutrition."
        },
        {
            name: "The Kids Village",
            category: "Play Parks",
            address: "Riverside Shopping Centre, Sandton",
            latitude: -26.0355,
            longitude: 28.0560,
            description: "Indoor play area with sensory zones and safe climbing structures for toddlers."
        },
        {
            name: "Green Point Urban Park",
            category: "Play Parks",
            address: "Vlei Rd, Green Point, Cape Town",
            latitude: -33.9056,
            longitude: 18.4063,
            description: "Beautiful outdoor space with multiple playgrounds, biodiversity gardens, and picnic areas."
        },
        {
            name: "Mitchell Park Zoo & Gardens",
            category: "Play Parks",
            address: "Nimmo Rd, Morningside, Durban",
            latitude: -29.8291,
            longitude: 31.0117,
            description: "Combine a stroll through gardens with a visit to small animals and a large playground."
        },
        {
            name: "Baby City Umhlanga",
            category: "Baby Shops",
            address: "Umhlanga Arch, 1 Ncondo Pl, Umhlanga",
            latitude: -29.7264,
            longitude: 31.0658,
            description: "Durban's premier baby store for strollers, car seats, and all nursery essentials."
        },
        {
            name: "Kids Living - Cape Town",
            category: "Baby Shops",
            address: "15 Hudson St, De Waterkant",
            latitude: -33.9168,
            longitude: 18.4190,
            description: "Premium baby furniture and essentials for the modern nursery."
        },
        {
            name: "Postpartum Support South Africa",
            category: "Support Groups",
            address: "Online / National (Cape Town Office)",
            latitude: -33.9249,
            longitude: 18.4241,
            description: "Dedicated support for mothers struggling with PPD and anxiety across SA."
        },
        {
            name: "La Leche League South Africa",
            category: "Support Groups",
            address: "National Network",
            latitude: -26.2041,
            longitude: 28.0473,
            description: "Breastfeeding information and support through mother-to-mother gatherings."
        }
    ];

    for (const listing of saDirectory) {
        await prisma.directoryListing.upsert({
            where: { id: `sa-listing-${listing.name.toLowerCase().replace(/\s/g, '-')}` },
            update: listing,
            create: {
                id: `sa-listing-${listing.name.toLowerCase().replace(/\s/g, '-')}`,
                ...listing
            }
        });
    }

    console.log('\n======================================================');
    console.log('✨ Seed completed successfully!');
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
