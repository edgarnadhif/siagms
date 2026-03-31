"use client";

import React, { useState } from "react";

export default function LaporanKeuanganPage() {
  const [fromDate, setFromDate] = useState("2025-12-31");
  const [toDate, setToDate] = useState("2026-03-27");
  const [project, setProject] = useState("");
  const [activeTab, setActiveTab] = useState("laba_rugi");

  return (
    <div className="p-6 md:p-8 bg-[#f8fafc] dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-gray-100">
          Laporan Keuangan
        </h1>
        <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
          Laporan Laba Rugi & Neraca
        </p>
      </div>

      {/* Filters Card */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5 mb-6 shadow-sm">
        <div className="flex flex-col md:flex-row gap-5">
          <div className="w-full md:w-56">
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
          <div className="w-full md:w-56">
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
          <div className="flex-1 md:max-w-xs">
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
              Proyek
            </label>
            <div className="relative">
              <select 
                value={project}
                onChange={(e) => setProject(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none cursor-pointer transition-colors"
                style={{
                  backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%24%2024%22%20fill%3D%22none%22%20stroke%3D%22%2364748B%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E")`,
                  backgroundSize: "16px 16px",
                  backgroundPosition: "right 16px center",
                  backgroundRepeat: "no-repeat",
                  paddingRight: "40px"
                }}
              >
                <option value="">Semua Proyek</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => setActiveTab("laba_rugi")}
          className={`px-5 py-2.5 font-semibold text-sm rounded-lg transition-colors flex items-center gap-2 border ${
            activeTab === "laba_rugi"
              ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-white border-gray-200 dark:border-slate-700 shadow-sm"
              : "bg-transparent text-slate-500 dark:text-slate-400 border-transparent hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-emerald-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
          </svg>
          Laba Rugi
        </button>
        <button
          onClick={() => setActiveTab("neraca")}
          className={`px-5 py-2.5 font-semibold text-sm rounded-lg transition-colors flex items-center gap-2 border ${
            activeTab === "neraca"
              ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-white border-gray-200 dark:border-slate-700 shadow-sm"
              : "bg-transparent text-slate-500 dark:text-slate-400 border-transparent hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-orange-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.98-.203 1.99-.377 3-.52m0 0l2.469 9.456c.118.452-.082.93-.51 1.1A5.992 5.992 0 018.25 15c-1.042 0-2.04.265-2.94.75-.427.23-.628.718-.51 1.17l2.469 7.05m-3 0a5.986 5.986 0 01-2.031-.35c-.483-.173-.711-.703-.59-1.202L6.75 5.49" />
          </svg>
          Neraca
        </button>
      </div>

      {/* Main Content Area */}
      {activeTab === "laba_rugi" && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden mb-8">
          {/* Card Header */}
          <div className="p-6 border-b border-gray-200 dark:border-slate-700 flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Laporan Laba Rugi</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                PT Multi Griya Sejahtera • Periode 2025-12-31 s/d 2026-03-27
              </p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-lg transition-colors border border-gray-200 dark:border-slate-600">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Export CSV
            </button>
          </div>

          <div className="p-6 space-y-6">
            
            {/* Pendapatan Section */}
            <div className="border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden">
              <div className="bg-[#16a34a] text-white px-4 py-2 text-sm font-bold tracking-wide">
                Pendapatan
              </div>
              <div className="p-4 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                <p className="text-sm italic text-gray-400 dark:text-gray-500">Tidak ada data</p>
              </div>
              <div className="bg-gray-50 dark:bg-slate-800/80 px-4 py-3 flex justify-between items-center text-sm">
                <span className="font-bold text-slate-600 dark:text-slate-300 uppercase">Total Pendapatan</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">Rp 0</span>
              </div>
            </div>

            {/* Beban Section */}
            <div className="border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden">
              <div className="bg-[#ef4444] text-white px-4 py-2 text-sm font-bold tracking-wide">
                Beban
              </div>
              <div className="p-4 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                <p className="text-sm italic text-gray-400 dark:text-gray-500">Tidak ada data</p>
              </div>
              <div className="bg-gray-50 dark:bg-slate-800/80 px-4 py-3 flex justify-between items-center text-sm">
                <span className="font-bold text-slate-600 dark:text-slate-300 uppercase">Total Beban</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">Rp 0</span>
              </div>
            </div>

            {/* Laba Bersih Result Box */}
            <div className="border-2 border-emerald-500 rounded-lg bg-emerald-50/30 dark:bg-emerald-900/10 px-5 py-4 flex justify-between items-center shadow-sm">
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-emerald-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                </svg>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-sm tracking-wide">LABA BERSIH</span>
              </div>
              <span className="text-xl font-bold text-emerald-600">Rp 0</span>
            </div>

          </div>
        </div>
      )}

      {activeTab === "neraca" && (
         <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-12 text-center text-slate-500 dark:text-slate-400 shadow-sm">
            <p>Halaman Neraca sedang dalam pengembangan...</p>
         </div>
      )}

    </div>
  );
}
