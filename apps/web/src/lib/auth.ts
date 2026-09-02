import { createClient } from './supabase';
import { prisma } from '@team-connect/database';

export async function auth() {
  try {
    const supabase = createClient();
    
    // 1. Ambil sesi aktif dari cookies Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user || !user.email) {
      return null;
    }

    // 2. Sinkronkan dengan data HRD di database Prisma (Dibungkus Try-Catch)
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
    });

    // 3. Jika user berhasil login di Supabase tapi belum didaftarkan di tabel Prisma
    if (!dbUser) {
      console.warn(`User ${user.email} tidak ditemukan di tabel Prisma.`);
      return null; 
    }

    // 4. Sukses: Kembalikan data lengkap
    return {
      user: {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        propertyId: dbUser.propertyId,
        organizationId: dbUser.organizationId,
        role: dbUser.role,
      }
    };

  } catch (error) {
    // PROTEKSI TOTAL: Cegah layar putih (Error 500) jika koneksi database Vercel bermasalah
    console.error("Database Connection Error:", error);
    return null;
  }
}