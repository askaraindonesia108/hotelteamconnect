import { auth } from '@/lib/auth';
import { User } from 'lucide-react';

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div className="max-w-4xl space-y-6">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Selamat datang, {session?.user?.name}!
        </h2>
        <p className="text-slate-600 mb-6">
          Anda berhasil masuk. Layout Navigasi Master Data telah aktif.
        </p>

        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 flex items-start gap-4">
          <div className="bg-white p-3 rounded-full border border-slate-200">
            <User className="w-6 h-6 text-slate-400" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Informasi Sesi Saat Ini:</h3>
            <ul className="mt-2 space-y-1 text-sm text-slate-600">
              <li><strong>Email:</strong> {session?.user?.email}</li>
              <li><strong>Role:</strong> {session?.user?.role}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}