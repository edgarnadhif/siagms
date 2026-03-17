"use client";

import { useActionState } from "react";
import { updateCompanyProfile } from "@/app/actions";
import { useState, useRef } from "react";
import Image from "next/image";

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
  const [logoPreview, setLogoPreview] = useState<string | null>(
    initialData.logoUrl,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <form action={formAction} className="space-y-6">
      {/* Logo Upload Section */}
      <div className="flex items-center gap-6 mb-8">
        <div
          onClick={handleLogoClick}
          className="relative w-24 h-24 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:border-blue-500 transition-colors group overflow-hidden bg-gray-50"
        >
          <input type="hidden" name="logoUrl" value={logoPreview || ""} />
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
            name="logoFile"
          />
          {logoPreview ? (
            <Image
              src={logoPreview}
              alt="Logo Preview"
              fill
              className="object-cover"
            />
          ) : (
            <div className="text-center p-2">
              <span className="text-gray-400 text-xs group-hover:text-blue-500">
                Upload Logo
              </span>
            </div>
          )}
        </div>
        <div>
          <h3 className="font-medium text-gray-900">Logo Perusahaan</h3>
          <p className="text-sm text-gray-500">Format: PNG, JPG (Max. 2MB)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="col-span-2 md:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nama Perusahaan
          </label>
          <input
            type="text"
            name="name"
            defaultValue={initialData.name}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
            placeholder="Masukkan nama perusahaan"
          />
        </div>

        <div className="col-span-2 md:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Perusahaan
          </label>
          <input
            type="email"
            name="email"
            defaultValue={initialData.email || ""}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
            placeholder="email@perusahaan.com"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Alamat Lengkap
          </label>
          <textarea
            name="address"
            rows={3}
            defaultValue={initialData.address || ""}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all resize-none"
            placeholder="Masukkan alamat lengkap perusahaan"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nomor Telepon
          </label>
          <input
            type="tel"
            name="phone"
            defaultValue={initialData.phone || ""}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
            placeholder="+62 xxx xxxx xxxx"
          />
        </div>
      </div>

      <div className="pt-4 flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? "Menyimpan..." : "Simpan Perubahan"}
        </button>
      </div>

      {state?.message && (
        <div className="mt-4 p-4 bg-green-50 text-green-700 rounded-xl text-sm border border-green-100 flex items-center">
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
