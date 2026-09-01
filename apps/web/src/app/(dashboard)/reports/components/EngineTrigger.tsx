'use client';

import { useState } from 'react';
import { generateDailyAttendance } from '../actions';
import { Calculator, Loader2, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useRouter, useSearchParams } from 'next/navigation';

export function EngineTrigger() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Ambil tanggal dari URL, atau gunakan hari ini
  const initialDate = searchParams.get('date') || format(new Date(), 'yyyy-MM-dd');
  
  const [date, setDate] = useState<string>(initialDate);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; message?: string; error?: string } | null>(null);

  // Otomatis ubah URL saat tanggal dipilih agar tabel di bawah ikut me-refresh
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setDate(newDate);
    router.push(`/reports?date=${newDate}`);
  };

  const handleGenerate = async () => {
    setIsLoading(true);
    setResult(null);
    
    const res = await generateDailyAttendance(date);
    setResult(res);
    setIsLoading(false);
  };

  return (
    <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100 mb-6 flex flex-col md:flex-row items-end gap-4">
      <div className="flex-1 w-full">
        <label className="block text-sm font-semibold text-indigo-900 mb-2">
          Kalkulasi Absensi Harian (Attendance Engine)
        </label>
        <p className="text-xs text-indigo-700 mb-3">
          Pilih tanggal untuk memproses <b>Log Mentah (Raw Scans)</b> menjadi data Jam Masuk & Jam Pulang pegawai.
        </p>
        <input 
          type="date" 
          value={date}
          onChange={handleDateChange}
          className="w-full md:w-64 rounded-lg border border-indigo-200 px-3 py-2 text-slate-900 focus:ring-indigo-500" 
        />
      </div>
      
      <button
        onClick={handleGenerate}
        disabled={isLoading || !date}
        className="w-full md:w-auto bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Menghitung...</> : <><Calculator className="w-4 h-4" /> Proses Absensi</>}
      </button>

      {result?.error && <div className="text-sm text-red-600 bg-red-100 px-4 py-2 rounded-lg">{result.error}</div>}
      {result?.success && <div className="text-sm text-green-700 bg-green-100 px-4 py-2 rounded-lg flex items-center gap-1"><CheckCircle className="w-4 h-4"/> {result.message}</div>}
    </div>
  );
}