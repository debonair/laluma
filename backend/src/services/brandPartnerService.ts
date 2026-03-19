import prisma from '../utils/prisma';

export interface BrandInquiryData {
  companyName: string;
  contactName: string;
  email: string;
  intent: string;
  valuesAlignment: string;
}

export const createInquiry = async (data: BrandInquiryData) => {
  const inquiry = await prisma.brandInquiry.create({
    data: {
      companyName: data.companyName,
      contactName: data.contactName,
      email: data.email,
      intent: data.intent,
      valuesAlignment: data.valuesAlignment,
    },
  });

  // Admin Notification - Log for MVP
  // In a real scenario, this would trigger an email or a dashboard notification
  console.log(`[Admin Notification] New Brand Partnership Inquiry received from ${data.companyName} (${data.email})`);
  
  return inquiry;
};

export const getAllInquiries = async () => {
  return await prisma.brandInquiry.findMany({
    orderBy: { createdAt: 'desc' },
  });
};

export const updateInquiryStatus = async (id: string, status: string) => {
  return await prisma.brandInquiry.update({
    where: { id },
    data: { status },
  });
};

import { getKeycloakAdminClient } from '../utils/keycloak';

export const provisionPartnerAccount = async (inquiryId: string) => {
  const inquiry = await prisma.brandInquiry.findUnique({
    where: { id: inquiryId },
  });

  if (!inquiry) {
    throw new Error('Inquiry not found');
  }

  const kcAdminClient = await getKeycloakAdminClient();
  
  // 1. Create User in Keycloak
  const username = inquiry.email.split('@')[0] + '_' + Math.random().toString(36).substring(2, 7);
  const tempPassword = Math.random().toString(36).substring(2, 10) + '!';

  const newUser = await kcAdminClient.users.create({
    username,
    email: inquiry.email,
    firstName: inquiry.contactName.split(' ')[0],
    lastName: inquiry.contactName.split(' ').slice(1).join(' '),
    enabled: true,
    emailVerified: true,
    credentials: [{
      type: 'password',
      value: tempPassword,
      temporary: true,
    }],
  });

  const userId = newUser.id;

  // 2. Assign role 'brand_partner'
  const realmRoles = await kcAdminClient.roles.findOneByName({ name: 'brand_partner' });
  if (realmRoles) {
    await kcAdminClient.users.addRealmRoleMappings({
      id: userId,
      roles: [{ id: realmRoles.id!, name: realmRoles.name! }],
    });
  }

  // 3. Link to Prisma User Model
  const user = await prisma.user.create({
    data: {
      keycloakId: userId,
      username,
      email: inquiry.email,
      displayName: inquiry.companyName,
      role: 'brand_partner',
      passwordHash: 'EXTERNAL', // Keycloak handles it
      brandProfile: {
        create: {
          companyName: inquiry.companyName,
        }
      }
    },
  });

  // 4. Log "Email Sent" simulation
  console.log(`[Email Simulation] To: ${inquiry.email}
Subject: Welcome to La Luma Brand Partnership
Content: Your partner account has been created.
Username: ${username}
Temporary Password: ${tempPassword}
Please log in and change your password.`);

  return { username, userId };
};

export const getPartnerProfile = async (userId: string) => {
  return await prisma.brandProfile.findUnique({
    where: { userId },
  });
};

export const updatePartnerProfile = async (userId: string, data: any) => {
  return await prisma.brandProfile.update({
    where: { userId },
    data: {
      companyName: data.companyName,
      logoUrl: data.logoUrl,
      website: data.website,
      bio: data.bio,
      category: data.category,
      instagramHandle: data.instagramHandle,
      facebookUrl: data.facebookUrl,
    },
  });
};

export const getPublicPartnerProfile = async (id: string) => {
  return await prisma.brandProfile.findUnique({
    where: { id },
    select: {
      id: true,
      companyName: true,
      logoUrl: true,
      website: true,
      bio: true,
      category: true,
      instagramHandle: true,
      facebookUrl: true,
      isVerified: true,
      user: {
        select: {
          displayName: true,
          profileImageUrl: true,
        }
      }
    }
  });
};
