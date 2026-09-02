'use server';

import { createClient } from '@/lib/supabase';
import { redirect } from 'next/navigation';

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  
  const supabase = createClient();
  
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Alih-alih melempar error yang membuat layar putih (crash/Error 500), 
    // kita kembalikan pengguna ke halaman login dan berikan penanda error di URL
    redirect('/login?error=kredensial-salah');
  }

  // Jika sukses login di Supabase, arahkan langsung ke halaman utama (dashboard)
  redirect('/');
}

export async function logoutAction() {
  const supabase = createClient();
  
  // Hapus sesi aktif dari Supabase
  await supabase.auth.signOut();
  
  // Arahkan kembali ke halaman login
  redirect('/login');
}