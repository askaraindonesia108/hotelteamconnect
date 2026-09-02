import { createClient } from './supabase';
import { prisma } from '@team-connect/database';

export async function auth() {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user || !user.email) {
    return null;
  }

  try {
    let dbUser = await prisma.user.findUnique({
      where: { email: user.email },
    });

    if (!dbUser) {
      let org = await prisma.organization.findFirst();
      if (!org) {
        org = await prisma.organization.create({
          data: { name: 'eL Hotel Group' }
        });
      }

      let prop = await prisma.property.findFirst({
        where: { organizationId: org.id }
      });
      if (!prop) {
        prop = await prisma.property.create({
          data: { name: 'eL Hotel Malang', organizationId: org.id }
        });
      }

      dbUser = await prisma.user.create({
        data: {
          email: user.email,
          name: 'Askara (Admin)', 
          password: 'auto-generated', 
          role: 'HRD_ADMIN',
          organizationId: org.id,
          propertyId: prop.id,
        }
      });
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

  } catch (error: any) {
    // DIAGNOSTIK: Menarik akar pesan error Prisma dan memasukkannya ke UI
    const rawError = error?.message || String(error);
    const cleanError = rawError.split('\n').filter(Boolean).pop()?.trim() || rawError;
    
    return {
      user: {
        id: user.id,
        email: user.email,
        name: `Info: ${cleanError}`.substring(0, 35),
        role: 'BACA ERROR DI ATAS',
        propertyId: 'error-property',
        organizationId: 'error-org',
      }
    };
  }
}