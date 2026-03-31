"use client";

import React, { useState } from "react";


// Dummy data based on the screenshot provided
const dummyTransactions = [
  {
    id: 1,
    date: "09 Mar 2026",
    reference: "trx-003",
    descriptionTitle: "asdas",
    descriptionSub: "asdasd",
    project: "123",
    category: "Biaya Proyek",
    categoryColor: "text-orange-700 bg-orange-100 border-orange-200",
    amount: "Rp 10.000.000",
  },
  {
    id: 2,
    date: "05 Mar 2026",
    reference: "trx-002",
    descriptionTitle: "test down payment",
    descriptionSub: "kocak",
    project: "123",
    category: "Down Payment",
    categoryColor: "text-emerald-700 bg-emerald-100 border-emerald-200",
    amount: "Rp 1.000.000",
  },
  {
    id: 3,
    date: "03 Mar 2026",
    reference: "52123",
    descriptionTitle: "12312",
    descriptionSub: "ds",
    project: "123",
    category: "Biaya Operasional",
    categoryColor: "text-red-700 bg-red-100 border-red-200",
    amount: "Rp 100.000",
  },
  {
    id: 4,
    date: "28 Feb 2026",
    reference: "trx-100",
    descriptionTitle: "jual rumah a1",
    descriptionSub: "jasdaksd",
    project: "123",
    category: "Booking Fee",
    categoryColor: "text-blue-700 bg-blue-100 border-blue-200",
    amount: "Rp 100.000",
  },
  {
    id: 5,
    date: "25 Feb 2026",
    reference: "trx-001",
    descriptionTitle: "beli cat",
    descriptionSub: "10000asd",
    project: "-",
    category: "Biaya Proyek",
    categoryColor: "text-orange-700 bg-orange-100 border-orange-200",
    amount: "Rp 10.000",
  },
];

export default function TransaksiPage() {
  const [search, setSearch] = useState("");

  return (
    <div className="p-6 md:p-8 bg-[#f8fafc] dark:bg-gray-900 min-h-screen">
      {/* Header Container */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-gray-100">
            Transaksi
          </h1>
          <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
            Kelola semua transaksi keuangan
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#0f172a] hover:bg-slate-800 text-white text-sm font-medium rounded-lg transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Tambah Transaksi
        </button>
      </div>

      {/* Main Card */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
        
        {/* Filters Top Bar */}
        <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex flex-col md:flex-row gap-4 justify-between items-center">
          {/* Search */}
          <div className="relative w-full md:w-[400px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Cari keterangan atau referensi..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-slate-800 dark:text-white placeholder-slate-400 transition-colors"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Dropdowns */}
          <div className="flex gap-3 w-full md:w-auto">
            <select className="w-full md:w-40 px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none cursor-pointer transition-colors bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%24%2024%22%20fill%3D%22none%22%20stroke%3D%22%2364748B%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:16px_16px] bg-[right_12px_center] bg-no-repeat pr-10">
              <option value="">Semua Kategori</option>
              <option value="biaya_proyek">Biaya Proyek</option>
              <option value="down_payment">Down Payment</option>
              <option value="biaya_operasional">Biaya Operasional</option>
              <option value="booking_fee">Booking Fee</option>
            </select>
            
            <select className="w-full md:w-40 px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none cursor-pointer transition-colors bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%24%2024%22%20fill%3D%22none%22%20stroke%3D%22%2364748B%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:16px_16px] bg-[right_12px_center] bg-no-repeat pr-10">
              <option value="">Semua Proyek</option>
              <option value="123">123</option>
            </select>
          </div>
        </div>

        {/* Count Info */}
        <div className="px-5 py-3 border-b border-gray-100 dark:border-slate-800/50 bg-white dark:bg-slate-800">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {dummyTransactions.length} transaksi
          </p>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-[#f8fafc] dark:bg-slate-800/80 border-b border-gray-200 dark:border-slate-700">
              <tr>
                <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider w-[120px]">
                  TANGGAL
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider w-[140px]">
                  NO. REFERENSI
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  KETERANGAN
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider w-[100px]">
                  PROYEK
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider w-[160px]">
                  KATEGORI
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider w-[160px]">
                  JUMLAH (RP)
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider w-[100px]">
                  AKSI
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700/50 bg-white dark:bg-slate-800">
              {dummyTransactions.map((trx) => (
                <tr key={trx.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors group">
                  <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
                    {trx.date}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-slate-800 dark:text-slate-200">
                    {trx.reference}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{trx.descriptionTitle}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{trx.descriptionSub}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                    {trx.project}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${trx.categoryColor}`}>
                      {trx.category}
                    </span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-slate-800 dark:text-slate-200">
                    {trx.amount}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm text-slate-500">
                    <div className="flex items-center gap-3 opacity-70 group-hover:opacity-100 transition-opacity">
                      <button className="text-slate-400 hover:text-blue-600 transition-colors" title="Edit">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L5.32 18.67l1.47-3.32a4.5 4.5 0 011.13-1.897l8.94-8.94zM16.862 4.487L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                        </svg>
                      </button>
                      <button className="text-slate-400 hover:text-red-600 transition-colors" title="Hapus">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
