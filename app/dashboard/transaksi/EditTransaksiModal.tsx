"use client";

import React, { useEffect, useState, useRef } from "react";
import { useActionState } from "react";
import { updateTransaction } from "@/app/actions";
import { useRouter } from "next/navigation";
import { CldUploadWidget } from "next-cloudinary";

interface Project {
  id: string;
  code: string;
  name: string;
}

const CATEGORIES = [
  { id: "BOOKING_FEE", label: "Booking Fee" },
  { id: "DOWN_PAYMENT", label: "Down Payment" },
  { id: "ANGSURAN_KPR", label: "Angsuran KPR" },
  { id: "PELUNASAN_CASH", label: "Pelunasan Cash" },
  { id: "PENCAIRAN_KPR", label: "Pencairan KPR" },
  { id: "BIAYA_KONSTRUKSI", label: "Biaya Konstruksi" },
  { id: "BIAYA_MARKETING", label: "Biaya Marketing" },
  { id: "BIAYA_OPERASIONAL", label: "Biaya Operasional" },
  { id: "BIAYA_GAJI", label: "Biaya Gaji" },
  { id: "LAIN_LAIN", label: "Lain-lain" },
];

export default function EditTransaksiModal({
  transaction,
  projects,
  onClose,
}: {
  transaction: any;
  projects: Project[];
  onClose: () => void;
}) {
  const [state, formAction, isPending] = useActionState(
    updateTransaction,
    null,
  );
  const router = useRouter();

  // Dropdown States
  const [catOpen, setCatOpen] = useState(false);
  const [selectedCat, setSelectedCat] = useState(transaction.category);
  const catRef = useRef<HTMLDivElement>(null);

  const [projOpen, setProjOpen] = useState(false);
  const [selectedProj, setSelectedProj] = useState(transaction.projectId || "");
  const projRef = useRef<HTMLDivElement>(null);
  const [searchProj, setSearchProj] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState(transaction.evidenceUrl || "");

  useEffect(() => {
    if (state?.success) {
      router.push("/dashboard/transaksi?toast=edit_success");
      router.refresh();
      onClose();
    }
  }, [state, router, onClose]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (catRef.current && !catRef.current.contains(event.target as Node))
        setCatOpen(false);
      if (projRef.current && !projRef.current.contains(event.target as Node))
        setProjOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentCatLabel =
    CATEGORIES.find((c) => c.id === selectedCat)?.label || "Pilih kategori";
  const currentProjLabel =
    projects.find((p) => p.id === selectedProj)?.code +
      " — " +
      projects.find((p) => p.id === selectedProj)?.name || "Tanpa proyek";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-[16px] shadow-2xl w-full max-w-lg overflow-hidden border border-white/20 dark:border-slate-700 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-[#F3F4F6] dark:border-slate-700">
          <h2 className="text-[18px] font-semibold text-gray-900 dark:text-white leading-tight">
            Edit Transaksi
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-[#EA6C00] dark:hover:text-[#EA6C00] transition-colors rounded-full hover:bg-gray-50 dark:hover:bg-slate-700"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
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

        {/* Form */}
        <form action={formAction}>
          <input type="hidden" name="id" value={transaction.id} />
          <input type="hidden" name="evidenceUrl" value={evidenceUrl} />
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[14px] font-semibold text-gray-700 dark:text-slate-300 mb-1.5 leading-[1.5]">
                  No. Referensi <span className="text-[#EA6C00]">*</span>
                </label>
                <input
                  type="text"
                  name="reference"
                  required
                  defaultValue={transaction.reference}
                  className="w-full px-4 h-12 border border-[#E5E7EB] dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-[#EA6C00]/10 focus:border-[#EA6C00] outline-none transition-all placeholder-gray-400"
                />
              </div>
              <div>
                <label className="block text-[14px] font-semibold text-gray-700 dark:text-slate-300 mb-1.5 leading-[1.5]">
                  Tanggal <span className="text-[#EA6C00]">*</span>
                </label>
                <input
                  type="date"
                  name="date"
                  required
                  defaultValue={
                    new Date(transaction.date).toISOString().split("T")[0]
                  }
                  className="w-full px-4 h-12 border border-[#E5E7EB] dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-[#EA6C00]/10 focus:border-[#EA6C00] outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[14px] font-semibold text-gray-700 dark:text-slate-300 mb-1.5 leading-[1.5]">
                Keterangan <span className="text-[#EA6C00]">*</span>
              </label>
              <input
                type="text"
                name="description"
                required
                defaultValue={transaction.description}
                className="w-full px-4 h-12 border border-[#E5E7EB] dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-[#EA6C00]/10 focus:border-[#EA6C00] outline-none transition-all placeholder-gray-400"
              />
            </div>

            <div>
              <label className="block text-[14px] font-semibold text-gray-700 dark:text-slate-300 mb-1.5 leading-[1.5]">
                Catatan
              </label>
              <input
                type="text"
                name="note"
                defaultValue={transaction.note || ""}
                placeholder="Catatan tambahan (opsional)"
                className="w-full px-4 h-12 border border-[#E5E7EB] dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-[#EA6C00]/10 focus:border-[#EA6C00] outline-none transition-all placeholder-gray-400"
              />
            </div>

            <div>
              <label className="block text-[14px] font-semibold text-gray-700 dark:text-slate-300 mb-2.5 uppercase tracking-wider text-[11px] font-bold">
                Bukti Pembayaran (Opsional)
              </label>
              
              {evidenceUrl ? (
                <div className="relative group w-full aspect-video rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm bg-slate-50 dark:bg-slate-900/50">
                  <img 
                    src={evidenceUrl} 
                    alt="Bukti" 
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <CldUploadWidget 
                      uploadPreset="siagms_upload"
                      options={{
                        sources: ['local', 'camera'],
                        multiple: false,
                        maxFiles: 1,
                        language: "id",
                        text: {
                          id: {
                            menu: {
                              files: "File Saya",
                              camera: "Kamera"
                            }
                          }
                        }
                      }}
                      onSuccess={(result: any) => {
                        setEvidenceUrl(result.info.secure_url);
                      }}
                    >
                      {({ open }) => (
                        <button
                          type="button"
                          onClick={() => open()}
                          className="px-4 py-2 bg-white text-slate-900 text-sm font-bold rounded-xl hover:bg-slate-50 transition-all shadow-xl"
                        >
                          Ganti
                        </button>
                      )}
                    </CldUploadWidget>
                    <button
                      type="button"
                      onClick={() => setEvidenceUrl("")}
                      className="px-4 py-2 bg-red-500 text-white text-sm font-bold rounded-xl hover:bg-red-600 transition-all shadow-xl"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              ) : (
                <CldUploadWidget 
                  uploadPreset="siagms_upload"
                  options={{
                    sources: ['local', 'camera'],
                    multiple: false,
                    maxFiles: 1
                  }}
                  onSuccess={(result: any) => {
                    setEvidenceUrl(result.info.secure_url);
                  }}
                >
                  {({ open }) => (
                    <button
                      type="button"
                      onClick={() => open()}
                      className="w-full h-32 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-slate-600 hover:border-slate-300 dark:hover:border-slate-600 transition-all group bg-slate-50/50 dark:bg-slate-900/20"
                    >
                      <div className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15a2.25 2.25 0 0 0 2.25-2.25V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                        </svg>
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider">Klik untuk upload bukti</span>
                    </button>
                  )}
                </CldUploadWidget>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="relative" ref={catRef}>
                <label className="block text-[14px] font-semibold text-gray-700 dark:text-slate-300 mb-1.5 leading-[1.5]">
                  Kategori <span className="text-[#EA6C00]">*</span>
                </label>
                <input
                  type="hidden"
                  name="category"
                  value={selectedCat}
                  required
                />
                <button
                  type="button"
                  onClick={() => setCatOpen(!catOpen)}
                  className={`flex justify-between items-center w-full px-4 h-12 border rounded-xl text-sm transition-all text-left ${
                    catOpen
                      ? "border-[#EA6C00] ring-4 ring-[#EA6C00]/10"
                      : "border-[#E5E7EB] dark:border-slate-600"
                  } bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none`}
                >
                  <span className={selectedCat ? "" : "text-gray-400"}>
                    {currentCatLabel}
                  </span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`w-4 h-4 transition-transform ${catOpen ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {catOpen && (
                  <div className="absolute z-[60] left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 rounded-2xl shadow-xl overflow-hidden p-1.5">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setSelectedCat(cat.id);
                          setCatOpen(false);
                        }}
                        className={`block w-full text-left px-4 py-3 text-sm transition-all rounded-xl ${
                          selectedCat === cat.id
                            ? "bg-slate-50 dark:bg-slate-700/50 text-gray-900 dark:text-white font-medium"
                            : "text-gray-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-slate-700/30 font-medium"
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-[14px] font-semibold text-gray-700 dark:text-slate-300 mb-1.5 leading-[1.5]">
                  Jumlah (Rp) <span className="text-[#EA6C00]">*</span>
                </label>
                <input
                  type="number"
                  name="amount"
                  required
                  min="1"
                  defaultValue={transaction.amount}
                  className="w-full px-4 h-12 border border-[#E5E7EB] dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-[#EA6C00]/10 focus:border-[#EA6C00] outline-none transition-all"
                />
              </div>
            </div>

            <div className="relative" ref={projRef}>
              <label className="block text-[14px] font-semibold text-gray-700 dark:text-slate-300 mb-1.5 leading-[1.5]">
                Proyek
              </label>
              <input type="hidden" name="projectId" value={selectedProj} />
              <div
                onClick={() => {
                  if (!projOpen) {
                    setProjOpen(true);
                    setSearchProj("");
                  } else {
                    setProjOpen(false);
                  }
                }}
                className={`flex justify-between items-center w-full px-4 h-12 border rounded-xl text-sm transition-all text-left cursor-text ${
                  projOpen
                    ? "border-[#EA6C00] ring-4 ring-[#EA6C00]/10"
                    : "border-[#E5E7EB] dark:border-slate-600"
                } bg-white dark:bg-slate-700 text-gray-900 dark:text-white`}
              >
                {projOpen ? (
                  <input
                    autoFocus
                    type="text"
                    className="w-full bg-transparent border-none outline-none focus:ring-0 p-0 text-sm placeholder-gray-400 dark:placeholder-gray-500"
                    placeholder="Ketik untuk mencari..."
                    value={searchProj}
                    onChange={(e) => setSearchProj(e.target.value)}
                  />
                ) : (
                  <span className={`truncate pr-2 ${selectedProj ? "" : "text-gray-400"}`}>
                    {selectedProj ? currentProjLabel : "Tanpa proyek"}
                  </span>
                )}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`w-4 h-4 flex-shrink-0 transition-transform ${projOpen ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              {projOpen && (
                <div className="absolute z-[60] left-0 right-0 mt-2 max-h-48 overflow-y-auto bg-white dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 rounded-2xl shadow-xl p-1.5 custom-scrollbar">
                  
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProj("");
                      setProjOpen(false);
                    }}
                    className={`block w-full text-left px-4 py-3 text-sm transition-all rounded-xl ${
                      selectedProj === ""
                        ? "bg-slate-50 dark:bg-slate-700/50 text-gray-900 dark:text-white font-medium"
                        : "text-gray-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-slate-700/30 font-medium"
                    }`}
                  >
                    Tanpa proyek
                  </button>
                  {projects.filter(p => p.name.toLowerCase().includes(searchProj.toLowerCase()) || p.code.toLowerCase().includes(searchProj.toLowerCase())).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setSelectedProj(p.id);
                        setProjOpen(false);
                      }}
                      className={`block w-full text-left px-4 py-3 text-sm transition-all rounded-xl ${
                        selectedProj === p.id
                          ? "bg-slate-50 dark:bg-slate-700/50 text-gray-900 dark:text-white font-medium"
                          : "text-gray-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-slate-700/30 font-medium"
                      }`}
                    >
                      {p.code} — {p.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {state?.error && (
              <div className="text-red-600 text-xs font-bold p-3 bg-red-50 dark:bg-red-900/20 rounded-[8px] border border-red-100 dark:border-red-900/30">
                {state.error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-5 border-t border-[#F3F4F6] dark:border-slate-700 bg-white dark:bg-slate-800">
            <button
              onClick={onClose}
              type="button"
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
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Menyimpan...
                </div>
              ) : (
                "Simpan"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
