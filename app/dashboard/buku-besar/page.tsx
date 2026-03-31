"use client";

import React, { useState } from "react";

// Dummy data
const ledgerAccounts = [
  {
    id: "1-1000",
    name: "Kas",
    type: "Asset",
    endingBalance: "Rp 0",
    transactions: [
      { id: 1, date: "09 Mar 2026", reference: "jule-001", description: "amdkjasd", debit: "", credit: "Rp 10.000", balance: "Rp 0" },
    ]
  },
  {
    id: "2-1000",
    name: "Utang Usaha",
    type: "Liability",
    endingBalance: "Rp 0",
    transactions: [
      { id: 2, date: "09 Mar 2026", reference: "jule-001", description: "amdkjasd", debit: "", credit: "Rp 20.000", balance: "Rp 0" },
    ]
  }
];

export default function BukuBesarPage() {
  const [account, setAccount] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  return (
    <div className="p-6 md:p-8 bg-[#f8fafc] dark:bg-gray-900 min-h-screen">
      {/* Header Container */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-gray-100">
          Buku Besar
        </h1>
        <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
          Ledger — posting otomatis dari jurnal umum
        </p>
      </div>

      {/* Filters Card */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5 mb-6 shadow-sm">
        <div className="flex flex-col md:flex-row gap-5">
          <div className="flex-1">
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
              Akun
            </label>
            <div className="relative">
              <select 
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none cursor-pointer transition-colors"
                style={{
                  backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%24%2024%22%20fill%3D%22none%22%20stroke%3D%22%2364748B%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E")`,
                  backgroundSize: "16px 16px",
                  backgroundPosition: "right 16px center",
                  backgroundRepeat: "no-repeat",
                  paddingRight: "40px"
                }}
              >
                <option value="">Semua Akun</option>
                <option value="1-1000">1-1000 - Kas</option>
                <option value="2-1000">2-1000 - Utang Usaha</option>
              </select>
            </div>
          </div>
          <div className="w-full md:w-48">
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
              Dari Tanggal
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
            />
          </div>
          <div className="w-full md:w-48">
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
              Sampai Tanggal
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-2 text-teal-600 dark:text-teal-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
            </svg>
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Debit</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Rp 30.000</h2>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-2 text-blue-600 dark:text-blue-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6L9 12.75l4.286-4.286a11.948 11.948 0 014.306 6.43l.776 2.898m0 0l3.182-5.511m-3.182 5.51l-5.511-3.181" />
            </svg>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Kredit</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Rp 30.000</h2>
        </div>
      </div>

      {/* Account Ledgers */}
      <div className="space-y-6">
        {ledgerAccounts.map((account) => (
          <div key={account.id} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
            {/* Account Header */}
            <div className="px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-200 dark:border-slate-700">
              <h3 className="text-[15px] font-bold text-slate-800 dark:text-slate-100">
                {account.id} {account.name} <span className="text-slate-400 font-normal">({account.type})</span>
              </h3>
              <div className="mt-2 md:mt-0 flex flex-col md:items-end">
                <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Saldo Akhir</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{account.endingBalance}</span>
              </div>
            </div>

            {/* Transactions Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="bg-[#f8fafc] dark:bg-slate-800/80 border-b border-gray-200 dark:border-slate-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider w-[120px]">TANGGAL</th>
                    <th className="px-6 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider w-[140px]">REFERENSI</th>
                    <th className="px-6 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">KETERANGAN</th>
                    <th className="px-6 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider w-[140px]">DEBIT</th>
                    <th className="px-6 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider w-[140px]">KREDIT</th>
                    <th className="px-6 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider w-[120px]">SALDO</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700/50">
                  {account.transactions.map((trx) => (
                    <tr key={trx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
                        {trx.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {trx.reference}
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-700 dark:text-slate-300">
                        {trx.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800 dark:text-slate-200">
                        {trx.debit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800 dark:text-slate-200">
                        {trx.credit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {trx.balance}
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
  );
}
