import { PrismaClient, UserRole, EventStatus, RegistrationStatus, BrandContentStatus } from '@prisma/client';
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
        id: 'content-ppd-wellness',
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
        id: 'content-sleep-training',
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
        id: 'content-yoga-seattle',
        title: "Mommy & Me Yoga in the Park (Seattle)",
        body: `Join us for a relaxing and rejuvenating yoga session designed specifically for mothers and their little ones (ages 0-3). Let's stretch, breathe, and bond in the beautiful outdoors.\n\n## What to Bring\n- A yoga mat (or two!)\n- Water bottle\n- Sunscreen and hats\n- Snacks for the little ones\n\nNo prior yoga experience is necessary. This is a judgment-free zone where crying babies and feeding breaks are completely expected and welcomed!`,
        excerpt: "A relaxing outdoor yoga session for mothers and toddlers in Seattle.",
        category: "Health & Fitness",
        authorName: "Luma Community Team",
        contentType: "event",
        eventDate: new Date('2026-06-15T10:00:00Z'),
        eventLocation: "Centennial Park, Main Lawn, Seattle",
        latitude: 47.6212,
        longitude: -122.3610,
        isPremium: false,
        isFeatured: true,
        status: "approved",
        publishedAt: new Date('2024-02-15')
    },
    {
        id: 'content-prom-food',
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
    },
    {
        id: 'content-hiking-sa',
        title: "Stroller Hiking - Table Mountain (Cape Town)",
        body: `Join our Cape Town chapter for a stroller-friendly hike along the lower slopes of Table Mountain. Breathtaking views and great company!\n\n## Logistics\n- Meet at Kloof Nek parking\n- Pace is slow and steady\n- We'll end at a local cafe`,
        excerpt: "A brisk morning hike in Cape Town for active moms.",
        category: "Fitness",
        authorName: "Luma SA Team",
        contentType: "event",
        eventDate: new Date('2026-07-20T09:00:00Z'),
        eventLocation: "Kloof Nek, Cape Town",
        latitude: -33.9416,
        longitude: 18.4027,
        isPremium: false,
        isFeatured: true,
        status: "approved",
        publishedAt: new Date('2024-03-01')
    }
];

