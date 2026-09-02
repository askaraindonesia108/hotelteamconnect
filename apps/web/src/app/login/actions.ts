'use server';

import { createClient } from '@/lib/supabase';
import { redirect } from 'next/navigation';

export async function loginAction(data: FormData | any) {
  let email = '';
  let password = '';

  // Aman membaca data baik dikirim via FormData maupun objek biasa
  if (data && typeof data.get === 'function') {
    email = data.get('email') as string;
    password = data.get('password') as string;
  } else if (data && typeof data === 'object') {
    email = data.email || '';
    password = data.password || '';
  }

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

  redirect('/');
}

export async function logoutAction() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect('/login');
}