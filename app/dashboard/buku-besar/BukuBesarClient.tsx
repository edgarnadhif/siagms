"use client";

import React from "react";

interface AccountOption {
  id: string;
  code: string;
  name: string;
  type: string;
  normalBalance: string;
}

interface LedgerAccount {
  id: string;
  code: string;
  name: string;
  type: string;
  normalBalance: string;
  transactions: { id: string; date: string; reference: string; description: string | null; debit: number; credit: number; balance: number }[];
  endingBalance: number;
}

const TYPE_MAP: Record<string, string> = {
  ASET: "Asset",
  KEWAJIBAN: "Liability",
  EKUITAS: "Equity",
  PENDAPATAN: "Revenue",
  BEBAN: "Expense",
};

function formatRupiah(num: number) {
  return "Rp " + Math.abs(num).toLocaleString("id-ID");
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${d.getDate().toString().padStart(2, "0")} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export default function BukuBesarClient({
  allAccounts,
  ledgerAccounts,
  totalDebit,
  totalCredit,
  accountFilter,
  fromDate,
  toDate,
}: {
  allAccounts: AccountOption[];
  ledgerAccounts: LedgerAccount[];
  totalDebit: number;
  totalCredit: number;
  accountFilter: string;
  fromDate: string;
  toDate: string;
}) {
  return (
    <div className="border-2 shadow-xl border-gray-200 dark:border-gray-800 rounded-2xl bg-gray-100 dark:bg-[#0f172a] text-gray-600 dark:text-gray-300 pt-4 md:p-5 md:pt-5 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 lg:mb-3 px-4 md:px-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
            Buku Besar
          </h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            General Ledger — Posting otomatis dari jurnal umum
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 md:px-0">
        <form className="bg-white dark:bg-slate-800 rounded-[14px] border-[0.5px] border-[#E5E7EB] dark:border-slate-700/50 p-5 mb-6 shadow-sm">
          <div className="flex flex-col md:flex-row gap-5">
            <div className="flex-1">
              <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-[0.15em]">Akun</label>
              <div className="relative">
                <select
                  name="account"
                  defaultValue={accountFilter}
                  className="w-full h-11 px-4 border border-[#E5E7EB] dark:border-slate-700 rounded-[10px] text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#EA6C00]/10 focus:border-[#EA6C00] appearance-none cursor-pointer transition-all pr-10 font-semibold shadow-sm"
                  style={{
                    backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%239CA3AF%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E")`,
                    backgroundSize: "16px 16px",
                    backgroundPosition: "right 16px center",
                    backgroundRepeat: "no-repeat",
                  }}
                >
                  <option value="">Semua Akun</option>
                  {allAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="w-full md:w-52">
              <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-[0.15em]">Dari Tanggal</label>
              <input
                type="date"
                name="from"
                defaultValue={fromDate}
                className="w-full h-11 px-4 border border-[#E5E7EB] dark:border-slate-700 rounded-[10px] text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#EA6C00]/10 focus:border-[#EA6C00] transition-all font-semibold shadow-sm"
              />
            </div>
            <div className="w-full md:w-52">
              <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-[0.15em]">Sampai Tanggal</label>
              <input
                type="date"
                name="to"
                defaultValue={toDate}
                className="w-full h-11 px-4 border border-[#E5E7EB] dark:border-slate-700 rounded-[10px] text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#EA6C00]/10 focus:border-[#EA6C00] transition-all font-semibold shadow-sm"
              />
            </div>
            <div className="flex items-end self-stretch md:self-auto">
              <button
                type="submit"
                className="w-full md:w-auto px-8 h-11 bg-[#EA6C00] hover:bg-[#C25500] text-white text-sm font-bold rounded-[10px] transition-all active:scale-95 shadow-lg shadow-orange-500/20"
              >
                Filter
              </button>
            </div>
          </div>
        </form>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-[14px] border-[0.5px] border-[#E5E7EB] dark:border-slate-700/50 p-5 shadow-sm flex flex-col justify-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-12 h-12 text-[#EA6C00]">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
              </svg>
            </div>
            <div className="flex items-center gap-2 mb-2 text-[#EA6C00]">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Total Debit</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{formatRupiah(totalDebit)}</h2>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-[14px] border-[0.5px] border-[#E5E7EB] dark:border-slate-700/50 p-5 shadow-sm flex flex-col justify-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-12 h-12 text-[#EA6C00]">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6L9 12.75l4.286-4.286a11.948 11.948 0 014.306 6.43l.776 2.898m0 0l3.182-5.511m-3.182 5.51l-5.511-3.181" />
              </svg>
            </div>
            <div className="flex items-center gap-2 mb-2 text-[#EA6C00]">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Total Kredit</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{formatRupiah(totalCredit)}</h2>
          </div>
        </div>

        {/* Empty state */}
        {ledgerAccounts.length === 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-[14px] border-[0.5px] border-[#E5E7EB] dark:border-slate-700 p-16 text-center shadow-sm">
            <div className="w-14 h-14 bg-[#FFF0E6] dark:bg-orange-950/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-orange-100 dark:border-orange-900/30">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-[#EA6C00]">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <p className="text-sm font-bold text-gray-700 dark:text-gray-200">Belum ada data buku besar.</p>
            <p className="text-xs text-gray-400 mt-1">Gunakan filter untuk memilih akun atau buat transaksi terlebih dahulu.</p>
          </div>
        )}

        {/* Account Ledgers */}
        <div className="space-y-8 pb-10">
          {ledgerAccounts.map((account) => (
            <div key={account.id} className="bg-white dark:bg-slate-800 rounded-[14px] border-[0.5px] border-[#E5E7EB] dark:border-slate-700/50 shadow-sm overflow-hidden">
              <div className="px-6 py-5 flex flex-col md:flex-row justify-between items-start md:items-center bg-[#F9FAFB]/50 dark:bg-slate-700/20 border-b border-[#F1F5F9] dark:border-slate-700">
                <div className="flex flex-col gap-1">
                  <h3 className="text-[16px] font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                    <span className="text-[#EA6C00]">{account.code}</span>
                    <span>{account.name}</span>
                  </h3>
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{TYPE_MAP[account.type] || account.type}</span>
                </div>
                <div className="mt-4 md:mt-0 flex flex-col md:items-end">
                  <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-1">Saldo Akhir</span>
                  <span className={`text-lg font-bold ${account.endingBalance >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
                    {formatRupiah(account.endingBalance)}
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead className="bg-[#F9FAFB] dark:bg-slate-700/40 border-b border-[#F1F5F9] dark:border-slate-700">
                    <tr>
                      <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] w-[130px]">TANGGAL</th>
                      <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] w-[150px]">REFERENSI</th>
                      <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em]">KETERANGAN</th>
                      <th className="px-6 py-4 text-right text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] w-[160px]">DEBIT</th>
                      <th className="px-6 py-4 text-right text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] w-[160px]">KREDIT</th>
                      <th className="px-6 py-4 text-right text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] w-[160px]">SALDO</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F8FAFC] dark:divide-slate-700/50">
                    {account.transactions.map((trx) => (
                      <tr key={trx.id} className="hover:bg-[#FFF0E6]/30 dark:hover:bg-orange-500/5 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-xs font-medium text-gray-500 dark:text-gray-400">{formatDate(trx.date)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-gray-900 dark:text-gray-200">{trx.reference}</td>
                        <td className="px-6 py-4 text-xs font-semibold text-gray-700 dark:text-gray-300 capitalize">{trx.description || "-"}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-gray-100 text-right">
                          {trx.debit > 0 ? formatRupiah(trx.debit) : "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-gray-100 text-right">
                          {trx.credit > 0 ? formatRupiah(trx.credit) : "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-[#EA6C00] text-right">
                          {formatRupiah(trx.balance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
