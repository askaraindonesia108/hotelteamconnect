'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { createPosition, deletePosition } from '../actions';
import { Trash2, Plus, Briefcase } from 'lucide-react';
import { useRef, useEffect } from 'react';

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
    >
      {pending ? (
        'Menyimpan...'
      ) : (
        <>
          <Plus className="w-4 h-4" /> Tambah Jabatan
        </>
      )}
    </button>
  );
}

export function CreatePositionForm() {
  const [state, formAction] = useFormState(createPosition, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
    }
  }, [state?.success]);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Briefcase className="w-5 h-5 text-slate-500" />
        <h3 className="text-lg font-semibold text-slate-800">Tambah Jabatan Baru</h3>
      </div>
      
      <form ref={formRef} action={formAction} className="flex flex-col md:flex-row items-start md:items-end gap-4">
        <div className="w-full md:flex-1">
          <label className="block text-sm font-medium text-slate-700 mb-1">Nama Jabatan <span className="text-red-500">*</span></label>
          <input
            type="text"
            name="name"
            required
            placeholder="Contoh: General Manager"
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

export function DeleteButton({ id, positionName }: { id: string, positionName: string }) {
  const handleDelete = async () => {
    if (confirm(`Apakah Anda yakin ingin menghapus jabatan "${positionName}"?`)) {
      const res = await deletePosition(id);
      if (res?.error) {
        alert(res.error);
      }
    }
  };

  return (
    <button
      onClick={handleDelete}
      className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-lg transition-colors"
      title="Hapus Jabatan"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}