"use client";

import React, { useState } from "react";

export default function AddJurnalModal({ onClose }: { onClose: () => void }) {
  const [rows, setRows] = useState([
    { id: 1, account: "", debit: 0, credit: 0 },
    { id: 2, account: "", debit: 0, credit: 0 },
  ]);

  const addRow = () => {
    setRows([...rows, { id: Date.now(), account: "", debit: 0, credit: 0 }]);
  };

  const updateRow = (id: number, field: string, value: string | number) => {
    setRows(rows.map(row => row.id === id ? { ...row, [field]: value } : row));
  };

  const removeRow = (id: number) => {
    if (rows.length > 2) {
      setRows(rows.filter(row => row.id !== id));
    }
  };

  const totalDebit = rows.reduce((sum, row) => sum + Number(row.debit || 0), 0);
  const totalCredit = rows.reduce((sum, row) => sum + Number(row.credit || 0), 0);
  const isBalanced = totalDebit === totalCredit && totalDebit > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Tambah Entri Jurnal</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Tanggal <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                defaultValue="2026-03-27"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                No. Referensi <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                defaultValue="JU-001"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-gray-50 dark:bg-slate-700/50 text-slate-800 dark:text-white"
                readOnly
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Keterangan <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Deskripsi jurnal"
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-800 dark:text-white placeholder-slate-400"
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
                {rows.map((row, index) => (
                  <div key={row.id} className="p-2 px-4 flex gap-3 items-center">
                    <div className="flex-1">
                      <select 
                        className="w-full px-2 py-1.5 border border-gray-200 dark:border-slate-600 rounded text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%24%2024%22%20fill%3D%22none%22%20stroke%3D%22%2364748B%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:14px_14px] bg-[right_8px_center] bg-no-repeat pr-8"
                      >
                        <option value="">Pilih akun...</option>
                        <option value="1-1000">1-1000 — Kas</option>
                        <option value="2-1000">2-1000 — Utang Usaha</option>
                      </select>
                    </div>
                    <div className="w-[120px]">
                      <input
                        type="number"
                        value={row.debit === 0 ? "0" : row.debit}
                        onChange={(e) => updateRow(row.id, 'debit', e.target.value)}
                        className="w-full text-center px-2 py-1.5 border border-gray-200 dark:border-slate-600 rounded text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-400"
                        placeholder="0"
                      />
                    </div>
                    <div className="w-[120px]">
                      <input
                        type="number"
                        value={row.credit === 0 ? "0" : row.credit}
                        onChange={(e) => updateRow(row.id, 'credit', e.target.value)}
                        className="w-full text-center px-2 py-1.5 border border-gray-200 dark:border-slate-600 rounded text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-400"
                        placeholder="0"
                      />
                    </div>
                    {rows.length > 2 && (
                      <div className="w-8 flex justify-center">
                        <button onClick={() => removeRow(row.id)} className="text-slate-400 hover:text-red-500">
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
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors"
          >
            Batal
          </button>
          <button
            className={`px-4 py-2 text-sm font-semibold text-white rounded-lg transition-colors ${
              isBalanced 
                ? "bg-blue-600 hover:bg-blue-700" 
                : "bg-[#778da9] cursor-not-allowed opacity-90"
            }`}
          >
            Simpan Jurnal
          </button>
        </div>
      </div>
    </div>
  );
}
