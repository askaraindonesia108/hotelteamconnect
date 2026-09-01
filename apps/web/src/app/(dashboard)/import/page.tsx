import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { CsvWizard } from './components/CsvWizard';

export const metadata = { title: 'Import Center | Hotel Team Connect' };

export default async function ImportCenterPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Import Center</h1>
        <p className="text-slate-600">Unggah log kehadiran mentah secara aman tanpa duplikasi.</p>
      </div>

      {/* Bagian CSV Adapter */}
      <CsvWizard />
    </div>
  );
}