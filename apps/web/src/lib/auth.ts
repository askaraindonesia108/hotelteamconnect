import { createClient } from './supabase';
import { prisma } from '@team-connect/database';

export async function auth() {
  // 1. Cek sesi Auth Supabase
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  // Jika Supabase menolak, berarti memang belum login
  if (authError || !user || !user.email) {
    return null;
  }

  // 2. Cek database Prisma
  try {
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
    });

    // MASALAH 1: Koneksi sukses, tapi tabel User masih kosong / email belum didaftarkan
    if (!dbUser) {
      return {
        user: {
          id: user.id,
          email: user.email,
          name: 'Admin (Data Belum Ada)',
          role: 'ADMIN',
        }
      };
    }

    // SUKSES: Koneksi jalan dan data ditemukan
    return {
      user: {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role,
      }
    };

  } catch (error) {
    // MASALAH 2: Vercel gagal connect ke Database (URL salah/belum diupdate)
    console.error("PRISMA ERROR DI VERCEL:", error);
    return {
      user: {
        id: user.id,
        email: user.email,
        name: 'ERROR KONEKSI VERCEL',
        role: 'ADMIN',
      }
    };
  }
}