"use client";

import React, { useState, useEffect } from "react";
import { useActionState } from "react";
import { createJournalEntries } from "@/app/actions";
import { useRouter } from "next/navigation";

interface Account {
  id: string;
  code: string;
  name: string;
}

interface Project {
  id: string;
  code: string;
  name: string;
}

export default function AddJurnalModal({
  accounts,
  projects,
  showToast,
}: {
  accounts: Account[];
  projects: Project[];
  showToast?: (message: string, type: "success" | "error") => void;
}) {
  const [state, formAction, isPending] = useActionState(createJournalEntries, null);
  const router = useRouter();
  const [scope, setScope] = useState<"GLOBAL" | "PROJECT">("GLOBAL");

  const [rows, setRows] = useState([
    { id: 1, accountId: "", debit: 0, credit: 0 },
    { id: 2, accountId: "", debit: 0, credit: 0 },
  ]);

  useEffect(() => {
    if (state?.success) {
      if (showToast) showToast("Jurnal berhasil ditambahkan", "success");
      router.push("/dashboard/jurnal-umum");
      router.refresh();
    }
  }, [state, router, showToast]);

  const handleClose = () => {
    router.push("/dashboard/jurnal-umum");
  };

  const addRow = () => {
    setRows([...rows, { id: Date.now(), accountId: "", debit: 0, credit: 0 }]);
  };

  const updateRow = (id: number, field: string, value: string | number) => {
    setRows(rows.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  };

  const removeRow = (id: number) => {
    if (rows.length > 2) {
      setRows(rows.filter((row) => row.id !== id));
    }
  };

  const totalDebit = rows.reduce((sum, row) => sum + Number(row.debit || 0), 0);
  const totalCredit = rows.reduce((sum, row) => sum + Number(row.credit || 0), 0);
  const isBalanced = totalDebit === totalCredit && totalDebit > 0;

  const handleSubmit = (formData: FormData) => {
    // Inject entries as JSON
    const entries = rows
      .filter((r) => r.accountId)
      .map((r) => ({
        accountId: r.accountId,
        debit: Number(r.debit || 0),
        credit: Number(r.credit || 0),
      }));
    formData.set("entries", JSON.stringify(entries));
    formAction(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Tambah Entri Jurnal</h2>
          <button onClick={handleClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form action={handleSubmit}>
          <div className="p-6 overflow-y-auto flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Tanggal <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="date"
                  required
                  defaultValue={new Date().toISOString().split("T")[0]}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-800 dark:text-white outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  No. Referensi <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="reference"
                  required
                  placeholder="JU-001"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Ruang Lingkup Jurnal
              </label>
              <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-100 dark:bg-slate-900/50 p-1">
                <button
                  type="button"
                  onClick={() => setScope("GLOBAL")}
                  className={`h-10 rounded-md text-sm font-bold transition-all ${
                    scope === "GLOBAL"
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  }`}
                >
                  Global
                </button>
                <button
                  type="button"
                  onClick={() => setScope("PROJECT")}
                  className={`h-10 rounded-md text-sm font-bold transition-all ${
                    scope === "PROJECT"
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  }`}
                >
                  Per Proyek
                </button>
              </div>
              <input type="hidden" name="scope" value={scope} />
            </div>

            {scope === "PROJECT" && (
              <div className="mb-5">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Proyek <span className="text-red-500">*</span>
                </label>
                <select
                  name="projectId"
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-800 dark:text-white outline-none"
                >
                  <option value="">Pilih proyek...</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.code} - {project.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Keterangan <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="description"
                required
                placeholder="Deskripsi jurnal"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-800 dark:text-white placeholder-slate-400 outline-none"
              />
            </div>

            {/* Baris Jurnal */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Baris Jurnal</h3>
                <button
                  type="button"
                  onClick={addRow}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg transition-colors border border-gray-200 dark:border-slate-600"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Tambah Baris
                </button>
              </div>

              <div className="border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden">
                <div className="bg-gray-50 dark:bg-slate-800/80 px-4 py-2 flex border-b border-gray-200 dark:border-slate-700">
                  <div className="flex-1 text-[11px] font-bold text-slate-500 uppercase">Akun</div>
                  <div className="w-[120px] text-center text-[11px] font-bold text-slate-500 uppercase">Debit (Rp)</div>
                  <div className="w-[120px] text-center text-[11px] font-bold text-slate-500 uppercase">Kredit (Rp)</div>
                  {rows.length > 2 && <div className="w-8"></div>}
                </div>

                <div className="divide-y divide-gray-100 dark:divide-slate-700/50 bg-white dark:bg-slate-800">
                  {rows.map((row) => (
                    <div key={row.id} className="p-2 px-4 flex gap-3 items-center">
                      <div className="flex-1">
                        <select
                          value={row.accountId}
                          onChange={(e) => updateRow(row.id, "accountId", e.target.value)}
                          className="w-full px-2 py-1.5 border border-gray-200 dark:border-slate-600 rounded text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none pr-8"
                          style={{
                            backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2364748B%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E")`,
                            backgroundSize: "14px 14px",
                            backgroundPosition: "right 8px center",
                            backgroundRepeat: "no-repeat",
                          }}
                        >
                          <option value="">Pilih akun...</option>
                          {accounts.map((acc) => (
                            <option key={acc.id} value={acc.id}>
                              {acc.code} — {acc.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="w-[120px]">
                        <input
                          type="number"
                          value={row.debit === 0 ? "" : row.debit}
                          onChange={(e) => updateRow(row.id, "debit", e.target.value)}
                          className="w-full text-center px-2 py-1.5 border border-gray-200 dark:border-slate-600 rounded text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-400"
                          placeholder="0"
                        />
                      </div>
                      <div className="w-[120px]">
                        <input
                          type="number"
                          value={row.credit === 0 ? "" : row.credit}
                          onChange={(e) => updateRow(row.id, "credit", e.target.value)}
                          className="w-full text-center px-2 py-1.5 border border-gray-200 dark:border-slate-600 rounded text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-400"
                          placeholder="0"
                        />
                      </div>
                      {rows.length > 2 && (
                        <div className="w-8 flex justify-center">
                          <button type="button" onClick={() => removeRow(row.id)} className="text-slate-400 hover:text-red-500">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="px-4 py-3 flex items-center bg-gray-50 dark:bg-slate-800/50 border-t border-gray-200 dark:border-slate-700">
                  <div className="flex-1 text-[13px] font-bold text-slate-700 dark:text-slate-300">Total</div>
                  <div className={`w-[120px] text-center font-bold text-sm ${totalDebit === 0 ? "text-red-500" : isBalanced ? "text-slate-800 dark:text-white" : "text-red-500"}`}>
                    Rp {totalDebit.toLocaleString("id-ID")}
                  </div>
                  <div className={`w-[120px] text-center font-bold text-sm ${totalCredit === 0 ? "text-red-500" : isBalanced ? "text-slate-800 dark:text-white" : "text-red-500"}`}>
                    Rp {totalCredit.toLocaleString("id-ID")}
                  </div>
                  {rows.length > 2 && <div className="w-8"></div>}
                </div>
              </div>

              {!isBalanced && totalDebit > 0 && totalCredit > 0 && (
                <p className="text-red-500 text-xs mt-2 font-medium">Total debit dan kredit belum seimbang.</p>
              )}
            </div>

            {state?.error && (
              <div className="mt-4 text-red-500 text-xs font-medium p-2 bg-red-50 dark:bg-red-900/30 rounded border border-red-100 dark:border-red-800">
                {state.error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
            <button
              onClick={handleClose}
              type="button"
              className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!isBalanced || isPending}
              className={`px-4 py-2 text-sm font-semibold text-white rounded-lg transition-colors ${
                isBalanced
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-[#778da9] cursor-not-allowed opacity-90"
              } disabled:opacity-50`}
            >
              {isPending ? "Menyimpan..." : "Simpan Jurnal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
