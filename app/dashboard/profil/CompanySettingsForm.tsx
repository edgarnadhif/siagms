"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

// ─── Toast ────────────────────────────────────────────────────────────────────
type ToastType = "success" | "error";
interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

function ToastContainer({
  toasts,
  remove,
}: {
  toasts: Toast[];
  remove: (id: number) => void;
}) {
  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-center gap-3 px-6 py-3.5 rounded-full shadow-2xl text-sm font-semibold text-white min-w-[280px] animate-in slide-in-from-right-5 duration-300 ${
            t.type === "success" ? "bg-[#00945E]" : "bg-red-600"
          }`}
        >
          {t.type === "success" ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5 shrink-0"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5 shrink-0"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          )}
          <span className="flex-1">{t.message}</span>
          <button
            onClick={() => remove(t.id)}
            className="text-white/70 hover:text-white ml-2 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}

type CompanySettingsFormData = {
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
};

export default function CompanySettingsForm({
  initialData,
}: {
  initialData: CompanySettingsFormData;
}) {
  const router = useRouter();
  const [formData, setFormData] = useState(initialData);
  const [isSaving, setIsSaving] = useState(false);

  // Toast State
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    const id = ++toastId.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleChange =
    (field: keyof CompanySettingsFormData) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormData((current) => ({
        ...current,
        [field]: event.target.value,
      }));
    };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch("/api/settings/company", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = (await response.json()) as { message?: string };

      if (!response.ok) {
        showToast(result.message || "Gagal menyimpan pengaturan perusahaan", "error");
        return;
      }

      showToast("Pengaturan perusahaan berhasil disimpan", "success");
      router.refresh();
    } catch (submitError: unknown) {
      showToast(
        submitError instanceof Error
          ? submitError.message
          : "Gagal menyimpan pengaturan perusahaan",
        "error"
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-2.5 ml-1">
            Nama Perusahaan
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-orange-500 transition-colors">
              <Image
                src="/domain.svg"
                alt="Company"
                width={20}
                height={20}
                className="w-5 h-5 opacity-40 group-focus-within:opacity-100 transition-opacity dark:invert"
              />
            </div>
            <input
              type="text"
              required
              value={formData.companyName}
              onChange={handleChange("companyName")}
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-800 border-[0.5px] border-[#E5E7EB] dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-orange-400 dark:focus:border-orange-500/50 focus:ring-4 focus:ring-orange-50 dark:focus:ring-orange-500/10 transition-all placeholder:font-normal placeholder:text-slate-400"
              placeholder="Masukkan nama perusahaan"
            />
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-2.5 ml-1">
            Alamat Perusahaan
          </label>
          <div className="relative group">
            <div className="absolute top-3.5 left-0 pl-4 pointer-events-none text-slate-400 group-focus-within:text-orange-500 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
              </svg>
            </div>
            <textarea
              rows={3}
              value={formData.companyAddress}
              onChange={handleChange("companyAddress")}
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-800 border-[0.5px] border-[#E5E7EB] dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-orange-400 dark:focus:border-orange-500/50 focus:ring-4 focus:ring-orange-50 dark:focus:ring-orange-500/10 transition-all placeholder:font-normal placeholder:text-slate-400 resize-none"
              placeholder="Masukkan alamat lengkap perusahaan"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-2.5 ml-1">
            No. Telepon
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-orange-500 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
              </svg>
            </div>
            <input
              type="tel"
              value={formData.companyPhone}
              onChange={handleChange("companyPhone")}
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-800 border-[0.5px] border-[#E5E7EB] dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-orange-400 dark:focus:border-orange-500/50 focus:ring-4 focus:ring-orange-50 dark:focus:ring-orange-500/10 transition-all placeholder:font-normal placeholder:text-slate-400"
              placeholder="08xxxxxxxxxx"
            />
          </div>
          <p className="mt-2 text-[11px] text-slate-400 dark:text-slate-500 italic flex items-center gap-1.5 ml-1">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-emerald-500">
              <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 0 1 .67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 1 1-.671-1.341l.041-.022ZM12 9a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
            </svg>
            Nomor ini akan digunakan sebagai tujuan pengiriman instruksi reset kata sandi melalui WhatsApp.
          </p>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-2.5 ml-1">
            Email
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-orange-500 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
              </svg>
            </div>
            <input
              type="email"
              value={formData.companyEmail}
              onChange={handleChange("companyEmail")}
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-800 border-[0.5px] border-[#E5E7EB] dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-orange-400 dark:focus:border-orange-500/50 focus:ring-4 focus:ring-orange-50 dark:focus:ring-orange-500/10 transition-all placeholder:font-normal placeholder:text-slate-400"
              placeholder="info@perusahaan.com"
            />
          </div>
        </div>
      </div>

      <div className="pt-4 flex justify-end">
        <button
          type="submit"
          disabled={isSaving}
          className="px-8 py-3 bg-[#EA6C00] text-white text-sm font-bold rounded-xl hover:bg-[#C25500] focus:ring-4 focus:ring-orange-500/20 dark:focus:ring-orange-500/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/20 active:scale-95 flex items-center gap-2"
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              Simpan
            </>
          )}
        </button>
      </div>

      <ToastContainer toasts={toasts} remove={removeToast} />
    </form>
  );
}
