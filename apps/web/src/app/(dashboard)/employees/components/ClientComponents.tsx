'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { createEmployee, deleteEmployee } from '../actions';
import { Trash2, Plus, Users } from 'lucide-react';
import { useRef, useEffect } from 'react';

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
    >
      {pending ? (
        'Menyimpan...'
      ) : (
        <>
          <Plus className="w-4 h-4" /> Simpan Pegawai
        </>
      )}
    </button>
  );
}

interface RelationalData {
  id: string;
  name: string;
}

interface FormProps {
  departments: RelationalData[];
  positions: RelationalData[];
  statuses: RelationalData[];
}

export function CreateEmployeeForm({ departments, positions, statuses }: FormProps) {
  const [state, formAction] = useFormState(createEmployee, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
    }
  }, [state?.success]);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-slate-500" />
        <h3 className="text-lg font-semibold text-slate-800">Tambah Pegawai Baru</h3>
      </div>
      
      <form ref={formRef} action={formAction} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">NIP <span className="text-red-500">*</span></label>
          <input type="text" name="nip" required placeholder="NIP Internal" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:ring-2 focus:ring-slate-900/20" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">PIN Mesin Absen (Opsional)</label>
          <input type="text" name="machinePin" placeholder="ID di Mesin Fingerspot" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:ring-2 focus:ring-slate-900/20" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap <span className="text-red-500">*</span></label>
          <input type="text" name="name" required placeholder="Nama Pegawai" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:ring-2 focus:ring-slate-900/20" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Departemen <span className="text-red-500">*</span></label>
          <select name="departmentId" required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 bg-white focus:ring-2 focus:ring-slate-900/20">
            <option value="">-- Pilih Departemen --</option>
            {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Jabatan <span className="text-red-500">*</span></label>
          <select name="positionId" required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 bg-white focus:ring-2 focus:ring-slate-900/20">
            <option value="">-- Pilih Jabatan --</option>
            {positions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Status Karyawan <span className="text-red-500">*</span></label>
          <select name="employmentStatusId" required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 bg-white focus:ring-2 focus:ring-slate-900/20">
            <option value="">-- Pilih Status --</option>
            {statuses.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Masuk <span className="text-red-500">*</span></label>
          <input type="date" name="joinDate" required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:ring-2 focus:ring-slate-900/20" />
        </div>

        <div className="md:col-span-2 flex items-end">
          <div className="w-full md:w-1/2 ml-auto pt-4 md:pt-0">
             <SubmitButton />
          </div>
        </div>
      </form>

      {state?.error && <p className="mt-4 text-sm text-red-600 font-medium bg-red-50 p-3 rounded-lg border border-red-100">{state.error}</p>}
      {state?.success && <p className="mt-4 text-sm text-green-600 font-medium bg-green-50 p-3 rounded-lg border border-green-100">{state.message}</p>}
    </div>
  );
}

export function DeleteButton({ id, name }: { id: string, name: string }) {
  const handleDelete = async () => {
    if (confirm(`Apakah Anda yakin ingin menghapus data "${name}"?`)) {
      const res = await deleteEmployee(id);
      if (res?.error) alert(res.error);
    }
  };

  return (
    <button
      onClick={handleDelete}
      className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-lg transition-colors"
      title="Hapus Pegawai"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}