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

    // SISTEM AUTO-SEED: Jika user belum terdaftar, buatkan otomatis
    if (!dbUser) {
      // 1. Cek atau buat Organisasi baru
      let org = await prisma.organization.findFirst();
      if (!org) {
        org = await prisma.organization.create({
          data: { name: 'eL Hotel Group' }
        });
      }

      // 2. Cek atau buat Properti baru
      let prop = await prisma.property.findFirst({
        where: { organizationId: org.id }
      });
      if (!prop) {
        prop = await prisma.property.create({
          data: { name: 'eL Hotel Malang', organizationId: org.id }
        });
      }

      // 3. Daftarkan User ini sebagai Admin Utama
      dbUser = await prisma.user.create({
        data: {
          email: user.email,
          name: 'Admin HRD', // Anda bisa mengedit nama ini nanti
          password: 'auto-generated', 
          role: 'HRD_ADMIN',
          organizationId: org.id,
          propertyId: prop.id,
        }
      });
    }

    // Kembalikan data user yang valid dengan ID yang sah
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