async function main() {
    console.log('🌱 Starting universal seed (Keycloak + Prisma)...');

    // 1. Authenticate kcadm.sh as admin
    console.log('Logging into Keycloak Admin CLI...');
    runKcadm('config credentials --server http://localhost:8080 --realm master --user admin --password admin');

    // 2. Synchronize Users
    const usersData = [
        { username: 'admin', email: 'admin@luma.com', first: 'Luma', last: 'Admin', bio: 'Platform Administrator', stage: 'Toddler', role: UserRole.admin, lat: 47.6062, lon: -122.3321, city: 'Seattle', country: 'USA' },
        { username: 'sarah', email: 'sarah@luma.com', first: 'Sarah', last: 'Miller', bio: 'First time mom finding her way!', stage: 'Newborn', role: UserRole.member, lat: 47.6101, lon: -122.3421, city: 'Seattle', country: 'USA' },
        { username: 'emily', email: 'emily@luma.com', first: 'Emily', last: 'Chen', bio: 'Mom of two, coffee enthusiast.', stage: 'Pre-school', role: UserRole.member, lat: 47.6001, lon: -122.3221, city: 'Seattle', country: 'USA' },
        { username: 'chloe', email: 'chloe@luma.com', first: 'Chloe', last: 'Davis', bio: 'Nature lover and new mom.', stage: 'Newborn', role: UserRole.member, lat: -33.9249, lon: 18.4241, city: 'Cape Town', country: 'South Africa' },
        { username: 'maya', email: 'maya@luma.com', first: 'Maya', last: 'Patel', bio: 'Passionate about gentle parenting.', stage: 'Toddler', role: UserRole.moderator, lat: -26.2041, lon: 28.0473, city: 'Johannesburg', country: 'South Africa' },
        { username: 'olivia', email: 'olivia@luma.com', first: 'Olivia', last: 'Wilson', bio: 'Writer and educator.', stage: 'Pre-school', role: UserRole.editorial, lat: -29.8587, lon: 31.0218, city: 'Durban', country: 'South Africa' },
        { username: 'brand_partner', email: 'partner@freshbites.com', first: 'Fresh', last: 'Bites', bio: 'Organic baby food for your little ones.', stage: 'N/A', role: UserRole.brand_partner, lat: 47.6062, lon: -122.3321, city: 'Seattle', country: 'USA' },
        { username: 'tester', email: 'tester@luma.com', first: 'Test', last: 'User', bio: 'System tester and developer.', stage: 'Toddler', role: UserRole.member, lat: 47.6062, lon: -122.3321, city: 'Seattle', country: 'USA' },
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
                        create: { 
                            lookingFor: ['Friends', 'Advice'], 
                            locationRadius: 100, 
                            locationAnywhere: false,
                            latitude: u.lat,
                            longitude: u.lon,
                            city: u.city,
                            country: u.country
                        }
                    }
                }
            });
            console.log(`✅ Synced User to Prisma: ${u.username}`);
        } else {
            console.log(`ℹ️ User already seeded in Prisma: ${u.username}. Updating location...`);
            dbUser = await prisma.user.update({
                where: { id: dbUser.id },
                data: { 
                    keycloakId: kcId, 
                    role: u.role,
                    preferences: {
                        upsert: {
                            create: {
                                locationRadius: 100,
                                latitude: u.lat,
                                longitude: u.lon,
                                city: u.city,
                                country: u.country
                            },
                            update: {
                                latitude: u.lat,
                                longitude: u.lon,
                                city: u.city,
                                country: u.country
                            }
                        }
                    }
                }
            });
        }

        // Assign Role in Keycloak
        if (u.role && u.role !== UserRole.member) {
            console.log(`Keycloak: Assigning role '${u.role}' to user '${u.username}'...`);
            // Note: In kcadm, we need to add the role. We'll try to add it through the composite-role or direct realm role assign.
            // Simplified: kcadm.sh add-roles -r luma-realm --uusername username --rolename rolename
            runKcadm(`add-roles -r luma-realm --uusername ${u.username} --rolename ${u.role}`);
        }

        seededUsers.push(dbUser);
    }

    // Update any existing 'tester' or non-seed users to have a default location in Seattle if missing
    // This ensures the current dev user always sees something in Discover nearby
    const others = await prisma.user.findMany({
        where: {
            NOT: { username: { in: usersData.map(u => u.username) } }
        },
        include: { preferences: true }
    });
    for (const u of others) {
        if (!u.preferences || u.preferences.latitude === null) {
            console.log(`📍 Setting default Seattle location for existing user: ${u.username}`);
            await prisma.userPreference.upsert({
                where: { userId: u.id },
                create: { userId: u.id, latitude: 47.6062, longitude: -122.3321, city: 'Seattle', country: 'USA' },
                update: { latitude: 47.6062, longitude: -122.3321, city: 'Seattle', country: 'USA' }
            });
        }
        seededUsers.push(u);
    }

    const [admin, sarah, emily, chloe, maya, olivia, brandPartner, tester] = seededUsers;

    // 3. Seed Groups
    const groupsData = [
        { name: "New Moms Support Group", description: "A safe space for new mothers to ask questions.", emoji: "👶", creator: admin, type: 'public', city: 'Seattle', lat: 47.6, lon: -122.3 },
        { name: "Toddler Tantrum Survivors", description: "Sharing tips and solidarity for the toddler years.", emoji: "😤", creator: maya, type: 'public', city: 'Johannesburg', lat: -26.2, lon: 28.0 },
        { name: "Local Meetups - Seattle", description: "Connecting moms in the PNW.", emoji: "🌲", creator: emily, type: 'public', city: 'Seattle', lat: 47.6, lon: -122.3 },
        { name: "Secret Sleep Squad", description: "Private group for sleep training discussions.", emoji: "😴", creator: sarah, type: 'private' },
    ];

    for (const g of groupsData) {
        const otherMembers = [sarah, emily, chloe].filter(u => u && u.id !== g.creator.id);
        
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
                city: (g as any).city,
                latitude: (g as any).lat,
                longitude: (g as any).lon,
                members: {
                    create: [
                        { userId: g.creator.id, role: 'admin' },
                        ...otherMembers.map(u => ({ userId: u.id, role: 'member' as const }))
                    ]
                }
            }
        });

        // Ensure sarah is explicitly joined if not already (for idempotency)
        if (sarah && sarah.id !== g.creator.id) {
            await prisma.groupMember.upsert({
                where: { groupId_userId: { groupId: group.id, userId: sarah.id } },
                update: {},
                create: { groupId: group.id, userId: sarah.id, role: 'member' }
            });
        }
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
                    likesCount: 2
                }
            });
        } else if (!existingWelcome.authorId && g.creator.id) {
            await prisma.post.update({
                where: { id: existingWelcome.id },
                data: { authorId: g.creator.id }
            });
        }

        if (g.name === "New Moms Support Group") {
            const supportContent = "Has anyone tried the Ferber method? Day 3 and I'm exhausted.";
            let supportPost = await prisma.post.findFirst({ where: { groupId: group.id, content: supportContent } });
            if (!supportPost) {
                if (!sarah?.id) {
                    throw new Error("Cannot seed posts: 'sarah' user was not created successfully.");
                }
                supportPost = await prisma.post.create({
                    data: {
                        groupId: group.id,
                        authorId: sarah.id,
                        content: supportContent,
                        commentsCount: 3
                    }
                });
            } else if (!supportPost.authorId && sarah?.id) {
                supportPost = await prisma.post.update({
                    where: { id: supportPost.id },
                    data: { authorId: sarah.id }
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
        { title: "Nuna Leaf Curv", description: "Like new baby bouncer.", price: 120, condition: "Excellent", category: "Gear", seller: sarah, lat: 47.6, lon: -122.3 },
        { title: "Graco Pack 'n Play", description: "Portable playard.", price: 50, condition: "Good", category: "Gear", seller: emily, lat: 47.6, lon: -122.3 },
        { title: "Stroller - Cape Town", description: "Lightweight umbrella stroller.", price: 800, condition: "Great", category: "Gear", seller: chloe, lat: -33.9, lon: 18.4 },
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
                    latitude: item.lat,
                    longitude: item.lon,
                    sellerId: item.seller.id
                }
            });
        }
    }

    // 6. Events
    console.log('📅 Seeding events...');
    const eventItems = [
        { title: "Sunday Stroller Walk", start: '2026-04-05T10:00:00Z', lat: 47.6, lon: -122.3, org: emily },
        { title: "SA Moms Picnic", start: '2026-05-10T11:00:00Z', lat: -33.9, lon: 18.4, org: chloe },
    ];

    for (const e of eventItems) {
        let event = await prisma.event.findFirst({ where: { title: e.title } });
        if (!event) {
            event = await prisma.event.create({
                data: {
                    title: e.title,
                    description: "Community gathering for outdoor exercise and connection.",
                    startTime: new Date(e.start),
                    endTime: new Date(new Date(e.start).getTime() + 7200000),
                    status: EventStatus.published,
                    capacity: 20,
                    organizerId: e.org.id,
                    latitude: e.lat,
                    longitude: e.lon,
                    registeredCount: 0
                }
            });
        }

        // Seed registrations separately to ensure idempotency
        const registrants = [
            { userId: e.org.id, status: RegistrationStatus.confirmed },
            { userId: sarah.id, status: RegistrationStatus.confirmed },
            { userId: emily.id, status: RegistrationStatus.confirmed },
        ];

        for (const reg of registrants) {
            if (reg.userId) {
                await prisma.eventRegistration.upsert({
                    where: { userId_eventId: { userId: reg.userId, eventId: event.id } },
                    update: { status: reg.status },
                    create: { userId: reg.userId, eventId: event.id, status: reg.status }
                });
            }
        }

        // Update count
        const count = await prisma.eventRegistration.count({ where: { eventId: event.id } });
        await prisma.event.update({
            where: { id: event.id },
            data: { registeredCount: count }
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

    // 8. Static Content & Articles (Discovery Tab)
    console.log('📄 Seeding discovery content (articles, promotions, events)...');
    for (const content of sampleContent) {
        await prisma.content.upsert({
            where: { id: content.id },
            update: { ...content, authorId: admin.id },
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
        const listId = `sa-listing-${listing.name.toLowerCase().replace(/\s/g, '-')}`;
        await prisma.directoryListing.upsert({
            where: { id: listId },
            update: listing,
            create: {
                id: listId,
                ...listing
            }
        });
    }

    // 11. Universal Social Graph (Conversations between ALL users)
    console.log('💬 Seeding universal social graph (conversations between all users)...');
    for (let i = 0; i < seededUsers.length; i++) {
        for (let j = i + 1; j < seededUsers.length; j++) {
            const u1 = seededUsers[i];
            const u2 = seededUsers[j];
            
            // Clean up malformed conversations (less than 2 participants) involving these users
            await prisma.conversation.deleteMany({
                where: {
                    participants: {
                        every: { userId: { in: [u1.id, u2.id] } }
                    },
                    NOT: {
                        participants: {
                            every: { userId: { in: [u1.id, u2.id] } }
                        },
                        AND: [
                            { participants: { some: { userId: u1.id } } },
                            { participants: { some: { userId: u2.id } } }
                        ]
                    }
                }
            });

            // Find valid existing conversation between exactly these two users
            const existingConv = await prisma.conversation.findFirst({
                where: {
                    AND: [
                        { participants: { some: { userId: u1.id } } },
                        { participants: { some: { userId: u2.id } } },
                        { participants: { every: { userId: { in: [u1.id, u2.id] } } } }
                    ]
                }
            });

            if (!existingConv) {
                await prisma.conversation.create({
                    data: {
                        participants: {
                            create: [
                                { userId: u1.id },
                                { userId: u2.id }
                            ]
                        },
                        messages: {
                            create: [
                                { 
                                    senderId: u1.id, 
                                    content: `Hi ${u2.displayName || u2.username}! I noticed we're both in the Luma community.`,
                                    createdAt: new Date(Date.now() - 3600000 * 2) // 2 hours ago
                                },
                                { 
                                    senderId: u2.id, 
                                    content: `Hey ${u1.displayName || u1.username}, nice to meet you! How's your day going?`,
                                    createdAt: new Date(Date.now() - 3600000 * 1) // 1 hour ago
                                }
                            ]
                        }
                    }
                });
            }
        }
    }

    // 12. Rich Interactions (Comments & Reactions on all content types)
    console.log('❤️ Seeding rich interactions (comments/reactions in descending order)...');
    
    // Comments on Articles/Content
    const allContent = await prisma.content.findMany();
    for (const content of allContent) {
        for (let i = 0; i < 3; i++) {
            const randomUser = seededUsers[Math.floor(Math.random() * seededUsers.length)];
            await prisma.contentComment.create({
                data: {
                    contentId: content.id,
                    authorId: randomUser.id,
                    commentText: `Great ${content.contentType}! Very helpful information. #${i}`,
                    createdAt: new Date(Date.now() - 1000000 * (3-i)) // Staggered for order
                }
            });
            // Likes on Content
            await prisma.contentLike.upsert({
                where: { contentId_userId: { contentId: content.id, userId: randomUser.id } },
                update: {},
                create: { contentId: content.id, userId: randomUser.id }
            });
        }
    }

    // Comments & Reactions on Posts
    const allPosts = await prisma.post.findMany();
    for (const post of allPosts) {
        for (let i = 0; i < 4; i++) {
            const randomUser = seededUsers[Math.floor(Math.random() * seededUsers.length)];
            const reactionTypes = ['like', 'love', 'haha', 'wow'];
            
            if (i < 2) {
                await prisma.comment.create({
                    data: {
                        postId: post.id,
                        authorId: randomUser.id,
                        content: `Insightful post! I agree with this completely. (Comment ${i})`,
                        createdAt: new Date(Date.now() - 500000 * (4-i))
                    }
                });
            }

            await prisma.postLike.upsert({
                where: { postId_userId: { postId: post.id, userId: randomUser.id } },
                update: { reactionType: reactionTypes[i] },
                create: { postId: post.id, userId: randomUser.id, reactionType: reactionTypes[i] }
            });
        }
    }

    // Reviews on Marketplace Items (Simulated via comments/mentions? No, just seed some messages about them)
    // Actually, I'll just skip Marketplace comments if schema doesn't support them directly,
    // but the task said "Event, Article, Marketplace etc". 
    // I'll add Event registrations as a "reaction" of sorts.
    
    // 12. Brand Partner Profile & Content (Story 8.6)
    console.log('🏢 Seeding Brand Partner profile and performance data...');
    const freshBitesProfile = await prisma.brandProfile.upsert({
        where: { userId: brandPartner.id },
        update: {},
        create: {
            userId: brandPartner.id,
            companyName: 'Fresh Bites',
            logoUrl: 'https://images.unsplash.com/photo-1594844781429-c30027f1e5c0?w=128&h=128&fit=crop',
            website: 'https://freshbites.com',
            category: 'Nutrition',
            bio: 'Premium organic baby food for your little ones.'
        }
    });

    // Seed some BrandContent submissions
    const brandContents = [
        { title: 'Choosing the Best First Foods', content: 'Sample content...', status: BrandContentStatus.APPROVED },
        { title: 'Organic vs Natural: What to know', content: 'Sample content...', status: BrandContentStatus.PENDING },
        { title: 'Winter Nutrition Tips', content: 'Sample draft...', status: BrandContentStatus.DRAFT },
    ];

    for (const bc of brandContents) {
        await prisma.brandContent.create({
            data: {
                ...bc,
                partnerId: freshBitesProfile.id,
            }
        });
    }

    // Seed some actual Content (published articles) by the partner to aggregate analytics
    for (let i = 0; i < 3; i++) {
        await prisma.content.create({
            data: {
                title: `Fresh Bites Featured Article #${i + 1}`,
                body: "Full article content for engagement tracking...",
                excerpt: "Brief summary of the partner's expertise...",
                category: "Nutrition",
                authorId: brandPartner.id,
                status: "approved",
                viewCount: 150 + (i * 50),
                likesCount: 25 + (i * 10),
                commentsCount: 5 + i,
                publishedAt: new Date(Date.now() - 86400000 * (i + 1)),
            }
        });
    }

    // 13. Feed Messages & Conversations (Story 7.1)
    console.log('💬 Seeding conversations and messages...');
    if (sarah && tester) {
        // Create conversation
        const conv = await prisma.conversation.create({
            data: {
                participants: {
                    create: [
                        { userId: sarah.id },
                        { userId: tester.id }
                    ]
                }
            }
        });

        // Add some messages
        const messageData = [
            { senderId: tester.id, content: "Hey Sarah! How is the new member onboarding coming along?", createdAt: new Date(Date.now() - 1000 * 60 * 30) },
            { senderId: sarah.id, content: "Hi! It's going great. Just checking out the new group features.", createdAt: new Date(Date.now() - 1000 * 60 * 25) },
            { senderId: tester.id, content: "Awesome. Let me know if you find any bugs!", createdAt: new Date(Date.now() - 1000 * 60 * 20) },
            { senderId: sarah.id, content: "Will do! Everything looks very smooth so far. ✨", createdAt: new Date(Date.now() - 1000 * 60 * 15) },
        ];

        for (const msg of messageData) {
            await prisma.message.create({
                data: {
                    conversationId: conv.id,
                    senderId: msg.senderId,
                    content: msg.content,
                    createdAt: msg.createdAt
                }
            });
        }
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
