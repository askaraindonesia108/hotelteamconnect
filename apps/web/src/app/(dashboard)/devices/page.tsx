import { auth } from '@/lib/auth';
import { prisma } from '@team-connect/database';
import { redirect } from 'next/navigation';
import { CreateDeviceForm, DeleteButton } from './components/ClientComponents';

export const metadata = { title: 'Mesin & Sumber | eL Hotel Malang' };

export default async function DevicesPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const devices = await prisma.device.findMany({
    where: { propertyId: session.user.propertyId },
    orderBy: { machineNumber: 'asc' },
  });

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Master Mesin & Sumber Data</h1>
        <p className="text-slate-600">Daftarkan mesin Fingerspot Revo-185BNC atau sumber lain.</p>
      </div>
      <CreateDeviceForm />
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-sm">
              <th className="py-3 px-4 font-semibold text-slate-700">No. Mesin</th>
              <th className="py-3 px-4 font-semibold text-slate-700">Nama Mesin</th>
              <th className="py-3 px-4 font-semibold text-slate-700">IP Address</th>
              <th className="py-3 px-4 font-semibold text-slate-700">Status</th>
              <th className="py-3 px-4 font-semibold text-slate-700 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {devices.map((d) => (
              <tr key={d.id} className="hover:bg-slate-50/50">
                <td className="py-3 px-4 font-medium text-slate-900">#{d.machineNumber}</td>
                <td className="py-3 px-4 text-slate-900">{d.name}</td>
                <td className="py-3 px-4 font-mono text-slate-600">{d.ipAddress || '-'}</td>
                <td className="py-3 px-4">
                  {d.isActive ? <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">Aktif</span> : <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">Nonaktif</span>}
                </td>
                <td className="py-3 px-4 text-center"><DeleteButton id={d.id} name={d.name} /></td>
              </tr>
            ))}
            {devices.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-slate-500">Belum ada mesin yang didaftarkan.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}