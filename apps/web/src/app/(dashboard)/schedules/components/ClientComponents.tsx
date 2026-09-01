'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { createShift, deleteShift } from '../actions';
import { Trash2, Plus, Clock } from 'lucide-react';
import { useRef, useEffect } from 'react';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="w-full bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center gap-2">
      {pending ? 'Menyimpan...' : <><Plus className="w-4 h-4" /> Simpan Shift</>}
    </button>
  );
}

export function CreateShiftForm() {
  const [state, formAction] = useFormState(createShift, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => { if (state?.success) formRef.current?.reset(); }, [state?.success]);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-slate-500" />
        <h3 className="text-lg font-semibold text-slate-800">Tambah Shift Baru</h3>
      </div>
      
      <form ref={formRef} action={formAction} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nama Shift *</label>
          <input type="text" name="name" required placeholder="Contoh: Shift Pagi" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:ring-2 focus:ring-slate-900/20" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Kode Shift *</label>
          <input type="text" name="code" required placeholder="Contoh: PGI" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:ring-2 focus:ring-slate-900/20" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Toleransi Telat (Menit) *</label>
          <input type="number" name="gracePeriodMin" defaultValue="0" min="0" required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:ring-2 focus:ring-slate-900/20" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Jam Mulai (HH:mm) *</label>
          <input type="time" name="startTime" required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:ring-2 focus:ring-slate-900/20" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Jam Selesai (HH:mm) *</label>
          <input type="time" name="endTime" required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:ring-2 focus:ring-slate-900/20" />
        </div>
        <div className="flex flex-col justify-end">
          <div className="flex items-center gap-2 mb-3">
            <input type="checkbox" name="isNightShift" id="isNightShift" className="w-4 h-4 text-slate-900 border-slate-300 rounded focus:ring-slate-900" />
            <label htmlFor="isNightShift" className="text-sm font-medium text-slate-700 cursor-pointer">Shift Lintas Malam (Ganti Hari)</label>
          </div>
          <SubmitButton />
        </div>
      </form>
      {state?.error && <p className="mt-4 text-sm text-red-600 font-medium">{state.error}</p>}
      {state?.success && <p className="mt-4 text-sm text-green-600 font-medium">{state.message}</p>}
    </div>
  );
}

export function DeleteButton({ id, name }: { id: string, name: string }) {
  const handleDelete = async () => {
    if (confirm(`Hapus shift "${name}"?`)) {
      const res = await deleteShift(id);
      if (res?.error) alert(res.error);
    }
  };
  return (
    <button onClick={handleDelete} className="text-red-600 hover:bg-red-50 p-2 rounded-lg" title="Hapus"><Trash2 className="w-4 h-4" /></button>
  );
}