'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { CalendarDays } from 'lucide-react';

export function MonthPicker() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const today = new Date();
  const defaultMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const currentMonth = searchParams.get('month') || defaultMonth;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    router.push(`/reports/monthly?month=${e.target.value}`);
  };

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 w-full md:w-auto">
      <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
        <CalendarDays className="w-5 h-5" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">
          Pilih Periode Bulan
        </label>
        <input 
          type="month" 
          value={currentMonth}
          onChange={handleChange}
          className="text-sm font-medium text-slate-900 border-none p-0 focus:ring-0 cursor-pointer"
        />
      </div>
    </div>
  );
}