import { auth } from '@/lib/auth';
import { prisma } from '@team-connect/database';
import { redirect } from 'next/navigation';
import { EngineTrigger } from './components/EngineTrigger';
import { format } from 'date-fns';

export const metadata = { title: 'Laporan Absensi | eL Hotel Malang' };

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: { date?: string };
}) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  // Ambil tanggal dari parameter URL atau gunakan hari ini
  const filterDateStr = searchParams.date || format(new Date(), 'yyyy-MM-dd');
  
  // Paksa menjadi UTC absolut agar tidak bergeser ke hari sebelumnya
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

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Laporan Kehadiran Harian</h1>
        <p className="text-slate-600">Hasil rangkuman absensi, jam masuk, dan jam pulang karyawan.</p>
      </div>

      <EngineTrigger />

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <h3 className="font-semibold text-slate-800">
            Hasil Kalkulasi: {format(new Date(filterDateStr), 'dd MMMM yyyy')}
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
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    Belum ada data absensi untuk tanggal ini. Silakan jalankan Kalkulasi (Engine) di atas.
                  </td>
                </tr>
              ) : (
                records.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900">{rec.employee.name}</div>
                      <div className="text-xs text-slate-500">NIP: {rec.employee.nip}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{rec.employee.department?.name || '-'}</td>
                    <td className="py-3 px-4 font-mono font-medium text-indigo-600">{formatTime(rec.checkIn)}</td>
                    <td className="py-3 px-4 font-mono font-medium text-emerald-600">{formatTime(rec.checkOut)}</td>
                    <td className="py-3 px-4">
                      {rec.status === 'PRESENT' ? (
                        <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-1 rounded-full">Hadir</span>
                      ) : (
                        <span className="text-xs font-semibold bg-red-100 text-red-700 px-2 py-1 rounded-full">Alpa</span>
                      )}
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