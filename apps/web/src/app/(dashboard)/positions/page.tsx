import { auth } from '@/lib/auth';
import { prisma } from '@team-connect/database';
import { redirect } from 'next/navigation';
import { CreatePositionForm, DeleteButton } from './components/ClientComponents';

export const metadata = {
  title: 'Jabatan | Hotel Team Connect',
};

export default async function PositionsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const positions = await prisma.position.findMany({
    where: {
      propertyId: session.user.propertyId,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Master Jabatan</h1>
        <p className="text-slate-600">Kelola daftar jabatan yang ada pada properti ini.</p>
      </div>

      <CreatePositionForm />

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-sm">
                <th className="py-3 px-6 font-semibold text-slate-700">Nama Jabatan</th>
                <th className="py-3 px-6 font-semibold text-slate-700 text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {positions.length === 0 ? (
                <tr>
                  <td colSpan={2} className="py-8 text-center text-slate-500">
                    Belum ada jabatan yang ditambahkan.
                  </td>
                </tr>
              ) : (
                positions.map((pos) => (
                  <tr key={pos.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-6 text-slate-900 font-medium">
                      {pos.name}
                    </td>
                    <td className="py-3 px-6 text-center">
                      <DeleteButton id={pos.id} positionName={pos.name} />
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