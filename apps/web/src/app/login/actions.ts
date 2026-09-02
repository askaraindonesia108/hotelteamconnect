'use server';

import { createClient } from '@/lib/supabase';
import { redirect } from 'next/navigation';

export async function loginAction(formData: FormData) {
  // Ekstraksi data murni dari form HTML
  const email = formData.get('email')?.toString()?.trim();
  const password = formData.get('password')?.toString()?.trim();

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