"use client";

import React, { useState, useEffect, useCallback } from "react";

interface MappingAccount {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
}

interface JournalMappingItem {
  id: string;
  category: string;
  description: string;
  debitAccountId: string;
  creditAccountId: string;
  debitAccount: { id: string; code: string; name: string };
  creditAccount: { id: string; code: string; name: string };
}

const CATEGORY_LABELS: Record<string, string> = {
  BOOKING_FEE: "Booking Fee",
  DOWN_PAYMENT: "Down Payment",
  ANGSURAN_KPR: "Angsuran KPR",
  PENCAIRAN_KPR: "Pencairan KPR",
  PELUNASAN_CASH: "Pelunasan Cash",
  BIAYA_KONSTRUKSI: "Biaya Konstruksi",
  BIAYA_MARKETING: "Biaya Marketing",
  BIAYA_GAJI: "Biaya Gaji",
  BIAYA_OPERASIONAL: "Biaya Operasional",
  LAIN_LAIN: "Lain-lain",
};

const CATEGORY_GROUPS: Record<string, string[]> = {
  Penerimaan: ["BOOKING_FEE", "DOWN_PAYMENT", "ANGSURAN_KPR", "PENCAIRAN_KPR", "PELUNASAN_CASH"],
  Pengeluaran: ["BIAYA_KONSTRUKSI", "BIAYA_MARKETING", "BIAYA_GAJI", "BIAYA_OPERASIONAL", "LAIN_LAIN"],
};

