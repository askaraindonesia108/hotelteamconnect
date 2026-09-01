'use server';

import { signIn, signOut } from '@/lib/auth';
import { AuthError } from 'next-auth';

export async function loginAction(prevState: any, formData: FormData) {
  try {
    // Penambahan redirectTo: '/' secara eksplisit
    await signIn('credentials', {
      email: formData.get('email'),
      password: formData.get('password'),
      redirectTo: '/',
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return { error: 'Email atau password salah.' };
        default:
          return { error: 'Terjadi kesalahan sistem saat login.' };
      }
    }
    // Sangat penting: re-throw error agar navigasi Next.js (NEXT_REDIRECT) dapat berjalan
    throw error;
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: '/login' });
}