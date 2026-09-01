'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { createDepartment, deleteDepartment } from '../actions';
import { Trash2, Plus, Building2 } from 'lucide-react';
import { useRef, useEffect } from 'react';

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center gap-2"
    >
      {pending ? (
        'Menyimpan...'
      ) : (
        <>
          <Plus className="w-4 h-4" /> Tambah Departemen
        </>
      )}
    </button>
  );
}

export function CreateDepartmentForm() {
  const [state, formAction] = useFormState(createDepartment, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  // Reset form jika sukses
  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
    }
  }, [state?.success]);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Building2 className="w-5 h-5 text-slate-500" />
        <h3 className="text-lg font-semibold text-slate-800">Tambah Departemen Baru</h3>
      </div>
      
      <form ref={formRef} action={formAction} className="flex flex-col md:flex-row items-start md:items-end gap-4">
        <div className="w-full md:flex-1">
          <label className="block text-sm font-medium text-slate-700 mb-1">Nama Departemen <span className="text-red-500">*</span></label>
          <input
            type="text"
            name="name"
            required
            placeholder="Contoh: Front Office"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900"
          />
        </div>
        <div className="w-full md:w-64">
          <label className="block text-sm font-medium text-slate-700 mb-1">Kode (Opsional)</label>
          <input
            type="text"
            name="code"
            placeholder="Contoh: FO"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900"
          />
        </div>
        <div className="w-full md:w-auto mt-4 md:mt-0">
          <SubmitButton />
        </div>
      </form>

      {state?.error && (
        <p className="mt-3 text-sm text-red-600 font-medium">{state.error}</p>
      )}
      {state?.success && (
        <p className="mt-3 text-sm text-green-600 font-medium">{state.message}</p>
      )}
    </div>
  );
}

export function DeleteButton({ id, departmentName }: { id: string, departmentName: string }) {
  const handleDelete = async () => {
    if (confirm(`Apakah Anda yakin ingin menghapus departemen "${departmentName}"?`)) {
      const res = await deleteDepartment(id);
      if (res?.error) {
        alert(res.error);
      }
    }
  };

  return (
    <button
      onClick={handleDelete}
      className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-lg transition-colors"
      title="Hapus Departemen"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}