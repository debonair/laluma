import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkSeeds() {
  const userCount = await prisma.user.count();
  const groupCount = await prisma.group.count();
  const postCount = await prisma.post.count();
  const memberCount = await prisma.groupMember.count();

  console.log(`Users: ${userCount}`);
  console.log(`Groups: ${groupCount}`);
  console.log(`Posts: ${postCount}`);
  console.log(`Memberships: ${memberCount}`);

  const sarah = await prisma.user.findFirst({ where: { username: 'sarah' } });
  if (sarah) {
    const sarahGroups = await prisma.groupMember.count({ where: { userId: sarah.id } });
    const sarahPosts = await prisma.post.count({ where: { authorId: sarah.id } });
    console.log(`Sarah ID: ${sarah.id}`);
    console.log(`Sarah Groups: ${sarahGroups}`);
    console.log(`Sarah Posts: ${sarahPosts}`);
  } else {
    console.log('Sarah not found');
  }

  const latestPosts = await prisma.post.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: { author: true, group: true }
  });
  console.log('Latest Posts:', JSON.stringify(latestPosts, null, 2));
}

checkSeeds().catch(console.error).finally(() => prisma.$disconnect());
