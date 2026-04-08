"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createTenantUser } from "@/app/actions";

export default function AddUserModal() {
  const [state, formAction, isPending] = useActionState(createTenantUser, null);
  const router = useRouter();

  useEffect(() => {
    if (state?.success) {
      router.push("/dashboard/users");
      router.refresh();
    }
  }, [router, state]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
        <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Tambah User</h2>
          <button
            onClick={() => router.push("/dashboard/users")}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form action={formAction}>
          <div className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Nama Lengkap
              </label>
              <input
                type="text"
                name="fullName"
                placeholder="Nama karyawan"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                required
                placeholder="nama@perusahaan.com"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Password Awal <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                name="password"
                required
                minLength={8}
                placeholder="Minimal 8 karakter"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Role <span className="text-red-500">*</span>
              </label>
              <select
                name="role"
                required
                defaultValue="MARKETING"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                <option value="AKUNTAN">AKUNTAN</option>
                <option value="MARKETING">MARKETING</option>
              </select>
            </div>

            {state?.error && (
              <div className="text-red-500 text-xs font-medium p-2 bg-red-50 dark:bg-red-900/30 rounded border border-red-100 dark:border-red-800">
                {state.error}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
            <button
              type="button"
              onClick={() => router.push("/dashboard/users")}
              disabled={isPending}
              className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 text-sm font-semibold text-white bg-[#0f172a] hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
            >
              {isPending ? "Menyimpan..." : "Buat Akun"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
