import { auth } from '@/lib/auth';
import { prisma } from '@team-connect/database';
import { redirect } from 'next/navigation';
import { CreateLeaveForm, DeleteButton } from './components/ClientComponents';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export const metadata = { title: 'Cuti & Izin | Hotel Team Connect' };

const typeMap: Record<string, { label: string, color: string }> = {
  SICK: { label: 'Sakit', color: 'bg-red-100 text-red-700' },
  ANNUAL: { label: 'Cuti Tahunan', color: 'bg-blue-100 text-blue-700' },
  PERMISSION: { label: 'Izin', color: 'bg-amber-100 text-amber-700' },
  UNPAID: { label: 'Unpaid Leave', color: 'bg-slate-200 text-slate-700' },
};

export default async function LeavesPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const employees = await prisma.employee.findMany({
    where: { propertyId: session.user.propertyId, isActive: true },
    select: { id: true, name: true },
    orderBy: { name: 'asc' }
  });

  const leaves = await prisma.leaveRequest.findMany({
    where: { propertyId: session.user.propertyId },
    include: { employee: { select: { name: true, nip: true } } },
    orderBy: { startDate: 'desc' },
  });

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Master Cuti & Izin</h1>
        <p className="text-slate-600">Catat dan kelola data ketidakhadiran dengan alasan sah.</p>
      </div>

      <CreateLeaveForm employees={employees} />

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-sm">
              <th className="py-3 px-4 font-semibold text-slate-700">Nama Pegawai</th>
              <th className="py-3 px-4 font-semibold text-slate-700">Jenis</th>
              <th className="py-3 px-4 font-semibold text-slate-700">Tanggal</th>
              <th className="py-3 px-4 font-semibold text-slate-700">Keterangan</th>
              <th className="py-3 px-4 font-semibold text-slate-700 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {leaves.map((l) => (
              <tr key={l.id} className="hover:bg-slate-50/50">
                <td className="py-3 px-4">
                  <div className="font-medium text-slate-900">{l.employee.name}</div>
                  <div className="text-xs text-slate-500">NIP: {l.employee.nip}</div>
                </td>
                <td className="py-3 px-4">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${typeMap[l.type]?.color || 'bg-slate-100'}`}>
                    {typeMap[l.type]?.label || l.type}
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-600">
                  {format(l.startDate, 'dd MMM yyyy', { locale: id })}
                  {l.startDate.getTime() !== l.endDate.getTime() && ` - ${format(l.endDate, 'dd MMM yyyy', { locale: id })}`}
                </td>
                <td className="py-3 px-4 text-slate-600">{l.reason || '-'}</td>
                <td className="py-3 px-4 text-center"><DeleteButton id={l.id} /></td>
              </tr>
            ))}
            {leaves.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-slate-500">Belum ada data cuti yang dicatat.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}