"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    setMessage(null);
    setError(null);

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
        setError(result.message || "Gagal menyimpan pengaturan perusahaan");
        return;
      }

      setMessage("Pengaturan perusahaan berhasil disimpan");
      router.refresh();
    } catch (submitError: unknown) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Gagal menyimpan pengaturan perusahaan",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
            Nama Perusahaan
          </label>
          <input
            type="text"
            required
            value={formData.companyName}
            onChange={handleChange("companyName")}
            className="w-full px-4 py-2.5 border border-[#E5E7EB] dark:border-slate-600 rounded-[10px] text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-[#EA6C00]/10 focus:border-[#EA6C00] outline-none transition-all"
            placeholder="Masukkan nama perusahaan"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
            Alamat Perusahaan
          </label>
          <textarea
            rows={3}
            value={formData.companyAddress}
            onChange={handleChange("companyAddress")}
            className="w-full px-4 py-2.5 border border-[#E5E7EB] dark:border-slate-600 rounded-[10px] text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-[#EA6C00]/10 focus:border-[#EA6C00] outline-none transition-all resize-none"
            placeholder="Masukkan alamat lengkap perusahaan"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
            No. Telepon
          </label>
          <input
            type="tel"
            value={formData.companyPhone}
            onChange={handleChange("companyPhone")}
            className="w-full px-4 py-2.5 border border-[#E5E7EB] dark:border-slate-600 rounded-[10px] text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-[#EA6C00]/10 focus:border-[#EA6C00] outline-none transition-all"
            placeholder="08xxxxxxxxxx"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
            Email
          </label>
          <input
            type="email"
            value={formData.companyEmail}
            onChange={handleChange("companyEmail")}
            className="w-full px-4 py-2.5 border border-[#E5E7EB] dark:border-slate-600 rounded-[10px] text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-[#EA6C00]/10 focus:border-[#EA6C00] outline-none transition-all"
            placeholder="info@perusahaan.com"
          />
        </div>
      </div>

      <div className="pt-2 flex justify-end">
        <button
          type="submit"
          disabled={isSaving}
          className="px-6 py-2.5 bg-[#EA6C00] text-white text-sm font-bold rounded-[10px] hover:bg-[#C25500] focus:ring-4 focus:ring-[#EA6C00]/20 dark:focus:ring-[#EA6C00]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-orange-500/20"
        >
          {isSaving ? "Menyimpan..." : "Simpan"}
        </button>
      </div>

      {message && (
        <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-xl text-sm border border-green-100 dark:border-green-800/50">
          {message}
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-xl text-sm border border-red-100 dark:border-red-800/50">
          {error}
        </div>
      )}
    </form>
  );
}
