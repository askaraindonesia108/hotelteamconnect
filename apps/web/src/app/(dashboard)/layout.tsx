import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { logoutAction } from '../login/actions';
import Link from 'next/link';
import { 
  LayoutDashboard, Users, Building2, Briefcase, 
  Clock, CalendarX2, Laptop, LogOut, FileText, Download, Fingerprint
} from 'lucide-react';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Pegawai', href: '/employees', icon: Users },
    { name: 'Departemen', href: '/departments', icon: Building2 },
    { name: 'Jabatan', href: '/positions', icon: Briefcase },
    { name: 'Shift & Jadwal', href: '/schedules', icon: Clock },
    { name: 'Log Mentah', href: '/raw-scans', icon: Fingerprint },
    { name: 'Cuti & Libur', href: '/leaves', icon: CalendarX2 },
    { name: 'Mesin & Sumber', href: '/devices', icon: Laptop },
    { name: 'Laporan', href: '/reports', icon: FileText },
    { name: 'Import Center', href: '/import', icon: Download },
  ];

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 flex flex-col">
        <div className="h-16 flex items-center px-6 bg-slate-950">
          <h1 className="text-lg font-bold text-white tracking-wide">
            <span className="text-red-500">eL</span> Hotel Malang
          </h1>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <nav className="px-3 space-y-1">
            {navItems.map((item: any) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <Icon className="w-5 h-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 bg-slate-950">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-red-700 flex items-center justify-center text-white font-bold text-sm">
              {session.user?.name?.charAt(0) || 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-white truncate">{session.user?.name || 'User'}</p>
              <p className="text-xs text-slate-400 truncate">{session.user?.role || 'VIEWER'}</p>
            </div>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-slate-300 bg-slate-800 rounded-lg hover:text-white hover:bg-red-600 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Keluar
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-8 shadow-sm z-10">
          <h2 className="text-lg font-semibold text-slate-800">Team Connect HRD</h2>
        </header>
        <div className="flex-1 overflow-y-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}