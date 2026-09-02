import { auth } from '@/lib/auth';
import { prisma } from '@team-connect/database';
import { redirect } from 'next/navigation';
import { CreateEmployeeForm, DeleteButton } from './components/ClientComponents';

export const metadata = { title: 'Pegawai | Hotel Team Connect' };

export default async function EmployeesPage() {
  try {
    const session = await auth();
    if (!session?.user) redirect('/login');

    const { organizationId, propertyId } = session.user;

    // PROTEKSI: Mencegah error jika propertyId/organizationId kosong (undefined)
    if (!organizationId || !propertyId) {
      throw new Error("Data ID Organisasi atau Properti tidak ditemukan pada sesi Anda. Silakan relog (keluar dan masuk kembali).");
    }

    // 1. Auto-Seed Status Kepegawaian jika masih kosong
    const statusCount = await prisma.employmentStatus.count({ where: { propertyId } });
    if (statusCount === 0) {
      await prisma.employmentStatus.createMany({
        data: [
          { name: 'Tetap', organizationId, propertyId },
          { name: 'Kontrak', organizationId, propertyId },
          { name: 'Probation', organizationId, propertyId },
          { name: 'Harian Lepas', organizationId, propertyId },
        ]
      });
    }

    // 2. Mengambil data relasi untuk Dropdown (Hanya id dan nama untuk efisiensi)
    const departments = await prisma.department.findMany({ where: { propertyId }, select: { id: true, name: true } });
    const positions = await prisma.position.findMany({ where: { propertyId }, select: { id: true, name: true } });
    const statuses = await prisma.employmentStatus.findMany({ where: { propertyId }, select: { id: true, name: true } });

    // 3. Mengambil daftar Pegawai beserta relasinya
    const employees = await prisma.employee.findMany({
      where: { propertyId },
      include: {
        department: true,
        position: true,
        employmentStatus: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return (
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Master Pegawai</h1>
          <p className="text-slate-600">Kelola data induk karyawan dan pemetaan PIN mesin.</p>
        </div>

        <CreateEmployeeForm departments={departments} positions={positions} statuses={statuses} />

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-sm whitespace-nowrap">
                  <th className="py-3 px-4 font-semibold text-slate-700">NIP / PIN</th>
                  <th className="py-3 px-4 font-semibold text-slate-700">Nama Lengkap</th>
                  <th className="py-3 px-4 font-semibold text-slate-700">Departemen</th>
                  <th className="py-3 px-4 font-semibold text-slate-700">Jabatan</th>
                  <th className="py-3 px-4 font-semibold text-slate-700">Status</th>
                  <th className="py-3 px-4 font-semibold text-slate-700 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {employees.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      Belum ada data pegawai. Silakan isi form di atas.
                    </td>
                  </tr>
                ) : (
                  employees.map((emp: any) => (
                    <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900">{emp.nip}</div>
                        <div className="text-xs text-slate-500">PIN: {emp.machinePin || 'Belum di-set'}</div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900">{emp.name}</td>
                      <td className="py-3 px-4 text-slate-600">{emp.department?.name || '-'}</td>
                      <td className="py-3 px-4 text-slate-600">{emp.position?.name || '-'}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          {emp.employmentStatus?.name || '-'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <DeleteButton id={emp.id} name={emp.name} />
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
  } catch (error: any) {
    return (
      <div className="max-w-6xl mx-auto mt-10 p-8 bg-red-50 rounded-2xl border border-red-200 shadow-sm">
        <h2 className="text-2xl font-bold text-red-700 mb-4">🚨 Radar Vercel: Halaman Pegawai Gagal Dimuat</h2>
        <p className="text-red-800 font-medium mb-2">Pesan Error Asli:</p>
        <pre className="bg-white p-5 rounded-xl border border-red-200 text-sm font-mono text-red-600 overflow-auto whitespace-pre-wrap shadow-inner">
          {error?.message || String(error)}
        </pre>
      </div>
    );
  }
}