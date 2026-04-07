"use client";

import React, { useRef } from "react";
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
    <div className="bg-white dark:bg-slate-900 min-h-screen printable-area">
      <div className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Neraca Saldo</h1>
            <p className="text-sm text-slate-500 mt-1">Trial Balance | Siagms</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 no-print">
            <input type="date" value={fromDate} onChange={(e) => handleFilterChange("from", e.target.value)} className="px-3 py-2 border rounded-lg text-sm bg-white dark:bg-slate-800 dark:border-slate-700" />
            <span className="text-slate-400">-</span>
            <input type="date" value={toDate} onChange={(e) => handleFilterChange("to", e.target.value)} className="px-3 py-2 border rounded-lg text-sm bg-white dark:bg-slate-800 dark:border-slate-700" />
            
            <select value={projectFilter} onChange={(e) => handleFilterChange("project", e.target.value)} className="px-3 py-2 border rounded-lg text-sm bg-white dark:bg-slate-800 dark:border-slate-700">
              <option value="">Semua Proyek</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.code} - {p.name}</option>
              ))}
            </select>

            <button onClick={handleExportExcel} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-colors">
              Export Excel
            </button>
            <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-semibold transition-colors">
              Cetak PDF / Print
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-800/50 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-4 font-bold">Kode</th>
                  <th className="px-6 py-4 font-bold">Nama Akun</th>
                  <th className="px-6 py-4 font-bold text-right">Debit</th>
                  <th className="px-6 py-4 font-bold text-right">Kredit</th>
                </tr>
              </thead>
              <tbody>
                {balances.map((item, idx) => (
                  <tr key={idx} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-3 font-semibold text-[#EA6C00]">{item.code}</td>
                    <td className="px-6 py-3 font-medium text-slate-700 dark:text-slate-300">{item.name}</td>
                    <td className="px-6 py-3 text-right tabular-nums">{item.finalDebit > 0 ? formatRupiah(item.finalDebit) : "-"}</td>
                    <td className="px-6 py-3 text-right tabular-nums">{item.finalCredit > 0 ? formatRupiah(item.finalCredit) : "-"}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 dark:bg-slate-800/80 font-bold border-t-2 border-slate-200 dark:border-slate-700">
               <tr>
                 <td colSpan={2} className="px-6 py-4 text-right tracking-wide uppercase text-slate-700 dark:text-slate-200">Total</td>
                 <td className={`px-6 py-4 text-right tabular-nums ${!isBalanced ? 'text-red-600' : 'text-emerald-600'}`}>{formatRupiah(totalDebit)}</td>
                 <td className={`px-6 py-4 text-right tabular-nums ${!isBalanced ? 'text-red-600' : 'text-emerald-600'}`}>{formatRupiah(totalCredit)}</td>
               </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {!isBalanced && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-semibold flex flex-col no-print">
            <span>Peringatan: Jurnal tidak balance! Selisih: {formatRupiah(Math.abs(totalDebit - totalCredit))}</span>
            <span className="text-xs font-normal mt-1 opacity-80">Mohon periksa kembali transaksi atau jurnal umum Anda.</span>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * { visibility: hidden; }
          .printable-area, .printable-area * { visibility: visible; }
          .printable-area { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}} />
    </div>
  );
}