export default function KonfigurasiJurnalModal({
  mappingAccounts,
  onClose,
}: {
  mappingAccounts: MappingAccount[];
  onClose: () => void;
}) {
  const [mappings, setMappings] = useState<JournalMappingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingCategory, setSavingCategory] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [changes, setChanges] = useState<Record<string, { debitAccountId?: string; creditAccountId?: string }>>({});

  const fetchMappings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/journal-mappings");
      const data = await res.json();
      if (data.success) setMappings(data.data);
      else setError(data.message || "Gagal mengambil konfigurasi");
    } catch {
      setError("Gagal mengambil konfigurasi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMappings();
  }, [fetchMappings]);

  // Auto-dismiss success
  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(null), 4000);
      return () => clearTimeout(t);
    }
  }, [success]);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const handleChange = (category: string, field: "debitAccountId" | "creditAccountId", value: string) => {
    setChanges((prev) => ({ ...prev, [category]: { ...prev[category], [field]: value } }));
  };

  const getValue = (mapping: JournalMappingItem, field: "debitAccountId" | "creditAccountId") =>
    changes[mapping.category]?.[field] ?? mapping[field];

  const hasChanges = Object.keys(changes).length > 0;

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    let successCount = 0;
    let lastError = "";

    for (const category of Object.keys(changes)) {
      setSavingCategory(category);
      const mapping = mappings.find((m) => m.category === category);
      if (!mapping) continue;

      const debitAccountId = changes[category]?.debitAccountId ?? mapping.debitAccountId;
      const creditAccountId = changes[category]?.creditAccountId ?? mapping.creditAccountId;

      const res = await fetch(`/api/journal-mappings/${encodeURIComponent(category)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ debitAccountId, creditAccountId }),
      });
      const data = await res.json();
      if (data.success) successCount++;
      else lastError = data.message || "Gagal menyimpan";
    }

    if (lastError) setError(lastError);
    if (successCount > 0) {
      setSuccess(`${successCount} konfigurasi berhasil disimpan`);
      setChanges({});
      await fetchMappings();
    }
    setSaving(false);
    setSavingCategory(null);
  };

  const handleReset = () => {
    if (confirm("Reset semua perubahan ke pengaturan awal?")) {
      setChanges({});
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <style jsx>{`
        .subtle-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .subtle-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .subtle-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .dark .subtle-scrollbar::-webkit-scrollbar-thumb {
          background: #334155;
        }
        .subtle-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200 dark:border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-slate-700 flex-shrink-0 bg-white dark:bg-slate-800 z-10">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-xl">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
              </svg>
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">Konfigurasi Jurnal Otomatis</h2>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">Atur akun debit &amp; kredit untuk setiap kategori transaksi</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto pt-8 pb-6 px-6 space-y-6 subtle-scrollbar">
          {/* Toasts */}
          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 text-sm rounded-2xl border border-red-100 dark:border-red-900/20 shadow-sm animate-in fade-in slide-in-from-top-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 flex-shrink-0">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold flex-1">{error}</span>
              <button onClick={() => setError(null)} className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" /></svg>
              </button>
            </div>
          )}
          {success && (
            <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 dark:text-emerald-400 text-sm rounded-2xl border border-emerald-100 dark:border-emerald-900/20 shadow-sm animate-in fade-in slide-in-from-top-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 flex-shrink-0">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold">{success}</span>
            </div>
          )}

          {/* Content */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-10 h-10 border-3 border-orange-100 border-t-orange-500 rounded-full animate-spin" />
              <span className="text-sm text-slate-400 font-semibold tracking-wide">MEMUAT KONFIGURASI...</span>
            </div>
          ) : mappings.length === 0 ? (
            <div className="text-center py-16 bg-slate-50 dark:bg-slate-900/30 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">
              <div className="w-16 h-16 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-slate-300">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                </svg>
              </div>
              <p className="text-base text-slate-600 dark:text-slate-400 font-bold">Konfigurasi Belum Tersedia</p>
              <p className="text-sm text-slate-400 mt-2 max-w-xs mx-auto italic">Silakan jalankan sistem inisialisasi mapping jurnal terlebih dahulu.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(CATEGORY_GROUPS).map(([groupName, categories]) => {
                const groupMappings = mappings.filter((m) => categories.includes(m.category));
                if (groupMappings.length === 0) return null;
                const isRevenue = groupName === "Penerimaan";
                return (
                  <div key={groupName} className="rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-800 shadow-sm">
                    {/* Group Header */}
                    <div className="flex items-center gap-3 px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-700">
                      <span className={`px-3 py-1 text-[10px] font-extrabold rounded-lg uppercase tracking-widest ${
                        isRevenue
                          ? "bg-emerald-500 text-white"
                          : "bg-rose-500 text-white"
                      }`}>
                        {isRevenue ? "↓ Penerimaan" : "↑ Pengeluaran"}
                      </span>
                      <span className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">{groupMappings.length} KATEGORI</span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[720px] border-collapse">
                        <thead className="bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
                          <tr>
                            <th className="px-6 py-4 text-left text-[11px] font-extrabold text-slate-400 uppercase tracking-widest w-[200px]">Kategori</th>
                            <th className="px-6 py-4 text-left text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">Akun Debit</th>
                            <th className="px-6 py-4 text-left text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">Akun Kredit</th>
                            <th className="px-6 py-4 text-center text-[11px] font-extrabold text-slate-400 uppercase tracking-widest w-[120px]">Jurnal Otomatis</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                          {groupMappings.map((mapping) => {
                            const isChanged = !!changes[mapping.category];
                            return (
                              <tr
                                key={mapping.id}
                                className={`transition-colors ${isChanged ? "bg-orange-50/40 dark:bg-orange-900/10" : "hover:bg-slate-50/50 dark:hover:bg-slate-700/20"}`}
                              >
                                <td className="px-6 py-4 font-semibold text-sm text-slate-800 dark:text-slate-200">
                                  <div className="flex items-center gap-2">
                                    <span className="truncate" title={CATEGORY_LABELS[mapping.category] || mapping.description}>
                                      {CATEGORY_LABELS[mapping.category] || mapping.description}
                                    </span>
                                    {savingCategory === mapping.category && (
                                      <div className="w-3.5 h-3.5 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin flex-shrink-0" />
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <select
                                    value={getValue(mapping, "debitAccountId")}
                                    onChange={(e) => handleChange(mapping.category, "debitAccountId", e.target.value)}
                                    className="w-full h-11 px-3 border border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all cursor-pointer shadow-sm hover:border-slate-300 dark:hover:border-slate-500"
                                    title={mappingAccounts.find(a => a.id === getValue(mapping, "debitAccountId"))?.name}
                                  >
                                    {mappingAccounts.map((acc) => (
                                      <option key={acc.id} value={acc.id}>{acc.code} — {acc.name}</option>
                                    ))}
                                  </select>
                                </td>
                                <td className="px-4 py-3">
                                  <select
                                    value={getValue(mapping, "creditAccountId")}
                                    onChange={(e) => handleChange(mapping.category, "creditAccountId", e.target.value)}
                                    className="w-full h-11 px-3 border border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all cursor-pointer shadow-sm hover:border-slate-300 dark:hover:border-slate-500"
                                    title={mappingAccounts.find(a => a.id === getValue(mapping, "creditAccountId"))?.name}
                                  >
                                    {mappingAccounts.map((acc) => (
                                      <option key={acc.id} value={acc.id}>{acc.code} — {acc.name}</option>
                                    ))}
                                  </select>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <div className="flex justify-center">
                                    <div
                                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                                        isChanged
                                          ? "bg-amber-400"
                                          : "bg-emerald-500"
                                      }`}
                                    >
                                      <span
                                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform ${
                                          isChanged ? "translate-x-1" : "translate-x-4.5"
                                        }`}
                                      />
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center justify-between gap-3 px-6 py-5 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 z-20 flex-shrink-0">
          <button
            onClick={handleReset}
            disabled={!hasChanges}
            className="px-5 py-2.5 text-sm font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:text-slate-700"
          >
            Reset ke Default
          </button>
          <div className="flex items-center gap-4">
            {!hasChanges && (
              <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider hidden md:block">Belum ada perubahan</span>
            )}
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                type="button"
                className="px-5 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95 shadow-sm"
              >
                Tutup
              </button>
              <button
                onClick={handleSave}
                disabled={!hasChanges || saving}
                className={`flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-xl transition-all shadow-md active:scale-95 ${
                  hasChanges
                    ? "bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/20"
                    : "bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed shadow-none"
                }`}
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    Simpan Semua Perubahan
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
