import { auth } from '@/lib/auth';
import { prisma } from '@team-connect/database';
import { redirect } from 'next/navigation';
import { Users, Building2, UserCheck, CalendarX2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { id as localeID } from 'date-fns/locale';

export const metadata = { title: 'Dashboard | eL Hotel Malang' };

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const { propertyId } = session.user;
  
  // Tanggal hari ini (awal dan akhir hari) untuk metrik harian
  const today = new Date();
  const startOfToday = new Date(today.setHours(0, 0, 0, 0));
  const endOfToday = new Date(today.setHours(23, 59, 59, 999));

  // 1. Ambil Metrik Utama dari Database secara pararel agar super cepat
  const [
    totalEmployees,
    totalDepartments,
    presentTodayCount,
    recentLeaves
  ] = await Promise.all([
    prisma.employee.count({ where: { propertyId, isActive: true } }),
    prisma.department.count({ where: { propertyId } }),
    prisma.attendanceRecord.count({ 
      where: { 
        propertyId, 
        date: { gte: startOfToday, lte: endOfToday },
        status: 'PRESENT'
      } 
    }),
    prisma.leaveRequest.findMany({
      where: { propertyId },
      include: { employee: { select: { name: true, department: { select: { name: true } } } } },
      orderBy: { createdAt: 'desc' },
      take: 4
    })
  ]);

  const stats = [
    { label: 'Total Pegawai Aktif', value: totalEmployees, icon: Users, color: 'bg-blue-50 text-blue-600', border: 'border-blue-100' },
    { label: 'Total Departemen', value: totalDepartments, icon: Building2, color: 'bg-indigo-50 text-indigo-600', border: 'border-indigo-100' },
    { label: 'Hadir Hari Ini', value: presentTodayCount, icon: UserCheck, color: 'bg-emerald-50 text-emerald-600', border: 'border-emerald-100' },
  ];

  const typeMap: Record<string, string> = {
    SICK: 'Sakit',
    ANNUAL: 'Cuti Tahunan',
    PERMISSION: 'Izin',
    UNPAID: 'Unpaid Leave',
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      
      {/* Header Welcome */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard HRD</h1>
          <p className="text-slate-600">Selamat datang kembali, <span className="font-semibold text-slate-900">{session.user.name}</span>. Berikut ringkasan hari ini.</p>
        </div>
        <div className="text-sm font-medium text-slate-500 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
          {format(new Date(), 'EEEE, dd MMMM yyyy', { locale: localeID })}
        </div>
      </div>

      {/* Grid Statistik */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className={`bg-white p-6 rounded-xl border ${stat.border} shadow-sm flex items-center gap-4`}>
              <div className={`p-4 rounded-full ${stat.color}`}>
                <Icon className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Kolom Kiri: Pintasan Cepat */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Aksi Cepat</h3>
          <div className="grid grid-cols-2 gap-4">
            <Link href="/import" className="group p-4 rounded-xl border border-slate-200 hover:border-indigo-600 hover:bg-indigo-50 transition-all">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Users className="w-5 h-5" />
              </div>
              <h4 className="font-semibold text-slate-900 group-hover:text-indigo-700">Import Log</h4>
              <p className="text-xs text-slate-500 mt-1">Tarik data mesin Fingerspot</p>
            </Link>
            <Link href="/reports" className="group p-4 rounded-xl border border-slate-200 hover:border-emerald-600 hover:bg-emerald-50 transition-all">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <UserCheck className="w-5 h-5" />
              </div>
              <h4 className="font-semibold text-slate-900 group-hover:text-emerald-700">Kalkulasi Absen</h4>
              <p className="text-xs text-slate-500 mt-1">Hitung kehadiran hari ini</p>
            </Link>
          </div>
        </div>

        {/* Kolom Kanan: Cuti Terbaru */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-0 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <CalendarX2 className="w-5 h-5 text-amber-500" /> Cuti & Izin Terbaru
            </h3>
            <Link href="/leaves" className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
              Lihat Semua <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="p-6 flex-1">
            {recentLeaves.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <p>Belum ada pengajuan cuti.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentLeaves.map(leave => (
                  <div key={leave.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">{leave.employee.name}</p>
                      <p className="text-xs text-slate-500">{leave.employee.department?.name || '-'}</p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-2 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-md mb-1">
                        {typeMap[leave.type] || leave.type}
                      </span>
                      <p className="text-xs font-medium text-slate-600">
                        {format(leave.startDate, 'dd MMM', { locale: localeID })} - {format(leave.endDate, 'dd MMM yyyy', { locale: localeID })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}