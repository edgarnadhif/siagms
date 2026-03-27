"use client";

import { useActionState, useEffect } from "react";
import { createProject } from "@/app/actions";
import { useRouter } from "next/navigation";

export default function AddProjectModal() {
  const [state, formAction, isPending] = useActionState(createProject, null);
  const router = useRouter();

  useEffect(() => {
    if (state?.success) {
      router.push("/dashboard/projek");
      router.refresh();
    }
  }, [state, router]);

  const handleClose = () => {
    router.push("/dashboard/projek");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden relative border border-gray-200 dark:border-slate-700">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Tambah Proyek</h2>
          
          <form action={formAction} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Kode Proyek *</label>
                <input required type="text" name="code" placeholder="Masukan" className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-transparent text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-red-500 outline-none transition-shadow" />
              </div>
              <div className="relative">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Status *</label>
                <select required name="status" className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-transparent text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-red-500 appearance-none outline-none transition-shadow">
                  <option value="AKTIF" className="text-gray-900">Aktif</option>
                  <option value="SELESAI" className="text-gray-900">Selesai</option>
                  <option value="BATAL" className="text-gray-900">Batal</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-400 top-5">
                  <svg className="fill-current w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Nama Proyek *</label>
              <input required type="text" name="name" placeholder="Masukan" className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-transparent text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-red-500 outline-none transition-shadow" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Deskripsi Proyek</label>
              <textarea name="description" placeholder="Optional" rows={3} className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-transparent text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-red-500 outline-none transition-shadow resize-none"></textarea>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-semibold text-gray-700 dark:text-gray-300 mb-1">Tanggal Mulai</label>
                <input type="date" name="startDate" className="w-full px-2 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-xs bg-transparent text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-red-500 outline-none transition-shadow" />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-gray-700 dark:text-gray-300 mb-1">Tanggal selesai</label>
                <input type="date" name="endDate" className="w-full px-2 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-xs bg-transparent text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-red-500 outline-none transition-shadow" />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-gray-700 dark:text-gray-300 mb-1">Budget (Rp)</label>
                <input type="number" name="budget" placeholder="Masukan" className="w-full px-2 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-xs bg-transparent text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-red-500 outline-none transition-shadow" />
              </div>
            </div>

            {state?.error && (
              <div className="text-red-500 text-xs font-medium mt-2 p-2 bg-red-50 dark:bg-red-900/30 rounded border border-red-100 dark:border-red-800">
                {state.error}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-5 mt-6 border-t border-gray-100 dark:border-slate-700">
              <button type="button" onClick={handleClose} disabled={isPending} className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:bg-slate-700 dark:text-gray-200 dark:border-slate-600 dark:hover:bg-slate-600 transition-colors disabled:opacity-50">
                Batal
              </button>
              <button type="submit" disabled={isPending} className="px-5 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 focus:ring-2 focus:ring-red-400 focus:outline-none transition-all disabled:opacity-50">
                {isPending ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
