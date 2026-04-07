"use client";

import React, { useEffect, useState, useRef } from "react";
import { useActionState } from "react";
import { updateTransaction } from "@/app/actions";
import { useRouter } from "next/navigation";

interface Project {
  id: string;
  code: string;
  name: string;
}

const CATEGORIES = [
  { id: "BOOKING_FEE", label: "Booking Fee" },
  { id: "DOWN_PAYMENT", label: "Down Payment" },
  { id: "PELUNASAN", label: "Pelunasan" },
  { id: "BIAYA_PROYEK", label: "Biaya Proyek" },
  { id: "BIAYA_OPERASIONAL", label: "Biaya Operasional" },
];

export default function EditTransaksiModal({ 
  transaction, 
  projects,
  onClose
}: { 
  transaction: any; 
  projects: Project[];
  onClose: () => void;
}) {
  const [state, formAction, isPending] = useActionState(updateTransaction, null);
  const router = useRouter();

  // Dropdown States
  const [catOpen, setCatOpen] = useState(false);
  const [selectedCat, setSelectedCat] = useState(transaction.category);
  const catRef = useRef<HTMLDivElement>(null);

  const [projOpen, setProjOpen] = useState(false);
  const [selectedProj, setSelectedProj] = useState(transaction.projectId || "");
  const projRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state?.success) {
      router.refresh();
      onClose();
    }
  }, [state, router, onClose]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (catRef.current && !catRef.current.contains(event.target as Node)) setCatOpen(false);
      if (projRef.current && !projRef.current.contains(event.target as Node)) setProjOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentCatLabel = CATEGORIES.find(c => c.id === selectedCat)?.label || "Pilih kategori";
  const currentProjLabel = projects.find(p => p.id === selectedProj)?.code + " — " + projects.find(p => p.id === selectedProj)?.name || "Tanpa proyek";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-[16px] shadow-2xl w-full max-w-lg overflow-hidden border border-white/20 dark:border-slate-700 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-[#F3F4F6] dark:border-slate-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit Transaksi</h2>
          <button 
            onClick={onClose} 
            className="p-2 text-gray-400 hover:text-[#EA6C00] dark:hover:text-[#EA6C00] transition-colors rounded-full hover:bg-gray-50 dark:hover:bg-slate-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form action={formAction}>
          <input type="hidden" name="id" value={transaction.id} />
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                  No. Referensi <span className="text-[#EA6C00]">*</span>
                </label>
                <input
                  type="text"
                  name="reference"
                  required
                  defaultValue={transaction.reference}
                  className="w-full px-4 py-2.5 border border-[#E5E7EB] dark:border-slate-600 rounded-[10px] text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-[#EA6C00]/10 focus:border-[#EA6C00] outline-none transition-all placeholder-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                  Tanggal <span className="text-[#EA6C00]">*</span>
                </label>
                <input
                  type="date"
                  name="date"
                  required
                  defaultValue={new Date(transaction.date).toISOString().split("T")[0]}
                  className="w-full px-4 py-2.5 border border-[#E5E7EB] dark:border-slate-600 rounded-[10px] text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-[#EA6C00]/10 focus:border-[#EA6C00] outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                Keterangan <span className="text-[#EA6C00]">*</span>
              </label>
              <input
                type="text"
                name="description"
                required
                defaultValue={transaction.description}
                className="w-full px-4 py-2.5 border border-[#E5E7EB] dark:border-slate-600 rounded-[10px] text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-[#EA6C00]/10 focus:border-[#EA6C00] outline-none transition-all placeholder-gray-400"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                Catatan
              </label>
              <input
                type="text"
                name="note"
                defaultValue={transaction.note || ""}
                placeholder="Catatan tambahan (opsional)"
                className="w-full px-4 py-2.5 border border-[#E5E7EB] dark:border-slate-600 rounded-[10px] text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-[#EA6C00]/10 focus:border-[#EA6C00] outline-none transition-all placeholder-gray-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="relative" ref={catRef}>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                  Kategori <span className="text-[#EA6C00]">*</span>
                </label>
                <input type="hidden" name="category" value={selectedCat} required />
                <button
                  type="button"
                  onClick={() => setCatOpen(!catOpen)}
                  className={`flex justify-between items-center w-full px-4 py-2.5 border rounded-[10px] text-sm transition-all text-left ${
                    catOpen 
                      ? "border-[#EA6C00] ring-4 ring-[#EA6C00]/10" 
                      : "border-[#E5E7EB] dark:border-slate-600"
                  } bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none`}
                >
                  <span className={selectedCat ? "" : "text-gray-400"}>{currentCatLabel}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 transition-transform ${catOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {catOpen && (
                  <div className="absolute z-[60] left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 rounded-[10px] shadow-xl overflow-hidden py-1">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => { setSelectedCat(cat.id); setCatOpen(false); }}
                        className={`block w-full text-left px-4 py-2.5 text-sm transition-colors ${
                          selectedCat === cat.id 
                            ? "bg-[#EA6C00] text-white" 
                            : "text-gray-600 dark:text-gray-300 hover:bg-[#FFF0E6] hover:text-[#EA6C00]"
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                  Jumlah (Rp) <span className="text-[#EA6C00]">*</span>
                </label>
                <input
                  type="number"
                  name="amount"
                  required
                  min="1"
                  defaultValue={transaction.amount}
                  className="w-full px-4 py-2.5 border border-[#E5E7EB] dark:border-slate-600 rounded-[10px] text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-[#EA6C00]/10 focus:border-[#EA6C00] outline-none transition-all"
                />
              </div>
            </div>

            <div className="relative" ref={projRef}>
              <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                Proyek
              </label>
              <input type="hidden" name="projectId" value={selectedProj} />
              <button
                type="button"
                onClick={() => setProjOpen(!projOpen)}
                className={`flex justify-between items-center w-full px-4 py-2.5 border rounded-[10px] text-sm transition-all text-left ${
                  projOpen 
                    ? "border-[#EA6C00] ring-4 ring-[#EA6C00]/10" 
                    : "border-[#E5E7EB] dark:border-slate-600"
                } bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none`}
              >
                <span className={selectedProj ? "" : "text-gray-400"}>{selectedProj ? currentProjLabel : "Tanpa proyek"}</span>
                <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 transition-transform ${projOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {projOpen && (
                <div className="absolute z-[60] left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 rounded-[10px] shadow-xl py-1">
                  <button
                    type="button"
                    onClick={() => { setSelectedProj(""); setProjOpen(false); }}
                    className={`block w-full text-left px-4 py-2.5 text-sm transition-colors ${
                      selectedProj === "" 
                        ? "bg-[#EA6C00] text-white" 
                        : "text-gray-600 dark:text-gray-300 hover:bg-[#FFF0E6] hover:text-[#EA6C00]"
                    }`}
                  >
                    Tanpa proyek
                  </button>
                  {projects.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => { setSelectedProj(p.id); setProjOpen(false); }}
                      className={`block w-full text-left px-4 py-2.5 text-sm transition-colors ${
                        selectedProj === p.id 
                          ? "bg-[#EA6C00] text-white" 
                          : "text-gray-600 dark:text-gray-300 hover:bg-[#FFF0E6] hover:text-[#EA6C00]"
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
              ) : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
