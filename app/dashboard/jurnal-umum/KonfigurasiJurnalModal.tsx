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
    setChanges({});
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 dark:border-slate-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-orange-100 dark:bg-orange-900/30 text-[#EA6C00] rounded-xl">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
              </svg>
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">Konfigurasi Jurnal Otomatis</h2>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Atur akun debit &amp; kredit untuk setiap kategori transaksi</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Toasts */}
          {error && (
            <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-xl border border-red-100 dark:border-red-800/50">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 flex-shrink-0">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
              </svg>
              <span className="font-medium flex-1">{error}</span>
              <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" /></svg>
              </button>
            </div>
          )}
          {success && (
            <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-sm rounded-xl border border-emerald-100 dark:border-emerald-800/50">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 flex-shrink-0">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">{success}</span>
            </div>
          )}

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-3">
              <div className="w-7 h-7 border-2 border-orange-200 border-t-[#EA6C00] rounded-full animate-spin" />
              <span className="text-sm text-gray-400 font-medium">Memuat konfigurasi...</span>
            </div>
          ) : mappings.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center mx-auto mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-orange-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                </svg>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Belum ada konfigurasi.</p>
              <p className="text-xs text-gray-400 mt-1">Jalankan <code className="text-[#EA6C00]">seedJournalMapping.ts</code> terlebih dahulu.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(CATEGORY_GROUPS).map(([groupName, categories]) => {
                const groupMappings = mappings.filter((m) => categories.includes(m.category));
                if (groupMappings.length === 0) return null;
                const isRevenue = groupName === "Penerimaan";
                return (
                  <div key={groupName} className="rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden">
                    {/* Group Header */}
                    <div className="flex items-center gap-2 px-5 py-3 bg-gray-50 dark:bg-slate-700/50 border-b border-gray-100 dark:border-slate-700">
                      <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                        isRevenue
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                          : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                      }`}>
                        {isRevenue ? "↓ Penerimaan" : "↑ Pengeluaran"}
                      </span>
                      <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">{groupMappings.length} kategori</span>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[640px]">
                        <thead className="bg-[#F9FAFB] dark:bg-slate-800/80 border-b border-gray-100 dark:border-slate-700">
                          <tr>
                            <th className="px-5 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider w-[170px]">Kategori</th>
                            <th className="px-5 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Akun Debit</th>
                            <th className="px-5 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Akun Kredit</th>
                            <th className="px-5 py-3 text-center text-[11px] font-bold text-gray-400 uppercase tracking-wider w-[90px]">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
                          {groupMappings.map((mapping) => {
                            const isChanged = !!changes[mapping.category];
                            return (
                              <tr
                                key={mapping.id}
                                className={`transition-colors ${isChanged ? "bg-orange-50/60 dark:bg-orange-900/10" : "hover:bg-slate-50/50 dark:hover:bg-slate-700/20"}`}
                              >
                                <td className="px-5 py-3 font-bold text-sm text-slate-800 dark:text-slate-200 whitespace-nowrap">
                                  <div className="flex items-center gap-2">
                                    {CATEGORY_LABELS[mapping.category] || mapping.description}
                                    {savingCategory === mapping.category && (
                                      <div className="w-3 h-3 border-2 border-orange-200 border-t-[#EA6C00] rounded-full animate-spin" />
                                    )}
                                  </div>
                                </td>
                                <td className="px-5 py-3">
                                  <select
                                    value={getValue(mapping, "debitAccountId")}
                                    onChange={(e) => handleChange(mapping.category, "debitAccountId", e.target.value)}
                                    className="w-full px-3 py-2 border border-[#E5E7EB] dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#EA6C00]/20 focus:border-[#EA6C00] outline-none transition-all"
                                  >
                                    {mappingAccounts.map((acc) => (
                                      <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                                    ))}
                                  </select>
                                </td>
                                <td className="px-5 py-3">
                                  <select
                                    value={getValue(mapping, "creditAccountId")}
                                    onChange={(e) => handleChange(mapping.category, "creditAccountId", e.target.value)}
                                    className="w-full px-3 py-2 border border-[#E5E7EB] dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#EA6C00]/20 focus:border-[#EA6C00] outline-none transition-all"
                                  >
                                    {mappingAccounts.map((acc) => (
                                      <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                                    ))}
                                  </select>
                                </td>
                                <td className="px-5 py-3 text-center">
                                  <button
                                    type="button"
                                    aria-label={isChanged ? "Berubah" : "Aktif"}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                                      isChanged
                                        ? "bg-amber-400"
                                        : "bg-emerald-500"
                                    }`}
                                  >
                                    <span
                                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform ${
                                        isChanged ? "translate-x-1" : "translate-x-6"
                                      }`}
                                    />
                                  </button>
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
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 flex-shrink-0">
          <button
            onClick={handleReset}
            disabled={!hasChanges}
            className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Reset Default
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              type="button"
              className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors"
            >
              Tutup
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges || saving}
              className={`flex items-center gap-2 px-5 py-2 text-sm font-bold rounded-lg transition-all ${
                hasChanges
                  ? "bg-[#EA6C00] hover:bg-[#C25500] text-white shadow-md shadow-orange-500/20 active:scale-95"
                  : "bg-gray-200 dark:bg-slate-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
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
  );
}
