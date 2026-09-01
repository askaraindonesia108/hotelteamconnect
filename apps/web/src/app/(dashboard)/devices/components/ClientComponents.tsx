'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { createDevice, deleteDevice } from '../actions';
import { Trash2, Plus, Laptop } from 'lucide-react';
import { useRef, useEffect } from 'react';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="w-full bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center gap-2">
      {pending ? 'Menyimpan...' : <><Plus className="w-4 h-4" /> Daftarkan Mesin</>}
    </button>
  );
}

export function CreateDeviceForm() {
  const [state, formAction] = useFormState(createDevice, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => { if (state?.success) formRef.current?.reset(); }, [state?.success]);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Laptop className="w-5 h-5 text-slate-500" />
        <h3 className="text-lg font-semibold text-slate-800">Daftarkan Mesin Baru</h3>
      </div>
      
      <form ref={formRef} action={formAction} className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nama Mesin *</label>
          <input type="text" name="name" required placeholder="Cth: Mesin Lobby" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:ring-slate-900/20" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nomor Mesin (ID) *</label>
          <input type="number" name="machineNumber" required min="1" placeholder="Cth: 1" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:ring-slate-900/20" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">IP Address</label>
          <input type="text" name="ipAddress" placeholder="192.168.88.100" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:ring-slate-900/20" />
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

export function DeleteButton({ id, name }: { id: string, name: string }) {
  const handleDelete = async () => {
    if (confirm(`Hapus mesin "${name}"?`)) {
      const res = await deleteDevice(id);
      if (res?.error) alert(res.error);
    }
  };
  return <button onClick={handleDelete} className="text-red-600 hover:bg-red-50 p-2 rounded-lg" title="Hapus"><Trash2 className="w-4 h-4" /></button>;
}