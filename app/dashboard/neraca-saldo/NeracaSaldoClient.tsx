"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type NeracaSaldoItem = {
  code: string;
  name: string;
  finalDebit: number;
  finalCredit: number;
};

type ProjectOption = {
  id: string;
  code: string;
  name: string;
};

function formatRupiah(num: number) {
  return "Rp " + num.toLocaleString("id-ID");
}

export default function NeracaSaldoClient({
  balances,
  projects,
  fromDate,
  toDate,
  projectFilter,
}: {
  balances: NeracaSaldoItem[];
  projects: ProjectOption[];
  companyName: string;
  fromDate: string;
  toDate: string;
  projectFilter: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [fromDateFocused, setFromDateFocused] = useState(false);
  const [toDateFocused, setToDateFocused] = useState(false);
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);
  const projectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        projectRef.current &&
        !projectRef.current.contains(event.target as Node)
      ) {
        setProjectMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const totalDebit = balances.reduce(
    (sum, item) => sum + item.finalDebit,
    0,
  );
  const totalCredit = balances.reduce(
    (sum, item) => sum + item.finalCredit,
    0,
  );
  const selisih = Math.abs(totalDebit - totalCredit);
  const isBalanced = selisih <= 1;

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const resetFilters = () => {
    router.replace(pathname, { scroll: false });
  };

  const hideNativeDateIcon = (
    <style>{`
      input[type="date"]::-webkit-calendar-picker-indicator {
        display: none;
        -webkit-appearance: none;
      }
    `}</style>
  );

  return (
    <div className="text-slate-600 dark:text-slate-300 w-full h-full printable-area pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 px-4 md:px-0">
        <div>
          <h1 className="page-title dark:text-white">Neraca Saldo</h1>
          <p className="card-subtitle text-slate-400 dark:text-slate-400 mt-2">
            Ringkasan saldo akhir akun dari jurnal umum
          </p>
        </div>
      </div>

      <div className="px-4 md:px-0">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3 no-print">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-orange-600 mb-2">
              Total Debit
            </p>
            <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white tabular-nums">
              {formatRupiah(totalDebit)}
            </h2>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-orange-600 mb-2">
              Total Kredit
            </p>
            <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white tabular-nums">
              {formatRupiah(totalCredit)}
            </h2>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-orange-600 mb-2">
              Status
            </p>
            <div className="flex items-end justify-between gap-3">
              <h2
                className={`text-2xl lg:text-3xl font-bold ${isBalanced ? "text-emerald-600" : "text-rose-600"}`}
              >
                {isBalanced ? "Balance" : "Selisih"}
              </h2>
              {!isBalanced && (
                <span className="text-sm font-bold text-rose-600 tabular-nums">
                  {formatRupiah(selisih)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="sticky -top-6 z-30 pt-2 pb-3 bg-white dark:bg-[#111827] -mx-6 px-6 no-print mb-3">
          <div className="flex flex-col md:flex-row flex-wrap items-center justify-end gap-3 w-full">
            {hideNativeDateIcon}
            <div className="w-full md:w-[150px] lg:w-[160px] relative">
              <div className="h-11 inline-flex w-full items-center justify-between rounded-xl border-[0.5px] border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-800 transition-colors relative">
                {!fromDate && !fromDateFocused && (
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 pointer-events-none">
                    Dari Tanggal
                  </span>
                )}
                <input
                  type="date"
                  value={fromDate}
                  onChange={(event) => handleFilterChange("from", event.target.value)}
                  onFocus={() => setFromDateFocused(true)}
                  onBlur={() => setFromDateFocused(false)}
                  onClick={(event) => event.currentTarget.showPicker()}
                  className={`w-full h-11 pl-3 pr-8 border-0 bg-transparent text-sm font-normal focus:ring-0 focus:outline-none outline-none cursor-pointer rounded-xl ${fromDate || fromDateFocused ? "text-slate-700 dark:text-slate-200" : "text-transparent"}`}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-slate-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="w-full md:w-[150px] lg:w-[160px] relative">
              <div className="h-11 inline-flex w-full items-center justify-between rounded-xl border-[0.5px] border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-800 transition-colors relative">
                {!toDate && !toDateFocused && (
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 pointer-events-none">
                    Sampai Tanggal
                  </span>
                )}
                <input
                  type="date"
                  value={toDate}
                  onChange={(event) => handleFilterChange("to", event.target.value)}
                  onFocus={() => setToDateFocused(true)}
                  onBlur={() => setToDateFocused(false)}
                  onClick={(event) => event.currentTarget.showPicker()}
                  className={`w-full h-11 pl-3 pr-8 border-0 bg-transparent text-sm font-normal focus:ring-0 focus:outline-none outline-none cursor-pointer rounded-xl ${toDate || toDateFocused ? "text-slate-700 dark:text-slate-200" : "text-transparent"}`}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-slate-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="w-full md:w-[150px] lg:w-[160px] relative" ref={projectRef}>
              <button
                type="button"
                onClick={() => setProjectMenuOpen(!projectMenuOpen)}
                className="w-full h-11 inline-flex items-center justify-between px-3 bg-white dark:bg-slate-800 border-[0.5px] border-[#E5E7EB] dark:border-slate-700 rounded-xl transition-colors"
              >
                <span className="text-sm font-normal text-slate-700 dark:text-slate-200 truncate">
                  {projectFilter
                    ? projects.find((project) => project.id === projectFilter)?.code ||
                      projects.find((project) => project.id === projectFilter)?.name
                    : "Semua Proyek"}
                </span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${projectMenuOpen ? "rotate-180" : ""}`}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              {projectMenuOpen && (
                <div className="absolute z-50 right-0 mt-2 w-64 max-h-60 overflow-y-auto bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl shadow-lg flex flex-col p-1 animate-in fade-in zoom-in-95 duration-200">
                  <button
                    type="button"
                    onClick={() => {
                      handleFilterChange("project", "");
                      setProjectMenuOpen(false);
                    }}
                    className={`text-left px-3 py-2 text-sm rounded-md transition-colors ${projectFilter === "" ? "bg-slate-50 text-slate-900 font-medium dark:bg-slate-700 dark:text-white" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"}`}
                  >
                    Semua Proyek
                  </button>
                  {projects.map((project) => (
                    <button
                      key={project.id}
                      type="button"
                      onClick={() => {
                        handleFilterChange("project", project.id);
                        setProjectMenuOpen(false);
                      }}
                      className={`text-left px-3 py-2 text-sm rounded-md transition-colors ${projectFilter === project.id ? "bg-slate-50 text-slate-900 font-medium dark:bg-slate-700 dark:text-white" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"}`}
                    >
                      {project.code} - {project.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {(fromDate || toDate || projectFilter) && (
              <button
                type="button"
                onClick={resetFilters}
                className="w-full md:w-auto h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold text-slate-500 dark:text-slate-300 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border-[0.5px] border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
          {balances.length === 0 ? (
            <div className="py-28 px-6 text-center">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900/50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-10 h-10 opacity-40"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 13.125C3 12.504 3.504 12 4.125 12h15.75c.621 0 1.125.504 1.125 1.125v6.75C21 20.496 20.496 21 19.875 21H4.125A1.125 1.125 0 013 19.875v-6.75zM3 6.375C3 5.754 3.504 5.25 4.125 5.25h15.75c.621 0 1.125.504 1.125 1.125v2.25c0 .621-.504 1.125-1.125 1.125H4.125A1.125 1.125 0 013 8.625v-2.25z"
                  />
                </svg>
              </div>
              <p className="font-bold text-slate-900 dark:text-white">
                Belum ada data neraca saldo
              </p>
              <p className="text-sm text-slate-400 mt-1">
                Coba ubah filter atau pastikan jurnal sudah tercatat.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm text-left">
                <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700">
                  <tr>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
                      Kode
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
                      Nama Akun
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400 text-right">
                      Debit
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400 text-right">
                      Kredit
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {balances.map((item) => (
                    <tr
                      key={item.code}
                      className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-700/30"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center rounded-lg bg-slate-100 dark:bg-slate-900 px-2.5 py-1 text-[11px] font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {item.code}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-900 dark:text-white">
                        {item.name}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                        {item.finalDebit > 0 ? (
                          formatRupiah(item.finalDebit)
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                        {item.finalCredit > 0 ? (
                          formatRupiah(item.finalCredit)
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 dark:bg-slate-900 border-t-2 border-slate-200 dark:border-slate-700">
                  <tr>
                    <td
                      colSpan={2}
                      className="px-6 py-5 text-right text-xs font-black uppercase tracking-widest text-slate-500"
                    >
                      Total Akhir
                    </td>
                    <td
                      className={`px-6 py-5 text-right text-base font-black tabular-nums ${isBalanced ? "text-emerald-600" : "text-rose-600"}`}
                    >
                      {formatRupiah(totalDebit)}
                    </td>
                    <td
                      className={`px-6 py-5 text-right text-base font-black tabular-nums ${isBalanced ? "text-emerald-600" : "text-rose-600"}`}
                    >
                      {formatRupiah(totalCredit)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {!isBalanced && balances.length > 0 && (
          <div className="mt-4 p-5 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 rounded-2xl text-rose-700 dark:text-rose-400 text-sm font-bold flex flex-col no-print shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-5 h-5"
              >
                <path
                  fillRule="evenodd"
                  d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.515 2.625H3.72c-1.345 0-2.188-1.458-1.515-2.625L8.485 2.495zM10 5.75a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5.75zm0 8a1 1 0 100-2 1 1 0 000 2z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Peringatan: Neraca saldo tidak balance</span>
            </div>
            <span className="text-xs font-medium opacity-80">
              Selisih {formatRupiah(selisih)}. Periksa kembali jurnal umum pada periode ini.
            </span>
          </div>
        )}
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          @page { size: 210mm 330mm; margin: 10mm; }
          body * { visibility: hidden; }
          .printable-area, .printable-area * { visibility: visible; }
          .printable-area { position: absolute; left: 0; top: 0; width: 100%; border: none; box-shadow: none; background: white; padding: 0; }
          .no-print { display: none !important; }
        }
      `,
        }}
      />
    </div>
  );
}
