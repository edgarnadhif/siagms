"use client";

import React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import * as xlsx from "xlsx";

function formatRupiah(num: number) {
  return "Rp " + num.toLocaleString("id-ID");
}

export default function NeracaSaldoClient({ 
  balances, 
  projects,
  fromDate,
  toDate,
  projectFilter 
}: { 
  balances: any[];
  projects: any[];
  fromDate: string;
  toDate: string;
  projectFilter: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.replace(`${pathname}?${params.toString()}`);
  };

  const totalDebit = balances.reduce((sum, item) => sum + item.finalDebit, 0);
  const totalCredit = balances.reduce((sum, item) => sum + item.finalCredit, 0);
  const isBalanced = totalDebit === totalCredit;

  const handleExportExcel = () => {
    const data = balances.map(item => ({
      "Kode Akun": item.code,
      "Nama Akun": item.name,
      "Debit": item.finalDebit,
      "Kredit": item.finalCredit
    }));
    
    // Add total row
    data.push({
      "Kode Akun": "",
      "Nama Akun": "TOTAL",
      "Debit": totalDebit,
      "Kredit": totalCredit
    });

    const worksheet = xlsx.utils.json_to_sheet(data);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Neraca Saldo");
    xlsx.writeFile(workbook, `Neraca_Saldo_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="border-2 shadow-xl border-gray-200 dark:border-gray-800 rounded-2xl bg-gray-100 dark:bg-[#0f172a] text-gray-600 dark:text-gray-300 pt-4 md:p-5 md:pt-5 min-h-screen printable-area">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 px-4 md:px-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 uppercase tracking-tight">Neraca Saldo</h1>
          <p className="text-sm text-gray-400 mt-3">Trial Balance | Ringkasan Saldo Akhir Akun</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 no-print w-full md:w-auto">
          <button onClick={handleExportExcel} className="flex-1 md:flex-none px-4 h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[10px] text-sm font-bold shadow-lg shadow-emerald-500/10 transition-all active:scale-95 flex items-center justify-center gap-2">
            Excel
          </button>
          <button onClick={handlePrint} className="flex-1 md:flex-none px-4 h-11 bg-slate-800 hover:bg-slate-700 text-white rounded-[10px] text-sm font-bold shadow-lg shadow-black/10 transition-all active:scale-95 flex items-center justify-center gap-2">
            Cetak / PDF
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-[12px] border border-[#E5E7EB] dark:border-slate-700 p-5 mb-6 shadow-sm no-print px-4">
        <div className="flex flex-col md:flex-row gap-5 items-end">
          <div className="w-full md:w-44">
            <label className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-wider">Mulai Dari</label>
            <input type="date" value={fromDate} onChange={(e) => handleFilterChange("from", e.target.value)} className="w-full h-11 px-4 rounded-[10px] border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-white focus:ring-4 focus:ring-[#EA6C00]/10 focus:border-[#EA6C00] outline-none transition-all" />
          </div>
          <div className="w-full md:w-44">
            <label className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-wider">Sampai Dengan</label>
            <input type="date" value={toDate} onChange={(e) => handleFilterChange("to", e.target.value)} className="w-full h-11 px-4 rounded-[10px] border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-white focus:ring-4 focus:ring-[#EA6C00]/10 focus:border-[#EA6C00] outline-none transition-all" />
          </div>
          <div className="flex-1">
            <label className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-wider">Filter Proyek</label>
            <select value={projectFilter} onChange={(e) => handleFilterChange("project", e.target.value)} className="w-full h-11 px-4 rounded-[10px] border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-white focus:ring-4 focus:ring-[#EA6C00]/10 focus:border-[#EA6C00] outline-none transition-all cursor-pointer">
              <option value="">Semua Proyek</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.code} - {p.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

        <div className="bg-white dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 rounded-[12px] shadow-sm overflow-hidden mb-10">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-[#F9FAFB] dark:bg-slate-900 border-b border-[#E5E7EB] dark:border-slate-700">
                <tr>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Kode</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nama Akun</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Debit</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Kredit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700/50">
                {balances.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/80 dark:hover:bg-slate-700/30 transition-all group">
                    <td className="px-6 py-4 whitespace-nowrap">
                       <span className="font-bold text-[#EA6C00]">{item.code}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300 font-medium">{item.name}</td>
                    <td className="px-6 py-4 text-right tabular-nums font-bold text-gray-900 dark:text-gray-100">{item.finalDebit > 0 ? formatRupiah(item.finalDebit) : "-"}</td>
                    <td className="px-6 py-4 text-right tabular-nums font-bold text-gray-900 dark:text-gray-100">{item.finalCredit > 0 ? formatRupiah(item.finalCredit) : "-"}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-[#F9FAFB] dark:bg-slate-900/80 font-black border-t-2 border-gray-200 dark:border-slate-700">
               <tr>
                 <td colSpan={2} className="px-6 py-5 text-right tracking-widest uppercase text-[11px] text-gray-500">Total Akhir</td>
                 <td className={`px-6 py-5 text-right tabular-nums text-base ${!isBalanced ? 'text-red-600 bg-red-50/50' : 'text-emerald-600 bg-emerald-50/30'}`}>{formatRupiah(totalDebit)}</td>
                 <td className={`px-6 py-5 text-right tabular-nums text-base ${!isBalanced ? 'text-red-600 bg-red-50/50' : 'text-emerald-600 bg-emerald-50/30'}`}>{formatRupiah(totalCredit)}</td>
               </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {!isBalanced && (
          <div className="mt-4 p-5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-[12px] text-red-700 dark:text-red-400 text-sm font-bold flex flex-col no-print shadow-sm">
            <div className="flex items-center gap-2 mb-1">
               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 18zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" /></svg>
               <span>Peringatan: Laporan Tidak Balance!</span>
            </div>
            <span className="opacity-90">Selisih: {formatRupiah(Math.abs(totalDebit - totalCredit))}</span>
            <span className="text-xs font-medium mt-2 opacity-70 italic">Mohon periksa kembali transaksi atau jurnal umum Anda untuk periode ini.</span>
          </div>
        )}

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * { visibility: hidden; }
          .printable-area, .printable-area * { visibility: visible; }
          .printable-area { position: absolute; left: 0; top: 0; width: 100%; border: none; box-shadow: none; background: white; padding: 0;}
          .no-print { display: none !important; }
        }
      `}} />
    </div>
  );
}
