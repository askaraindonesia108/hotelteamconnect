'use client';

import { useFormStatus } from 'react-dom';
import { loginAction } from './actions';
import { Hotel, KeyRound, Mail } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-slate-900 text-white font-medium py-2.5 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
    >
      {pending ? 'Sedang Masuk...' : 'Masuk ke Dashboard'}
    </button>
  );
}

// Komponen form dipisah agar bisa membaca URL Parameter dengan aman
function LoginForm() {
  const searchParams = useSearchParams();
  const errorParam = searchParams.get('error');

  // Terjemahkan kode error dari URL menjadi pesan bahasa Indonesia
  let errorMessage = '';
  if (errorParam === 'kredensial-kosong') {
    errorMessage = 'Email dan password tidak boleh kosong.';
  } else if (errorParam === 'kredensial-salah') {
    errorMessage = 'Email atau password salah. Silakan coba lagi.';
  } else if (errorParam) {
    errorMessage = 'Terjadi kesalahan sistem saat login.';
  }

  return (
    <form action={loginAction} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Email Perusahaan
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Mail className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="email"
            name="email"
            required
            placeholder="admin@elhotel.com"
            className="text-slate-900 pl-10 w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600 transition-all"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Password
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <KeyRound className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="password"
            name="password"
            required
            placeholder="••••••••"
            className="text-slate-900 pl-10 w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600 transition-all"
          />
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-red-600 flex-shrink-0"></div>
          {errorMessage}
        </div>
      )}

      <div className="pt-2">
        <SubmitButton />
      </div>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
        
        {/* Header Section */}
        <div className="bg-red-700 p-8 text-center">
          <div className="bg-white/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <Hotel className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Hotel Team Connect</h1>
          <p className="text-red-100 text-sm">Team Connect - HRD Management</p>
        </div>

        {/* Form Section */}
        <div className="p-8">
          {/* Suspense wajib digunakan saat memanggil useSearchParams di Next.js */}
          <Suspense fallback={<div className="text-center text-sm text-slate-500 py-4">Memuat form...</div>}>
            <LoginForm />
          </Suspense>
        </div>
        
      </div>
    </div>
  );
}