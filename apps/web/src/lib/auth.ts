import { createClient } from './supabase';
import { prisma } from '@team-connect/database';

export async function auth() {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user || !user.email) {
    return null;
  }

  try {
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
    });

    if (!dbUser) {
      return {
        user: {
          id: user.id,
          email: user.email,
          name: 'Admin (Data Belum Ada)',
          role: 'ADMIN',
          propertyId: 'dummy-property',
          organizationId: 'dummy-org',
        }
      };
    }

    return {
      user: {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role,
        propertyId: dbUser.propertyId,
        organizationId: dbUser.organizationId,
      }
    };

  } catch (error) {
    console.error("PRISMA ERROR DI VERCEL:", error);
    return {
      user: {
        id: user.id,
        email: user.email,
        name: 'ERROR KONEKSI VERCEL',
        role: 'ADMIN',
        propertyId: 'error-property',
        organizationId: 'error-org',
      }
    };
  }
}