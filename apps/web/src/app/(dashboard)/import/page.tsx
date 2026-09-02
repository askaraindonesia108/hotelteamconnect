import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { CsvWizard } from './components/CsvWizard';

export const metadata = { title: 'Import Center | Hotel Team Connect' };

export default async function ImportCenterPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  return (
    <div className="max-w-4xl mx-auto pb-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Import Center</h1>
        <p className="text-slate-600">Pusat sinkronisasi dan unggah log kehadiran mentah secara aman.</p>
      </div>

      {/* ZONA 1: Agen Sinkronisasi Lokal (LAN) */}
      <div className="mb-8 bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-900">Tarik Data Mesin (LAN / WiFi)</h2>
          <p className="text-sm text-slate-600 mt-1">
            Gunakan Agen Sinkronisasi Lokal untuk menarik data langsung dari mesin absen ke cloud secara otomatis tanpa flashdisk.
          </p>
        </div>
        
        <div className="p-6">
          <div className="p-5 bg-indigo-50 border border-indigo-100 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="flex-1">
              <h3 className="font-semibold text-indigo-900">Team Connect Agent (.exe)</h3>
              <p className="text-sm text-indigo-700 mt-1">
                Jalankan aplikasi ini di PC/Laptop HRD yang berada di satu jaringan lokal dengan mesin absensi.
              </p>
              
              <div className="mt-4 p-3 bg-white/60 rounded border border-indigo-100">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Kredensial Setup Agen:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <span className="text-xs text-slate-500 block">ID Organisasi:</span>
                    <code className="text-xs font-mono font-bold text-indigo-700 bg-indigo-100/50 px-1.5 py-0.5 rounded select-all">
                      {session.user.organizationId}
                    </code>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">ID Properti:</span>
                    <code className="text-xs font-mono font-bold text-indigo-700 bg-indigo-100/50 px-1.5 py-0.5 rounded select-all">
                      {session.user.propertyId}
                    </code>
                  </div>
                </div>
              </div>
            </div>
            
            <a 
              href="/TeamConnectAgent.exe" 
              download 
              className="shrink-0 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-all shadow-sm text-center flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
              Download Agent
            </a>
          </div>
        </div>
      </div>

      {/* ZONA 2: Import CSV Manual */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-900">Import File CSV Manual</h2>
          <p className="text-sm text-slate-600 mt-1">
            Opsi alternatif jika Anda sedang berada di luar jaringan atau mengunduh data secara manual via Flashdisk USB.
          </p>
        </div>
        <div className="p-6">
          <CsvWizard />
        </div>
      </div>
    </div>
  );
}