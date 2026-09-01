'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { createLeaveRequest, deleteLeaveRequest } from '../actions';
import { Trash2, Plus, CalendarX2 } from 'lucide-react';
import { useRef, useEffect } from 'react';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="w-full bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center gap-2">
      {pending ? 'Menyimpan...' : <><Plus className="w-4 h-4" /> Simpan Data</>}
    </button>
  );
}

export function CreateLeaveForm({ employees }: { employees: { id: string, name: string }[] }) {
  const [state, formAction] = useFormState(createLeaveRequest, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => { if (state?.success) formRef.current?.reset(); }, [state?.success]);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <CalendarX2 className="w-5 h-5 text-slate-500" />
        <h3 className="text-lg font-semibold text-slate-800">Catat Cuti / Izin Pegawai</h3>
      </div>
      
      <form ref={formRef} action={formAction} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">Nama Pegawai *</label>
          <select name="employeeId" required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:ring-slate-900/20">
            <option value="">-- Pilih Pegawai --</option>
            {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
          </select>
        </div>
        
        <div className="lg:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">Jenis *</label>
          <select name="type" required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:ring-slate-900/20">
            <option value="">-- Pilih Jenis --</option>
            <option value="SICK">Sakit</option>
            <option value="ANNUAL">Cuti Tahunan</option>
            <option value="PERMISSION">Izin Keperluan Pribadi</option>
            <option value="UNPAID">Cuti di Luar Tanggungan</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Mulai *</label>
          <input type="date" name="startDate" required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:ring-slate-900/20" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Selesai *</label>
          <input type="date" name="endDate" required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:ring-slate-900/20" />
        </div>

        <div className="lg:col-span-3">
          <label className="block text-sm font-medium text-slate-700 mb-1">Keterangan / Alasan</label>
          <input type="text" name="reason" placeholder="Contoh: Surat dokter terlampir" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:ring-slate-900/20" />
        </div>

        <div className="flex items-end">
          <SubmitButton />
        </div>
      </form>
      {state?.error && <p className="mt-4 text-sm text-red-600 font-medium">{state.error}</p>}
      {state?.success && <p className="mt-4 text-sm text-green-600 font-medium">{state.message}</p>}
    </div>
  );
}

export function DeleteButton({ id }: { id: string }) {
  const handleDelete = async () => {
    if (confirm('Hapus data izin ini?')) {
      const res = await deleteLeaveRequest(id);
      if (res?.error) alert(res.error);
    }
  };
  return <button onClick={handleDelete} className="text-red-600 hover:bg-red-50 p-2 rounded-lg" title="Hapus"><Trash2 className="w-4 h-4" /></button>;
}