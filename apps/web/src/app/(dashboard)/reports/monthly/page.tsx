import { auth } from '@/lib/auth';
import { prisma } from '@team-connect/database';
import { redirect } from 'next/navigation';
import { MonthPicker } from './components/MonthPicker';
import { format } from 'date-fns';
import { id as localeID } from 'date-fns/locale';
import Link from 'next/link';
import { ArrowLeft, FileSpreadsheet } from 'lucide-react';

export const metadata = { title: 'Rekap Bulanan | Hotel Team Connect' };

export default async function MonthlyReportPage({
  searchParams,
}: {
  searchParams: { month?: string };
}) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  // Tentukan rentang waktu bulan yang dipilih
  const today = new Date();
  const monthParam = searchParams.month || `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const [yearStr, monthStr] = monthParam.split('-');
  
  // Tanggal 1 awal bulan s/d hari terakhir di bulan tersebut (Format UTC)
  const startDate = new Date(Date.UTC(Number(yearStr), Number(monthStr) - 1, 1));
  const endDate = new Date(Date.UTC(Number(yearStr), Number(monthStr), 0, 23, 59, 59, 999));

  // Ambil semua pegawai beserta data absensinya HANYA di bulan tersebut
  const employees = await prisma.employee.findMany({
    where: { propertyId: session.user.propertyId, isActive: true },
    include: {
      department: { select: { name: true } },
      attendanceRecords: {
        where: { date: { gte: startDate, lte: endDate } },
        select: { status: true }
      }
    },
    orderBy: { name: 'asc' }
  });

  // Agregasi (Kalkulasi) data per pegawai
  const reportData = employees.map(emp => {
    let present = 0;
    let absent = 0;
    let sick = 0;
    let leave = 0;

    emp.attendanceRecords.forEach(rec => {
      if (rec.status === 'PRESENT') present++;
      else if (rec.status === 'ABSENT') absent++;
      else if (rec.status === 'SICK') sick++;
      else if (rec.status === 'ANNUAL' || rec.status === 'PERMISSION') leave++;
    });

    return {
      id: emp.id,
      name: emp.name,
      nip: emp.nip,
      department: emp.department?.name || '-',
      present,
      absent,
      sick,
      leave,
      totalRecords: emp.attendanceRecords.length
    };
  });

  return (
    <div className="max-w-7xl mx-auto">
      
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <Link href="/reports" className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 mb-2">
            <ArrowLeft className="w-4 h-4" /> Kembali ke Laporan Harian
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Rekap Absensi Bulanan</h1>
          <p className="text-slate-600">Ringkasan total kehadiran karyawan untuk keperluan payroll.</p>
        </div>
        <div className="flex items-center gap-3">
          <MonthPicker />
          <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 shadow-sm">
            <FileSpreadsheet className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <h3 className="font-semibold text-slate-800">
            Periode: {format(startDate, 'MMMM yyyy', { locale: localeID })}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-sm bg-white">
                <th className="py-3 px-4 font-semibold text-slate-700">Nama Pegawai</th>
                <th className="py-3 px-4 font-semibold text-slate-700">Departemen</th>
                <th className="py-3 px-4 font-semibold text-emerald-700 text-center">Hadir</th>
                <th className="py-3 px-4 font-semibold text-rose-700 text-center">Sakit</th>
                <th className="py-3 px-4 font-semibold text-amber-700 text-center">Cuti/Izin</th>
                <th className="py-3 px-4 font-semibold text-red-700 text-center">Alpa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {reportData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    Tidak ada pegawai aktif.
                  </td>
                </tr>
              ) : (
                reportData.map((data) => (
                  <tr key={data.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900">{data.name}</div>
                      <div className="text-xs text-slate-500">NIP: {data.nip}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{data.department}</td>
                    
                    {/* Statistik Angka */}
                    <td className="py-3 px-4 text-center">
                      <span className="font-bold text-emerald-600">{data.present}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-bold text-rose-600">{data.sick}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-bold text-amber-600">{data.leave}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-bold text-red-600">{data.absent}</span>
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