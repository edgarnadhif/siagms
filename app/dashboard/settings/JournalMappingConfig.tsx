"use client";

import React, { useState, useEffect, useCallback } from "react";

interface AccountOption {
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
  debitAccount: AccountOption;
  creditAccount: AccountOption;
  isActive: boolean;
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

const CATEGORY_GROUPS = {
  "Penerimaan": ["BOOKING_FEE", "DOWN_PAYMENT", "ANGSURAN_KPR", "PENCAIRAN_KPR", "PELUNASAN_CASH"],
  "Pengeluaran": ["BIAYA_KONSTRUKSI", "BIAYA_MARKETING", "BIAYA_GAJI", "BIAYA_OPERASIONAL", "LAIN_LAIN"],
};

export default function JournalMappingConfig({
  accounts: initialAccounts,
}: {
  accounts: AccountOption[];
}) {
  const [mappings, setMappings] = useState<JournalMappingItem[]>([]);
  const [accounts] = useState<AccountOption[]>(initialAccounts);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [savingCategory, setSavingCategory] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [changes, setChanges] = useState<
    Record<
      string,
      {
        debitAccountId?: string;
        creditAccountId?: string;
        isActive?: boolean;
      }
    >
  >({});

  const fetchMappings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/journal-mappings");
      const data = await res.json();
      if (data.success) {
        setMappings(data.data);
      } else {
        setError(data.message || "Gagal mengambil data mapping");
      }
    } catch {
      setError("Gagal mengambil data mapping");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMappings();
  }, [fetchMappings]);

  const handleChange = (
    mapping: JournalMappingItem,
    field: "debitAccountId" | "creditAccountId" | "isActive",
    value: string | boolean
  ) => {
    setChanges((prev) => {
      const nextChange = {
        ...prev[mapping.category],
        [field]: value,
      };

      const nextValues = {
        debitAccountId: nextChange.debitAccountId ?? mapping.debitAccountId,
        creditAccountId: nextChange.creditAccountId ?? mapping.creditAccountId,
        isActive: nextChange.isActive ?? mapping.isActive,
      };

      const changed =
        nextValues.debitAccountId !== mapping.debitAccountId ||
        nextValues.creditAccountId !== mapping.creditAccountId ||
        nextValues.isActive !== mapping.isActive;

      const next = { ...prev };

      if (changed) {
        next[mapping.category] = nextChange;
      } else {
        delete next[mapping.category];
      }

      return next;
    });
  };

  const getCurrentValue = (
    mapping: JournalMappingItem,
    field: "debitAccountId" | "creditAccountId"
  ) => {
    return changes[mapping.category]?.[field] ?? mapping[field];
  };

  const getCurrentStatus = (mapping: JournalMappingItem) => {
    return changes[mapping.category]?.isActive ?? mapping.isActive;
  };

  const hasChanges = Object.keys(changes).length > 0;

  const handleSaveAll = async () => {
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const categoriesToUpdate = Object.keys(changes);
      let successCount = 0;
      let lastError = "";

      for (const category of categoriesToUpdate) {
        setSavingCategory(category);
        const mapping = mappings.find((m) => m.category === category);
        if (!mapping) continue;

        const debitAccountId =
          changes[category]?.debitAccountId ?? mapping.debitAccountId;
        const creditAccountId =
          changes[category]?.creditAccountId ?? mapping.creditAccountId;
        const isActive = changes[category]?.isActive ?? mapping.isActive;

        const res = await fetch(
          `/api/journal-mappings/${encodeURIComponent(category)}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ debitAccountId, creditAccountId, isActive }),
          }
        );

        const data = await res.json();
        if (data.success) {
          successCount++;
        } else {
          lastError = data.message || "Gagal menyimpan mapping";
        }
      }

      if (lastError) {
        setError(lastError);
      }

      if (successCount > 0) {
        setSuccessMessage(
          `${successCount} konfigurasi jurnal berhasil diperbarui`
        );
        setChanges({});
        await fetchMappings();
      }
    } catch {
      setError("Gagal menyimpan konfigurasi jurnal");
    } finally {
      setSaving(false);
      setSavingCategory(null);
    }
  };

  const handleResetDefaults = async () => {
    if (
      !confirm(
        "Kembalikan semua konfigurasi jurnal otomatis ke default sistem?"
      )
    ) {
      return;
    }

    setResetting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch("/api/journal-mappings", {
        method: "POST",
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.message || "Gagal mereset konfigurasi jurnal");
        return;
      }

      setChanges({});
      setSuccessMessage(data.message || "Konfigurasi berhasil direset");
      await fetchMappings();
    } catch {
      setError("Gagal mereset konfigurasi jurnal");
    } finally {
      setResetting(false);
    }
  };

  // Auto-dismiss success message
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-orange-200 border-t-[#EA6C00] rounded-full animate-spin" />
          <p className="text-sm text-gray-400 font-medium">
            Memuat konfigurasi jurnal...
          </p>
        </div>
      </div>
    );
  }

  if (mappings.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center mx-auto mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-8 h-8 text-orange-400"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
        </div>
        <p className="text-gray-500 dark:text-gray-400 font-medium">
          Belum ada konfigurasi jurnal.
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
          Pastikan daftar akun dasar sudah tersedia untuk tenant ini.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast notifications */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-xl border border-red-100 dark:border-red-800/50 animate-in fade-in">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 flex-shrink-0">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
          </svg>
          <span className="font-medium">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>
      )}

      {successMessage && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-sm rounded-xl border border-emerald-100 dark:border-emerald-800/50 animate-in fade-in">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 flex-shrink-0">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
          </svg>
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {/* Mapping Groups */}
      {Object.entries(CATEGORY_GROUPS).map(([groupName, categories]) => {
        const groupMappings = mappings.filter((m) =>
          categories.includes(m.category)
        );
        if (groupMappings.length === 0) return null;

        const isRevenue = groupName === "Penerimaan";

        return (
          <div
            key={groupName}
            className="bg-white dark:bg-slate-800 rounded-[14px] border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden"
          >
            {/* Group Header */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 dark:border-slate-700">
              <span
                className={`px-3 py-1 font-bold text-xs rounded-full ${
                  isRevenue
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                    : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                }`}
              >
                {isRevenue ? "Penerimaan" : "Pengeluaran"}
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500 font-medium tracking-tight">
                {groupMappings.length} kategori
              </span>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead className="bg-[#F9FAFB] dark:bg-slate-800/80 border-b border-gray-100 dark:border-slate-700">
                  <tr>
                    <th className="px-5 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider w-[200px]">
                      KATEGORI
                    </th>
                    <th className="px-5 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      AKUN DEBIT
                    </th>
                    <th className="px-5 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      AKUN KREDIT
                    </th>
                    <th className="px-5 py-3 text-center text-[11px] font-bold text-gray-400 uppercase tracking-wider w-[80px]">
                      STATUS
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
                  {groupMappings.map((mapping) => {
                    const isChanged = !!changes[mapping.category];
                    const isSavingThis = savingCategory === mapping.category;
                    const isActive = getCurrentStatus(mapping);

                    return (
                      <tr
                        key={mapping.id}
                        className={`transition-all duration-150 ${
                          isChanged
                            ? "bg-orange-50/50 dark:bg-orange-900/10"
                            : !isActive
                              ? "bg-slate-50/60 dark:bg-slate-900/20"
                            : "hover:bg-slate-50/50 dark:hover:bg-slate-700/20"
                        }`}
                      >
                        <td className="px-5 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                              {CATEGORY_LABELS[mapping.category] ||
                                mapping.description}
                            </span>
                            {isSavingThis && (
                              <div className="w-4 h-4 border-2 border-orange-200 border-t-[#EA6C00] rounded-full animate-spin" />
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <select
                            value={getCurrentValue(
                              mapping,
                              "debitAccountId"
                            )}
                            onChange={(e) =>
                              handleChange(
                                mapping,
                                "debitAccountId",
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-2 border border-[#E5E7EB] dark:border-slate-600 rounded-[10px] text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-[#EA6C00]/10 focus:border-[#EA6C00] outline-none transition-all"
                          >
                            {accounts.map((acc) => (
                              <option key={acc.id} value={acc.id}>
                                {acc.code} - {acc.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-5 py-3">
                          <select
                            value={getCurrentValue(
                              mapping,
                              "creditAccountId"
                            )}
                            onChange={(e) =>
                              handleChange(
                                mapping,
                                "creditAccountId",
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-2 border border-[#E5E7EB] dark:border-slate-600 rounded-[10px] text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-[#EA6C00]/10 focus:border-[#EA6C00] outline-none transition-all"
                          >
                            {accounts.map((acc) => (
                              <option key={acc.id} value={acc.id}>
                                {acc.code} - {acc.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              role="switch"
                              aria-checked={isActive}
                              onClick={() =>
                                handleChange(mapping, "isActive", !isActive)
                              }
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                isActive
                                  ? "bg-emerald-500"
                                  : "bg-gray-300 dark:bg-slate-600"
                              }`}
                            >
                              <span
                                className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                                  isActive ? "translate-x-5" : "translate-x-1"
                                }`}
                              />
                            </button>
                            <span
                              className={`inline-flex min-w-16 justify-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                isChanged
                                  ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                                  : isActive
                                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                                    : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300"
                              }`}
                            >
                              {isChanged ? "Berubah" : isActive ? "Aktif" : "Nonaktif"}
                            </span>
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

      {/* Save Button */}
      <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={handleResetDefaults}
          disabled={saving || resetting}
          className="flex items-center justify-center gap-2.5 px-6 py-3 text-sm font-bold rounded-[10px] border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {resetting ? (
            <>
              <div className="w-4 h-4 border-2 border-gray-300 border-t-[#EA6C00] rounded-full animate-spin" />
              Mereset...
            </>
          ) : (
            "Reset Default"
          )}
        </button>
        <button
          onClick={handleSaveAll}
          disabled={!hasChanges || saving || resetting}
          className={`flex items-center gap-2.5 px-8 py-3 text-sm font-bold rounded-[10px] transition-all shadow-md ${
            hasChanges
              ? "bg-[#EA6C00] hover:bg-[#C25500] text-white shadow-orange-500/20 active:scale-95"
              : "bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-gray-500 cursor-not-allowed shadow-none"
          }`}
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 12.75l6 6 9-13.5"
                />
              </svg>
              Simpan Semua Perubahan
            </>
          )}
        </button>
      </div>
    </div>
  );
}
