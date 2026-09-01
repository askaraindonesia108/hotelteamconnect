import { auth } from '@/lib/auth';
import { prisma } from '@team-connect/database';
import { redirect } from 'next/navigation';
import { Fingerprint, AlertCircle } from 'lucide-react';

export const metadata = { title: 'Log Absen Mentah | Hotel Team Connect' };

export default async function RawScansPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  // 1. Ambil 200 log absensi terbaru
  const rawScans = await prisma.rawScan.findMany({
    where: { propertyId: session.user.propertyId },
    orderBy: { scannedAtUtc: 'desc' },
    take: 200,
  });

  // 2. Ambil data pegawai untuk mencocokkan nama berdasarkan PIN Mesin
  const employees = await prisma.employee.findMany({
    where: { propertyId: session.user.propertyId },
    select: { 
      machinePin: true, 
      name: true, 
      department: { select: { name: true } } 
    },
  });

  // 3. Buat kamus (Map) agar pencarian nama pegawai super cepat
  const employeeMap = new Map();
  employees.forEach(emp => {
    if (emp.machinePin) employeeMap.set(emp.machinePin, emp);
  });

  // Fungsi untuk memformat tanggal ke format Indonesia
  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      timeZone: 'Asia/Jakarta' // Standar Waktu Indonesia Barat
    }).format(date);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Log Absensi Mentah (Raw Scans)</h1>
          <p className="text-slate-600">Rekam jejak absensi asli dari mesin. Bersifat read-only dan tidak dapat diubah.</p>
        </div>
        <div className="bg-amber-50 text-amber-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 border border-amber-200">
          <AlertCircle className="w-4 h-4" />
          Data Immutable (Anti-Manipulasi)
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white text-sm">
                <th className="py-3 px-4 font-semibold">Waktu Scan (WIB)</th>
                <th className="py-3 px-4 font-semibold">PIN Mesin</th>
                <th className="py-3 px-4 font-semibold">Identitas Pegawai</th>
                <th className="py-3 px-4 font-semibold">Departemen</th>
                <th className="py-3 px-4 font-semibold">Sumber</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {rawScans.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    <Fingerprint className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                    Belum ada log absensi yang ditarik dari mesin.
                  </td>
                </tr>
              ) : (
                rawScans.map((scan) => {
                  const emp = employeeMap.get(scan.employeePin);
                  
                  return (
                    <tr key={scan.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-slate-900">
                        {formatDateTime(scan.scannedAtUtc)}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {scan.employeePin}
                      </td>
                      <td className="py-3 px-4">
                        {emp ? (
                          <span className="font-medium text-slate-900">{emp.name}</span>
                        ) : (
                          <span className="text-red-500 italic text-xs font-medium bg-red-50 px-2 py-1 rounded-md border border-red-100">
                            Tidak Terdaftar
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {emp ? emp.department.name : '-'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {scan.sourceType}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="bg-slate-50 p-4 text-xs text-slate-500 text-center border-t border-slate-200">
          Menampilkan maksimal 200 data log terbaru.
        </div>
      </div>
    </div>
  );
}