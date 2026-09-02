import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { logoutAction } from '../login/actions';
import Link from 'next/link';
import { 
  LayoutDashboard, Users, Building2, Briefcase, 
  Clock, CalendarX2, Laptop, LogOut, FileText, Download, Fingerprint,
  Bell
} from 'lucide-react';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Proteksi rute: Lempar ke login dengan parameter error jika sesi kosong/habis
  if (!session?.user) {
    redirect('/login?error=sesi-berakhir');
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
    <div className="flex h-screen bg-slate-50 font-sans">
      {/* Sidebar (Desktop) */}
      <aside className="w-64 bg-slate-900 flex flex-col shadow-xl z-20 hidden md:flex">
        {/* Header Sidebar - Brand Logo */}
        <div className="h-16 flex items-center px-6 bg-slate-950 border-b border-slate-800">
          <h1 className="text-lg font-bold text-white tracking-wide flex items-center gap-3">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center font-black text-xl shadow-sm">
              eL
            </div>
            <span>Hotel Malang</span>
          </h1>
        </div>

        {/* Navigasi Utama */}
        <div className="flex-1 overflow-y-auto py-6 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          <nav className="px-3 space-y-1.5">
            <div className="px-3 mb-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Menu HRD
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 hover:border-l-4 hover:border-red-500 transition-all"
                >
                  <Icon className="w-5 h-5 opacity-75" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Profil & Logout */}
        <div className="p-4 bg-slate-950 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-4 p-2 rounded-lg bg-slate-900 border border-slate-800">
            <div className="w-9 h-9 rounded-full bg-red-700 flex items-center justify-center text-white font-bold text-sm shadow-inner shrink-0">
              {session.user.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-sm font-medium text-white truncate">{session.user.name || 'Admin HRD'}</p>
              <p className="text-xs text-slate-400 truncate">{session.user.role || 'Administrator'}</p>
            </div>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-300 bg-slate-800/50 border border-slate-700 rounded-lg hover:text-white hover:bg-red-600 hover:border-red-500 transition-all shadow-sm"
            >
              <LogOut className="w-4 h-4" />
              Keluar Sistem
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm z-10">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-slate-800 hidden sm:block">
              Team Connect <span className="text-red-600 font-black">HRD</span>
            </h2>
          </div>
          
          <div className="flex items-center gap-5">
            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-700">{session.user.name || 'Administrator'}</p>
              <p className="text-xs font-medium text-slate-500">{session.user.email}</p>
            </div>
          </div>
        </header>
        
        {/* Page Content */}
        <div className="flex-1 overflow-y-auto bg-slate-50/50 p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}