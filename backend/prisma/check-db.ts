import { PrismaClient, UserRole } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  try {
    const user = await prisma.user.findUnique({
      where: { username: 'brand_partner' },
      select: { id: true, username: true, role: true }
    });
    console.log('User:', JSON.stringify(user, null, 2));

    if (user && user.role !== 'brand_partner') {
        console.log('Updating user role to brand_partner...');
        await prisma.user.update({
            where: { id: user.id },
            data: { role: 'brand_partner' as UserRole }
        });
        const updated = await prisma.user.findUnique({ where: { id: user.id } });
        console.log('Updated User:', JSON.stringify(updated, null, 2));
    }

    const profile = await prisma.brandProfile.findUnique({
      where: { userId: user?.id }
    });
    console.log('Profile:', JSON.stringify(profile, null, 2));

    if (!profile && user) {
        console.log('Creating brand profile...');
        await prisma.brandProfile.create({
            data: {
                id: 'test-partner-id',
                userId: user.id,
                companyName: 'Fresh Bites',
                isVerified: true
            }
        });
        console.log('Created Profile successfully');
    }
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

check();
