import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function debugData() {
  const users = await prisma.user.findMany({ select: { id: true, username: true } });
  console.log('Users in DB:', users);

  const sarah = users.find(u => u.username === 'sarah');
  if (sarah) {
    const memberships = await prisma.groupMember.findMany({
      where: { userId: sarah.id },
      include: { group: { select: { name: true } } }
    });
    console.log(`Sarah (${sarah.id}) is in ${memberships.length} groups:`, memberships.map(m => m.group.name));

    const posts = await prisma.post.findMany({
      where: { authorId: sarah.id },
      include: { group: { select: { name: true } } }
    });
    console.log(`Sarah has ${posts.length} posts:`, posts.map(p => ({ content: p.content.substring(0, 20), group: p.group.name })));
  }

  const allPosts = await prisma.post.findMany({
    take: 10,
    include: { author: true, group: true }
  });
  console.log('Sample Posts:', allPosts.map(p => ({
    id: p.id,
    author: p.author ? p.author.username : 'NULL',
    authorId: p.authorId,
    group: p.group.name,
    content: p.content.substring(0, 20)
  })));
}

debugData().catch(console.error).finally(() => prisma.$disconnect());
