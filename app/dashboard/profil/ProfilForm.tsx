"use client";

import { useActionState } from "react";
import { updateCompanyProfile } from "@/app/actions";

interface ProfilFormProps {
  initialData: {
    name: string;
    address: string | null;
    phone: string | null;
    email: string | null;
    logoUrl: string | null;
  };
}

export default function ProfilForm({ initialData }: ProfilFormProps) {
  const [state, formAction, isPending] = useActionState(
    updateCompanyProfile,
    null,
  );

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="col-span-2 md:col-span-1">
          <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
            Nama Perusahaan
          </label>
          <input
            type="text"
            name="name"
            defaultValue={initialData.name}
            className="w-full px-4 py-2.5 border border-[#E5E7EB] dark:border-slate-600 rounded-[10px] text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-[#EA6C00]/10 focus:border-[#EA6C00] outline-none transition-all"
            placeholder="Masukkan nama perusahaan"
          />
        </div>

        <div className="col-span-2 md:col-span-1">
          <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
            Email Perusahaan
          </label>
          <input
            type="email"
            name="email"
            defaultValue={initialData.email || ""}
            className="w-full px-4 py-2.5 border border-[#E5E7EB] dark:border-slate-600 rounded-[10px] text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-[#EA6C00]/10 focus:border-[#EA6C00] outline-none transition-all"
            placeholder="email@perusahaan.com"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
            Alamat Lengkap
          </label>
          <textarea
            name="address"
            rows={3}
            defaultValue={initialData.address || ""}
            className="w-full px-4 py-2.5 border border-[#E5E7EB] dark:border-slate-600 rounded-[10px] text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-[#EA6C00]/10 focus:border-[#EA6C00] outline-none transition-all resize-none"
            placeholder="Masukkan alamat lengkap perusahaan"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
            Nomor Telepon
          </label>
          <input
            type="tel"
            name="phone"
            defaultValue={initialData.phone || ""}
            className="w-full px-4 py-2.5 border border-[#E5E7EB] dark:border-slate-600 rounded-[10px] text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-[#EA6C00]/10 focus:border-[#EA6C00] outline-none transition-all"
            placeholder="+62 xxx xxxx xxxx"
          />
        </div>
      </div>

      <div className="pt-2 flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2.5 bg-[#EA6C00] text-white text-sm font-bold rounded-[10px] hover:bg-[#C25500] focus:ring-4 focus:ring-[#EA6C00]/20 dark:focus:ring-[#EA6C00]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-orange-500/20"
        >
          {isPending ? "Menyimpan..." : "Simpan Perubahan"}
        </button>
      </div>

      {state?.message && (
        <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-xl text-sm border border-green-100 dark:border-green-800/50 flex items-center">
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M5 13l4 4L19 7"
            />
          </svg>
          {state.message}
        </div>
      )}
    </form>
  );
}
