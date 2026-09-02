import { createClient } from './supabase';
import { prisma } from '@team-connect/database';

export async function auth() {
  const supabase = createClient();
  
  // Ambil sesi aktif dari Supabase
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Sinkronkan dengan data di database Prisma Anda
  const dbUser = await prisma.user.findUnique({
    where: { email: user.email },
  });

  if (!dbUser) return null;

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
}