import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '@team-connect/database';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email dan password wajib diisi.' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      return NextResponse.json({ error: 'Login gagal. Email atau password salah.' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { email },
      select: { name: true, organizationId: true, propertyId: true, role: true }
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'Akun valid, tetapi profil tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Selamat datang, ${dbUser.name}`,
      data: {
        name: dbUser.name,
        role: dbUser.role,
        organizationId: dbUser.organizationId,
        propertyId: dbUser.propertyId,
      }
    });

  } catch (error: any) {
    console.error('API AGENT AUTH ERROR:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server internal.' }, { status: 500 });
  }
} 

