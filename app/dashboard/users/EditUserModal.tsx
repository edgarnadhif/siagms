"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateTenantUser } from "@/app/actions";

type ManagedUser = {
  id: number;
  fullName: string | null;
  email: string;
  role: "ADMIN" | "AKUNTAN";
  isActive: boolean;
};

export default function EditUserModal({
  user,
  onClose,
  isSelf,
}: {
  user: ManagedUser;
  onClose: () => void;
  isSelf: boolean;
}) {
  const [state, formAction, isPending] = useActionState(updateTenantUser, null);
  const router = useRouter();

  useEffect(() => {
    if (state?.success) {
      onClose();
      router.refresh();
    }
  }, [onClose, router, state]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-white/20 dark:border-slate-700">
        <div className="flex justify-between items-center p-6 border-b border-[#F3F4F6] dark:border-slate-700 shrink-0">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">
            Edit User
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-orange-500 dark:hover:text-orange-500 transition-colors rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form action={formAction}>
          <input type="hidden" name="userId" value={user.id} />

          <div className="p-6 space-y-5 flex-1 overflow-y-auto subtle-scrollbar">
            <div>
              <label className="block text-[14px] font-semibold text-gray-700 dark:text-slate-300 mb-1.5 leading-[1.5]">
                Nama Lengkap
              </label>
              <input
                type="text"
                name="fullName"
                defaultValue={user.fullName || ""}
                placeholder="Nama karyawan"
                className="w-full px-4 h-12 border border-[#E5E7EB] dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-[#EA6C00]/10 focus:border-[#EA6C00] outline-none transition-all placeholder-gray-400"
              />
            </div>

            <div>
              <label className="block text-[14px] font-semibold text-gray-700 dark:text-slate-300 mb-1.5 leading-[1.5]">
                Email <span className="text-orange-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                required
                defaultValue={user.email}
                className="w-full px-4 h-12 border border-[#E5E7EB] dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-[#EA6C00]/10 focus:border-[#EA6C00] outline-none transition-all placeholder-gray-400"
              />
            </div>

            <div>
              <label className="block text-[14px] font-semibold text-gray-700 dark:text-slate-300 mb-1.5 leading-[1.5]">
                Role <span className="text-orange-500">*</span>
              </label>
              <div className="relative">
                {isSelf && <input type="hidden" name="role" value={user.role} />}
                <select
                  name="role"
                  required
                  defaultValue={user.role}
                  disabled={isSelf}
                  className="w-full px-4 h-12 border border-[#E5E7EB] dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-[#EA6C00]/10 focus:border-[#EA6C00] outline-none transition-all appearance-none cursor-pointer disabled:opacity-60"
                >
                  <option value="ADMIN">ADMIN</option>
                  <option value="AKUNTAN">AKUNTAN</option>
                </select>
                {!isSelf && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                )}
              </div>
              {isSelf && (
                <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium italic">
                  Role akun yang sedang login tidak bisa diubah dari form ini.
                </p>
              )}
            </div>

            <div>
              <label className="block text-[14px] font-semibold text-gray-700 dark:text-slate-300 mb-1.5 leading-[1.5]">
                Password Baru
              </label>
              <input
                type="password"
                name="password"
                minLength={8}
                placeholder="Kosongkan jika tidak ingin mengganti password"
                className="w-full px-4 h-12 border border-[#E5E7EB] dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-[#EA6C00]/10 focus:border-[#EA6C00] outline-none transition-all placeholder-gray-400"
              />
            </div>

            {state?.error && (
              <div className="text-red-600 text-xs font-bold p-3 bg-red-50 dark:bg-red-900/20 rounded-[8px] border border-red-100 dark:border-red-900/30">
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                  {state.error}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 p-5 border-t border-[#F3F4F6] dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-6 py-2.5 text-sm font-bold text-gray-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-[#E5E7EB] dark:border-slate-600 rounded-[10px] hover:bg-gray-50 dark:hover:bg-slate-600 transition-all disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-6 py-2.5 text-sm font-bold text-white bg-[#EA6C00] hover:bg-[#C25500] rounded-[10px] shadow-md shadow-orange-500/20 transition-all active:scale-95 disabled:opacity-50"
            >
              {isPending ? (
                <div className="flex items-center gap-2 text-white">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Menyimpan...
                </div>
              ) : (
                "Simpan Perubahan"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
