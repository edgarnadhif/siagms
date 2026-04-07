"use client";

import React from "react";
import Link from "next/link";

interface AccountBalance {
  code: string;
  name: string;
  type: string;
  normalBalance: string;
  balance: number;
}

interface Project {
  id: string;
  code: string;
  name: string;
}

function formatRupiah(num: number) {
  return "Rp " + Math.abs(num).toLocaleString("id-ID");
}

export default function LaporanClient({
  activeTab,
  fromDate,
  toDate,
  projectFilter,
  projects,
  companyName,
  pendapatan,
  beban,
  totalPendapatan,
  totalBeban,
  labaBersih,
  aset,
  kewajiban,
  ekuitas,
  totalAset,
  totalKewajiban,
  totalEkuitas,
  pendapatanBelumDiakui = 0,
}: {
  activeTab: string;
  fromDate: string;
  toDate: string;
  projectFilter: string;
  projects: Project[];
  companyName: string;
  pendapatan: AccountBalance[];
  beban: AccountBalance[];
  totalPendapatan: number;
  totalBeban: number;
  labaBersih: number;
  aset: AccountBalance[];
  kewajiban: AccountBalance[];
  ekuitas: AccountBalance[];
  totalAset: number;
  totalKewajiban: number;
  totalEkuitas: number;
  pendapatanBelumDiakui?: number;
}) {
  const periodLabel = fromDate && toDate ? `${fromDate} s/d ${toDate}` : "Semua Periode";

  return (
    <div className="border-2 shadow-xl border-gray-200 dark:border-gray-800 rounded-2xl bg-gray-100 dark:bg-[#0f172a] text-gray-600 dark:text-gray-300 p-6 md:p-8 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-gray-100">Laporan Keuangan</h1>
        <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">Laporan Laba Rugi & Neraca</p>
      </div>

      {/* Filters */}
      <form className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5 mb-6 shadow-sm">
        <div className="flex flex-col md:flex-row gap-5">
          <div className="w-full md:w-56">
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Dari Tanggal</label>
            <input type="date" name="from" defaultValue={fromDate}
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors" />
          </div>
          <div className="w-full md:w-56">
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Sampai Tanggal</label>
            <input type="date" name="to" defaultValue={toDate}
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors" />
          </div>
          <div className="flex-1 md:max-w-xs">
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Proyek</label>
            <select name="project" defaultValue={projectFilter}
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none cursor-pointer transition-colors pr-10"
              style={{
                backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2364748B%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E")`,
                backgroundSize: "16px 16px",
                backgroundPosition: "right 16px center",
                backgroundRepeat: "no-repeat",
              }}
            >
              <option value="">Semua Proyek</option>
              {projects.map((p) => (<option key={p.id} value={p.id}>{p.code} — {p.name}</option>))}
            </select>
          </div>
          <div className="flex items-end">
            <button type="submit" className="px-4 py-2.5 bg-gray-900 dark:bg-slate-700 hover:bg-gray-800 dark:hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors">
              Filter
            </button>
          </div>
        </div>
      </form>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6">
        <Link
          href={`?tab=laba_rugi${fromDate ? `&from=${fromDate}` : ""}${toDate ? `&to=${toDate}` : ""}${projectFilter ? `&project=${projectFilter}` : ""}`}
          className={`px-5 py-2.5 font-semibold text-sm rounded-lg transition-colors flex items-center gap-2 border ${
            activeTab === "laba_rugi"
              ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-white border-gray-200 dark:border-slate-700 shadow-sm"
              : "bg-transparent text-slate-500 dark:text-slate-400 border-transparent hover:bg-gray-100 dark:hover:bg-slate-800"
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-emerald-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
          </svg>
          Laba Rugi
        </Link>
        <Link
          href={`?tab=neraca${fromDate ? `&from=${fromDate}` : ""}${toDate ? `&to=${toDate}` : ""}${projectFilter ? `&project=${projectFilter}` : ""}`}
          className={`px-5 py-2.5 font-semibold text-sm rounded-lg transition-colors flex items-center gap-2 border ${
            activeTab === "neraca"
              ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-white border-gray-200 dark:border-slate-700 shadow-sm"
              : "bg-transparent text-slate-500 dark:text-slate-400 border-transparent hover:bg-gray-100 dark:hover:bg-slate-800"
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-orange-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.98-.203 1.99-.377 3-.52m0 0l2.469 9.456c.118.452-.082.93-.51 1.1A5.992 5.992 0 018.25 15c-1.042 0-2.04.265-2.94.75-.427.23-.628.718-.51 1.17l2.469 7.05m-3 0a5.986 5.986 0 01-2.031-.35c-.483-.173-.711-.703-.59-1.202L6.75 5.49" />
          </svg>
          Neraca
        </Link>
      </div>

      {/* Laba Rugi */}
      {activeTab === "laba_rugi" && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-200 dark:border-slate-700">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Laporan Laba Rugi</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{companyName} • Periode {periodLabel}</p>
          </div>
          <div className="p-6 space-y-6">
            {/* Pendapatan */}
            <div className="border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden">
              <div className="bg-[#16a34a] text-white px-4 py-2 text-sm font-bold tracking-wide">Pendapatan</div>
              <div className="bg-white dark:bg-slate-800">
                {pendapatan.length === 0 ? (
                  <div className="p-4 border-b border-gray-200 dark:border-slate-700">
                    <p className="text-sm italic text-gray-400 dark:text-gray-500">Tidak ada data</p>
                  </div>
                ) : (
                  pendapatan.map((a) => (
                    <div key={a.code} className="flex justify-between px-4 py-3 border-b border-gray-100 dark:border-slate-700/50 text-sm">
                      <span className="text-slate-700 dark:text-slate-300">{a.code} — {a.name}</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">{formatRupiah(a.balance)}</span>
                    </div>
                  ))
                )}
              </div>
              <div className="bg-amber-50/50 dark:bg-amber-900/10 px-4 py-3 flex justify-between items-center text-sm border-t border-gray-100 dark:border-slate-700/50">
                <span className="text-amber-700 dark:text-amber-500 italic">Pendapatan belum diakui (dalam proses)</span>
                <span className="font-semibold text-amber-700 dark:text-amber-500">{formatRupiah(pendapatanBelumDiakui)}</span>
              </div>
              <div className="bg-gray-50 dark:bg-slate-800/80 px-4 py-3 flex justify-between items-center text-sm border-t border-gray-200 dark:border-slate-700">
                <span className="font-bold text-slate-600 dark:text-slate-300 uppercase">Total Pendapatan Diakui</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{formatRupiah(totalPendapatan)}</span>
              </div>
            </div>

            {/* Beban */}
            <div className="border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden">
              <div className="bg-[#ef4444] text-white px-4 py-2 text-sm font-bold tracking-wide">Beban</div>
              <div className="bg-white dark:bg-slate-800">
                {beban.length === 0 ? (
                  <div className="p-4 border-b border-gray-200 dark:border-slate-700">
                    <p className="text-sm italic text-gray-400 dark:text-gray-500">Tidak ada data</p>
                  </div>
                ) : (
                  beban.map((a) => (
                    <div key={a.code} className="flex justify-between px-4 py-3 border-b border-gray-100 dark:border-slate-700/50 text-sm">
                      <span className="text-slate-700 dark:text-slate-300">{a.code} — {a.name}</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">{formatRupiah(a.balance)}</span>
                    </div>
                  ))
                )}
              </div>
              <div className="bg-gray-50 dark:bg-slate-800/80 px-4 py-3 flex justify-between items-center text-sm">
                <span className="font-bold text-slate-600 dark:text-slate-300 uppercase">Total Beban</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{formatRupiah(totalBeban)}</span>
              </div>
            </div>

            {/* Laba Bersih */}
            <div className={`border-2 rounded-lg px-5 py-4 flex justify-between items-center shadow-sm ${
              labaBersih >= 0
                ? "border-emerald-500 bg-emerald-50/30 dark:bg-emerald-900/10"
                : "border-red-500 bg-red-50/30 dark:bg-red-900/10"
            }`}>
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`w-5 h-5 ${labaBersih >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                </svg>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-sm tracking-wide">
                  {labaBersih >= 0 ? "LABA BERSIH" : "RUGI BERSIH"}
                </span>
              </div>
              <span className={`text-xl font-bold ${labaBersih >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                {formatRupiah(labaBersih)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Neraca */}
      {activeTab === "neraca" && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-200 dark:border-slate-700">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Neraca (Balance Sheet)</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{companyName} • Per {toDate || "Hari ini"}</p>
          </div>
          <div className="p-6 space-y-6">
            {/* Aset */}
            <div className="border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden">
              <div className="bg-blue-600 text-white px-4 py-2 text-sm font-bold tracking-wide">Aset</div>
              <div className="bg-white dark:bg-slate-800">
                {aset.length === 0 ? (
                  <div className="p-4"><p className="text-sm italic text-gray-400">Tidak ada data</p></div>
                ) : (
                  aset.map((a) => (
                    <div key={a.code} className="flex justify-between px-4 py-3 border-b border-gray-100 dark:border-slate-700/50 text-sm">
                      <span className="text-slate-700 dark:text-slate-300">{a.code} — {a.name}</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">{formatRupiah(a.balance)}</span>
                    </div>
                  ))
                )}
              </div>
              <div className="bg-gray-50 dark:bg-slate-800/80 px-4 py-3 flex justify-between items-center text-sm">
                <span className="font-bold text-slate-600 dark:text-slate-300 uppercase">Total Aset</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{formatRupiah(totalAset)}</span>
              </div>
            </div>

            {/* Kewajiban */}
            <div className="border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden">
              <div className="bg-orange-500 text-white px-4 py-2 text-sm font-bold tracking-wide">Kewajiban</div>
              <div className="bg-white dark:bg-slate-800">
                {kewajiban.length === 0 ? (
                  <div className="p-4"><p className="text-sm italic text-gray-400">Tidak ada data</p></div>
                ) : (
                  kewajiban.map((a) => (
                    <div key={a.code} className="flex justify-between px-4 py-3 border-b border-gray-100 dark:border-slate-700/50 text-sm">
                      <span className="text-slate-700 dark:text-slate-300">{a.code} — {a.name}</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">{formatRupiah(a.balance)}</span>
                    </div>
                  ))
                )}
              </div>
              <div className="bg-gray-50 dark:bg-slate-800/80 px-4 py-3 flex justify-between items-center text-sm">
                <span className="font-bold text-slate-600 dark:text-slate-300 uppercase">Total Kewajiban</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{formatRupiah(totalKewajiban)}</span>
              </div>
            </div>

            {/* Ekuitas */}
            <div className="border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden">
              <div className="bg-purple-600 text-white px-4 py-2 text-sm font-bold tracking-wide">Ekuitas</div>
              <div className="bg-white dark:bg-slate-800">
                {ekuitas.length === 0 ? (
                  <div className="p-4"><p className="text-sm italic text-gray-400">Tidak ada data</p></div>
                ) : (
                  ekuitas.map((a) => (
                    <div key={a.code} className="flex justify-between px-4 py-3 border-b border-gray-100 dark:border-slate-700/50 text-sm">
                      <span className="text-slate-700 dark:text-slate-300">{a.code} — {a.name}</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">{formatRupiah(a.balance)}</span>
                    </div>
                  ))
                )}
              </div>
              <div className="bg-gray-50 dark:bg-slate-800/80 px-4 py-3 flex justify-between items-center text-sm">
                <span className="font-bold text-slate-600 dark:text-slate-300 uppercase">Total Ekuitas</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{formatRupiah(totalEkuitas)}</span>
              </div>
            </div>

            {/* Balance check */}
            <div className="border-2 border-blue-500 rounded-lg bg-blue-50/30 dark:bg-blue-900/10 px-5 py-4 flex justify-between items-center shadow-sm">
              <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">TOTAL KEWAJIBAN + EKUITAS</span>
              <span className="text-xl font-bold text-blue-600">{formatRupiah(totalKewajiban + totalEkuitas)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
