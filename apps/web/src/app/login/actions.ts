'use server';

import { createClient } from '@/lib/supabase';
import { redirect } from 'next/navigation';

export async function loginAction(payload: any) {
  let email = '';
  let password = '';

  // 1. Ekstraksi jika frontend mengirim format HTML FormData standar
  if (payload && typeof payload.get === 'function') {
    email = (payload.get('email') as string) || '';
    password = (payload.get('password') as string) || '';
  } 
  // 2. Ekstraksi jika frontend mengirim format Object (React Hook Form)
  else if (payload && typeof payload === 'object') {
    email = payload.email || '';
    password = payload.password || '';
  }

  // Bersihkan spasi tidak sengaja di awal/akhir teks
  email = email.trim();
  password = password.trim();

  // Jika tetap kosong, masalahnya 100% ada di file UI (halaman depan)
  if (!email || !password) {
    redirect('/login?error=kredensial-kosong');
  }

  const supabase = createClient();
  
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect('/login?error=kredensial-salah');
  }

  // Jika sukses, masuk ke Dashboard
  redirect('/');
}

export async function logoutAction() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect('/login');
}