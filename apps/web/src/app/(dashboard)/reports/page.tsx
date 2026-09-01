import { auth } from '@/lib/auth';
import { prisma } from '@team-connect/database';
import { redirect } from 'next/navigation';
import { EngineTrigger } from './components/EngineTrigger';
import { format } from 'date-fns';
import { id as localeID } from 'date-fns/locale';
import Link from 'next/link';

export const metadata = { title: 'Laporan Absensi | Hotel Team Connect' };

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: { date?: string };
}) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const filterDateStr = searchParams.date || format(new Date(), 'yyyy-MM-dd');
  const targetDate = new Date(`${filterDateStr}T00:00:00.000Z`);

  const records = await prisma.attendanceRecord.findMany({
    where: {
      propertyId: session.user.propertyId,
      date: targetDate,
    },
    include: {
      employee: {
        select: { name: true, nip: true, department: { select: { name: true } } }
      }
    },
    orderBy: { employee: { name: 'asc' } }
  });

  const formatTime = (date: Date | null) => {
    if (!date) return '-';
    return new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }).format(date);
  };

  // Komponen Helper untuk merender Badge Status yang dinamis
  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case 'PRESENT': return <span className="text-xs font-semibold bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-md">Hadir</span>;
      case 'ABSENT': return <span className="text-xs font-semibold bg-red-100 text-red-700 px-2.5 py-1 rounded-md">Alpa</span>;
      case 'SICK': return <span className="text-xs font-semibold bg-rose-100 text-rose-700 px-2.5 py-1 rounded-md">Sakit</span>;
      case 'ANNUAL': return <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2.5 py-1 rounded-md">Cuti</span>;
      case 'PERMISSION': return <span className="text-xs font-semibold bg-amber-100 text-amber-700 px-2.5 py-1 rounded-md">Izin</span>;
      case 'UNPAID': return <span className="text-xs font-semibold bg-slate-200 text-slate-700 px-2.5 py-1 rounded-md">Unpaid Leave</span>;
      default: return <span className="text-xs font-semibold bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md">{status}</span>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Laporan Kehadiran Harian</h1>
          <p className="text-slate-600">Hasil rangkuman absensi, jam masuk, dan penyelarasan cuti karyawan.</p>
        </div>
        <Link 
          href="/reports/monthly" 
          className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm"
        >
          Lihat Rekap Bulanan &rarr;
        </Link>
      </div>

      <EngineTrigger />

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <h3 className="font-semibold text-slate-800">
            Hasil Kalkulasi: {format(new Date(filterDateStr), 'EEEE, dd MMMM yyyy', { locale: localeID })}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-sm bg-white">
                <th className="py-3 px-4 font-semibold text-slate-700">Nama Pegawai</th>
                <th className="py-3 px-4 font-semibold text-slate-700">Departemen</th>
                <th className="py-3 px-4 font-semibold text-slate-700">Jam Masuk</th>
                <th className="py-3 px-4 font-semibold text-slate-700">Jam Pulang</th>
                <th className="py-3 px-4 font-semibold text-slate-700">Status</th>
                <th className="py-3 px-4 font-semibold text-slate-700">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    Belum ada data absensi untuk tanggal ini. Silakan jalankan Kalkulasi (Engine) di atas.
                  </td>
                </tr>
              ) : (
                records.map((rec: any) => (
                  <tr key={rec.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900">{rec.employee.name}</div>
                      <div className="text-xs text-slate-500">NIP: {rec.employee.nip}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{rec.employee.department?.name || '-'}</td>
                    <td className="py-3 px-4 font-mono font-medium text-indigo-600">{formatTime(rec.checkIn)}</td>
                    <td className="py-3 px-4 font-mono font-medium text-emerald-600">{formatTime(rec.checkOut)}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={rec.status} />
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-xs italic">
                      {rec.notes || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}