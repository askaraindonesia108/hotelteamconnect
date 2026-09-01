import { auth } from '@/lib/auth';
import { prisma } from '@team-connect/database';
import { redirect } from 'next/navigation';
import { CreateDepartmentForm, DeleteButton } from './components/ClientComponents';

export const metadata = {
  title: 'Departemen | eL Hotel Malang',
};

export default async function DepartmentsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  // Mengambil daftar departemen milik property ini saja
  const departments = await prisma.department.findMany({
    where: {
      propertyId: session.user.propertyId,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Master Departemen</h1>
        <p className="text-slate-600">Kelola struktur departemen pada properti ini.</p>
      </div>

      <CreateDepartmentForm />

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-sm">
                <th className="py-3 px-6 font-semibold text-slate-700">Nama Departemen</th>
                <th className="py-3 px-6 font-semibold text-slate-700">Kode</th>
                <th className="py-3 px-6 font-semibold text-slate-700 text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {departments.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-slate-500">
                    Belum ada departemen yang ditambahkan.
                  </td>
                </tr>
              ) : (
                departments.map((dept) => (
                  <tr key={dept.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-6 text-slate-900 font-medium">
                      {dept.name}
                    </td>
                    <td className="py-3 px-6 text-slate-600">
                      {dept.code || '-'}
                    </td>
                    <td className="py-3 px-6 text-center">
                      <DeleteButton id={dept.id} departmentName={dept.name} />
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