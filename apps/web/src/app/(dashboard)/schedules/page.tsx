import { auth } from '@/lib/auth';
import { prisma } from '@team-connect/database';
import { redirect } from 'next/navigation';
import { CreateShiftForm, DeleteButton } from './components/ClientComponents';

export const metadata = { title: 'Shift & Jadwal | Hotel Team Connect' };

export default async function SchedulesPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const shifts = await prisma.shift.findMany({
    where: { propertyId: session.user.propertyId },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Master Shift & Jadwal</h1>
        <p className="text-slate-600">Atur jam kerja normal dan shift lintas malam.</p>
      </div>
      <CreateShiftForm />
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-sm">
              <th className="py-3 px-4 font-semibold text-slate-700">Kode</th>
              <th className="py-3 px-4 font-semibold text-slate-700">Nama Shift</th>
              <th className="py-3 px-4 font-semibold text-slate-700">Jam Kerja</th>
              <th className="py-3 px-4 font-semibold text-slate-700">Toleransi</th>
              <th className="py-3 px-4 font-semibold text-slate-700">Status</th>
              <th className="py-3 px-4 font-semibold text-slate-700 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {shifts.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50/50">
                <td className="py-3 px-4 font-medium text-slate-900">{s.code}</td>
                <td className="py-3 px-4 text-slate-600">{s.name}</td>
                <td className="py-3 px-4 font-mono text-slate-600">{s.startTime} - {s.endTime}</td>
                <td className="py-3 px-4 text-slate-600">{s.gracePeriodMin} mnt</td>
                <td className="py-3 px-4">
                  {s.isNightShift ? <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-medium">Lintas Malam</span> : <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">Normal</span>}
                </td>
                <td className="py-3 px-4 text-center"><DeleteButton id={s.id} name={s.name} /></td>
              </tr>
            ))}
            {shifts.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-slate-500">Belum ada shift.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}