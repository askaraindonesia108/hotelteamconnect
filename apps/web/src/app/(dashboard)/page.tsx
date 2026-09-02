import { auth } from '@/lib/auth';
import { prisma } from '@team-connect/database';
import { redirect } from 'next/navigation';
import { Users, Building2, UserCheck, CalendarX2, ArrowRight, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { id as localeID } from 'date-fns/locale';
import { InteractiveHRChart } from './components/DashboardChart';

export const metadata = { title: 'Dashboard | Hotel Team Connect' };

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const { propertyId } = session.user;
  
  const today = new Date();
  const startOfToday = startOfDay(today);
  const endOfToday = endOfDay(today);
  const sevenDaysAgo = subDays(startOfToday, 6); // 7 hari terakhir (termasuk hari ini)

  // 1. Ambil Data Pararel
  const [
    totalEmployees,
    totalDepartments,
    presentTodayCount,
    recentLeaves,
    departmentsInfo,
    recentAttendances // Data absensi 7 hari terakhir
  ] = await Promise.all([
    prisma.employee.count({ where: { propertyId, isActive: true } }),
    prisma.department.count({ where: { propertyId } }),
    prisma.attendanceRecord.count({ 
      where: { propertyId, date: { gte: startOfToday, lte: endOfToday }, status: 'PRESENT' } 
    }),
    prisma.leaveRequest.findMany({
      where: { propertyId },
      include: { employee: { select: { name: true, department: { select: { name: true } } } } },
      orderBy: { createdAt: 'desc' },
      take: 4
    }),
    prisma.department.findMany({
      where: { propertyId },
      select: { id: true, name: true },
      orderBy: { name: 'asc' }
    }),
    prisma.attendanceRecord.findMany({
      where: { 
        propertyId, 
        date: { gte: sevenDaysAgo, lte: endOfToday },
        status: 'PRESENT' 
      },
      select: { checkIn: true, checkOut: true, date: true, employee: { select: { departmentId: true } } }
    })
  ]);

  // Siapkan referensi array 7 hari terakhir untuk sumbu X grafik
  const last7DaysStr = Array.from({ length: 7 }).map((_: any, i: number) => {
    return format(subDays(today, 6 - i), 'dd MMM', { locale: localeID });
  });

  // Format data raw untuk dilempar ke komponen klien
  const formattedAttendances = recentAttendances.map(a => ({
    date: format(a.date, 'dd MMM', { locale: localeID }),
    checkIn: a.checkIn,
    checkOut: a.checkOut,
    departmentId: a.employee.departmentId
  }));

  const stats = [
    { label: 'Total Pegawai Aktif', value: totalEmployees, icon: Users, color: 'bg-blue-50 text-blue-600', border: 'border-blue-100' },
    { label: 'Total Departemen', value: totalDepartments, icon: Building2, color: 'bg-indigo-50 text-indigo-600', border: 'border-indigo-100' },
    { label: 'Hadir Hari Ini', value: presentTodayCount, icon: UserCheck, color: 'bg-emerald-50 text-emerald-600', border: 'border-emerald-100' },
  ];

  const typeMap: Record<string, { label: string, color: string }> = {
    SICK: { label: 'Sakit', color: 'bg-red-100 text-red-700' },
    ANNUAL: { label: 'Cuti', color: 'bg-blue-100 text-blue-700' },
    PERMISSION: { label: 'Izin', color: 'bg-amber-100 text-amber-700' },
    UNPAID: { label: 'Unpaid', color: 'bg-slate-200 text-slate-700' },
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard HRD</h1>
          <p className="text-slate-600">Selamat datang kembali, <span className="font-semibold text-slate-900">{session.user.name}</span>.</p>
        </div>
        <div className="text-sm font-medium text-slate-600 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm flex items-center gap-2">
          <CalendarX2 className="w-4 h-4 text-indigo-600" />
          {format(new Date(), 'EEEE, dd MMMM yyyy', { locale: localeID })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className={`bg-white p-6 rounded-2xl border ${stat.border} shadow-sm flex items-center gap-4 transition-transform hover:-translate-y-1 duration-300`}>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Kolom Kiri: Interactive HR Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" /> Tren Kehadiran & Produktivitas
            </h3>
          </div>
          
          <InteractiveHRChart 
            attendances={formattedAttendances} 
            departments={departmentsInfo} 
            last7Days={last7DaysStr} 
          />
        </div>

        {/* Kolom Kanan: Panel Pintasan & Cuti */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Aksi Cepat</h3>
            <div className="grid grid-cols-2 gap-4">
              <Link href="/import" className="group p-4 rounded-xl border border-slate-200 hover:border-indigo-600 hover:bg-indigo-50 transition-all flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6" />
                </div>
                <h4 className="font-semibold text-slate-900 text-sm group-hover:text-indigo-700">Import Log</h4>
              </Link>
              <Link href="/reports" className="group p-4 rounded-xl border border-slate-200 hover:border-emerald-600 hover:bg-emerald-50 transition-all flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <UserCheck className="w-6 h-6" />
                </div>
                <h4 className="font-semibold text-slate-900 text-sm group-hover:text-emerald-700">Kalkulasi</h4>
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CalendarX2 className="w-4 h-4 text-amber-500" /> Cuti Terbaru
              </h3>
              <Link href="/leaves" className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                Semua <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="p-5 flex-1">
              {recentLeaves.length === 0 ? (
                <div className="py-6 text-center text-slate-400 text-sm">
                  Belum ada pengajuan.
                </div>
              ) : (
                <div className="space-y-3">
                  {recentLeaves.map(leave => (
                    <div key={leave.id} className="flex items-center justify-between pb-3 border-b border-slate-50 last:border-0 last:pb-0">
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">{leave.employee.name}</p>
                        <p className="text-xs text-slate-500">{format(leave.startDate, 'dd MMM', { locale: localeID })} - {format(leave.endDate, 'dd MMM yyyy', { locale: localeID })}</p>
                      </div>
                      <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-md ${typeMap[leave.type]?.color || 'bg-slate-100 text-slate-700'}`}>
                        {typeMap[leave.type]?.label || leave.type}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}