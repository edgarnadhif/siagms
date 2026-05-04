"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface AccountOption {
  id: string;
  code: string;
  name: string;
  type: string;
  normalBalance: string;
}

interface ProjectOption {
  id: string;
  code: string;
  name: string;
}

interface LedgerTransaction {
  id: string;
  date: string;
  reference: string;
  description: string | null;
  projectId: string;
  projectCode: string;
  projectName: string;
  projectLabel: string;
  debit: number;
  credit: number;
  balance: number;
}

interface LedgerAccount {
  id: string;
  code: string;
  name: string;
  type: string;
  normalBalance: string;
  openingBalance: number;
  totalDebit: number;
  totalCredit: number;
  endingBalance: number;
  transactionCount: number;
  transactions: LedgerTransaction[];
}

interface ProjectSummaryItem {
  projectId: string;
  projectCode: string;
  projectName: string;
  totalDebit: number;
  totalCredit: number;
}

function formatRupiah(num: number) {
  return "Rp " + Math.abs(num).toLocaleString("id-ID");
}

function formatNominal(num: number) {
  return Math.abs(num).toLocaleString("id-ID");
}

function formatDateShort(dateStr: string) {
  const d = new Date(dateStr);
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "Mei",
    "Jun",
    "Jul",
    "Ags",
    "Sep",
    "Okt",
    "Nov",
    "Des",
  ];
  return `${d.getDate().toString().padStart(2, "0")} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
export default function BukuBesarClient({
  companyName,
  allAccounts,
  projects,
  ledgerAccounts,
  totalDebit,
  totalCredit,
  accountFilter,
  projectFilter,
  fromDate,
  toDate,
}: {
  companyName: string;
  allAccounts: AccountOption[];
  projects: ProjectOption[];
  ledgerAccounts: LedgerAccount[];
  projectSummary: ProjectSummaryItem[];
  totalDebit: number;
  totalCredit: number;
  accountFilter: string;
  projectFilter: string;
  fromDate: string;
  toDate: string;
  selectedProjectName: string;
  periodLabel: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [selectedAccount, setSelectedAccount] = useState(accountFilter);
  const [selectedProject, setSelectedProject] = useState(projectFilter);
  const [selectedFromDate, setSelectedFromDate] = useState(fromDate);
  const [selectedToDate, setSelectedToDate] = useState(toDate);
  const [fromDateFocused, setFromDateFocused] = useState(false);
  const [toDateFocused, setToDateFocused] = useState(false);
  const [collapsedAccounts, setCollapsedAccounts] = useState<
    Record<string, boolean>
  >({});

  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  const projectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        accountRef.current &&
        !accountRef.current.contains(event.target as Node)
      )
        setAccountMenuOpen(false);
      if (
        projectRef.current &&
        !projectRef.current.contains(event.target as Node)
      )
        setProjectMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const currAcc = params.get("account") || "";
    const currProj = params.get("project") || "";
    const currFrom = params.get("from") || "";
    const currTo = params.get("to") || "";

    if (
      selectedAccount !== currAcc ||
      selectedProject !== currProj ||
      selectedFromDate !== currFrom ||
      selectedToDate !== currTo
    ) {
      if (selectedAccount) params.set("account", selectedAccount);
      else params.delete("account");
      if (selectedProject) params.set("project", selectedProject);
      else params.delete("project");
      if (selectedFromDate) params.set("from", selectedFromDate);
      else params.delete("from");
      if (selectedToDate) params.set("to", selectedToDate);
      else params.delete("to");
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [
    selectedAccount,
    selectedProject,
    selectedFromDate,
    selectedToDate,
    pathname,
    router,
    searchParams,
  ]);

  const hideNativeDateIcon = (
    <style>{`
      input[type="date"]::-webkit-calendar-picker-indicator {
        display: none;
        -webkit-appearance: none;
      }
    `}</style>
  );

  const toggleAccount = (accountId: string) => {
    setCollapsedAccounts((prev) => ({
      ...prev,
      [accountId]: !prev[accountId],
    }));
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="text-slate-600 dark:text-slate-300 w-full h-full printable-area">
      {/* ── Page title + actions ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 px-4 md:px-0">
        <div>
          <h1 className="page-title dark:text-white">Buku Besar</h1>
          <p className="card-subtitle text-slate-400 dark:text-slate-400 mt-2">
            Posting otomatis dari jurnal umum dan transaksi proyek
          </p>
        </div>
      </div>

      <div className="px-4 md:px-0">
        {/* Totals Cards - Compact style */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5 transition-all hover:shadow-md">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-orange-600 mb-2">
              Total Debit
            </p>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white tabular-nums tracking-tight">
              {formatRupiah(totalDebit)}
            </h2>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5 transition-all hover:shadow-md">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-orange-600 mb-2">
              Total Kredit
            </p>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white tabular-nums tracking-tight">
              {formatRupiah(totalCredit)}
            </h2>
          </div>
        </div>

        {/* Filter Toolbar - Modernized Transaksi style */}
        <div className="sticky -top-6 z-30 pt-2 pb-3 bg-white dark:bg-[#111827] -mx-6 px-6 no-print mb-3">
          <div className="flex flex-col md:flex-row flex-wrap items-center gap-3 w-full">
            {hideNativeDateIcon}

            {/* Account Dropdown */}
            <div className="flex-1 min-w-[200px] relative" ref={accountRef}>
              <button
                type="button"
                onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                className="w-full h-11 inline-flex items-center justify-between px-3 bg-white dark:bg-slate-800 border-[0.5px] border-slate-200 dark:border-slate-700 rounded-xl transition-all hover:border-slate-400 focus:ring-2 focus:ring-slate-100 dark:focus:ring-slate-800"
              >
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                  {selectedAccount
                    ? allAccounts.find((a) => a.id === selectedAccount)?.name
                    : "Semua Akun"}
                </span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${accountMenuOpen ? "rotate-180" : ""}`}
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

              {accountMenuOpen && (
                <div className="absolute left-0 mt-2 w-full max-h-64 overflow-y-auto custom-scrollbar bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl shadow-xl z-50 p-1.5 animate-in fade-in zoom-in-95 duration-200">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAccount("");
                      setAccountMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 text-sm rounded-lg transition-colors ${!selectedAccount ? "bg-slate-50 text-slate-900 font-bold dark:bg-slate-700 dark:text-white" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"}`}
                  >
                    Semua Akun
                  </button>
                  {allAccounts.map((acc) => (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => {
                        setSelectedAccount(acc.id);
                        setAccountMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2.5 text-sm rounded-lg transition-colors ${selectedAccount === acc.id ? "bg-slate-50 text-slate-900 font-bold dark:bg-slate-700 dark:text-white" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"}`}
                    >
                      <span className="font-bold mr-2 text-slate-900 dark:text-white">
                        {acc.code}
                      </span>
                      {acc.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Project Dropdown */}
            <div className="flex-1 min-w-[200px] relative" ref={projectRef}>
              <button
                type="button"
                onClick={() => setProjectMenuOpen(!projectMenuOpen)}
                className="w-full h-11 inline-flex items-center justify-between px-3 bg-white dark:bg-slate-800 border-[0.5px] border-slate-200 dark:border-slate-700 rounded-xl transition-all hover:border-slate-400 focus:ring-2 focus:ring-slate-100 dark:focus:ring-slate-800"
              >
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                  {selectedProject
                    ? projects.find((p) => p.id === selectedProject)?.name
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
                <div className="absolute left-0 mt-2 w-full max-h-64 overflow-y-auto custom-scrollbar bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl shadow-xl z-50 p-1.5 animate-in fade-in zoom-in-95 duration-200">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProject("");
                      setProjectMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 text-sm rounded-lg transition-colors ${!selectedProject ? "bg-slate-50 text-slate-900 font-bold dark:bg-slate-700 dark:text-white" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"}`}
                  >
                    Semua Proyek
                  </button>
                  {projects.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setSelectedProject(p.id);
                        setProjectMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2.5 text-sm rounded-lg transition-colors ${selectedProject === p.id ? "bg-slate-50 text-slate-900 font-bold dark:bg-slate-700 dark:text-white" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"}`}
                    >
                      {p.code} — {p.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Start Date */}
            <div className="w-full md:w-[150px] lg:w-[160px] relative">
              <div className="h-11 inline-flex w-full items-center justify-between rounded-xl border-[0.5px] border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 transition-all hover:border-slate-400 relative focus-within:ring-2 focus-within:ring-slate-100 dark:focus-within:ring-slate-800">
                {!selectedFromDate && !fromDateFocused && (
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 pointer-events-none font-medium">
                    Dari Tanggal
                  </span>
                )}
                <input
                  type="date"
                  value={selectedFromDate}
                  onChange={(e) => setSelectedFromDate(e.target.value)}
                  onFocus={() => setFromDateFocused(true)}
                  onBlur={() => setFromDateFocused(false)}
                  onClick={(e) => e.currentTarget.showPicker()}
                  className={`w-full h-11 pl-3 pr-8 border-0 bg-transparent text-sm font-bold focus:ring-0 focus:outline-none outline-none cursor-pointer rounded-xl ${selectedFromDate || fromDateFocused ? "text-slate-700 dark:text-slate-200" : "text-transparent"}`}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-4 h-4 text-slate-400"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* End Date */}
            <div className="w-full md:w-[150px] lg:w-[160px] relative">
              <div className="h-11 inline-flex w-full items-center justify-between rounded-xl border-[0.5px] border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 transition-all hover:border-slate-400 relative focus-within:ring-2 focus-within:ring-slate-100 dark:focus-within:ring-slate-800">
                {!selectedToDate && !toDateFocused && (
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 pointer-events-none font-medium">
                    Sampai Tanggal
                  </span>
                )}
                <input
                  type="date"
                  value={selectedToDate}
                  onChange={(e) => setSelectedToDate(e.target.value)}
                  onFocus={() => setToDateFocused(true)}
                  onBlur={() => setToDateFocused(false)}
                  onClick={(e) => e.currentTarget.showPicker()}
                  className={`w-full h-11 pl-3 pr-8 border-0 bg-transparent text-sm font-bold focus:ring-0 focus:outline-none outline-none cursor-pointer rounded-xl ${selectedToDate || toDateFocused ? "text-slate-700 dark:text-slate-200" : "text-transparent"}`}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-4 h-4 text-slate-400"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Report area ── */}
        <div className="">
          {ledgerAccounts.length === 0 ? (
            <div className="py-40 px-16 text-center bg-white dark:bg-slate-800 border-[0.5px] border-[#E5E7EB] dark:border-slate-700 rounded-2xl shadow-sm">
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
                    d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
                  />
                </svg>
              </div>
              <p className="font-bold text-slate-900 dark:text-white">
                Belum ada data buku besar
              </p>
              <p className="text-sm text-slate-400 mt-1 italic">
                Coba ubah filter atau pastikan transaksi dan jurnal sudah
                tercatat.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 pb-10">
              {ledgerAccounts.map((account) => {
                const isCollapsed = collapsedAccounts[account.id] || false;
                const isAbnormal =
                  (account.normalBalance === "DEBIT" &&
                    account.endingBalance < 0) ||
                  (account.normalBalance === "KREDIT" &&
                    account.endingBalance < 0);

                return (
                  <div
                    key={account.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden no-print"
                  >
                    {/* Account Header - Refined kiri/kanan */}
                    <button
                      onClick={() => toggleAccount(account.id)}
                      className="w-full px-6 py-5 flex flex-row justify-between items-center bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all text-left"
                    >
                      <div className="flex items-center gap-5">
                        <div className="flex items-center gap-4">
                          <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 shadow-sm uppercase tracking-wider">
                            {account.code}
                          </span>
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-3">
                            {account.name}
                            <svg
                              className={`w-4.5 h-4.5 text-slate-300 transition-transform duration-300 ${isCollapsed ? "" : "rotate-180"}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2.5"
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </h3>
                        </div>
                        <div className="hidden md:block w-1 h-1 bg-slate-300 dark:bg-slate-600 rounded-full" />
                        <p className="text-[13px] text-slate-400 font-medium">
                          {account.transactionCount} Transaksi
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.1em] mb-1">
                          Saldo Akhir
                        </p>
                        <p
                          className={`text-2xl font-bold tabular-nums tracking-tight ${isAbnormal ? "text-rose-600" : "text-slate-900 dark:text-white"}`}
                        >
                          {formatRupiah(account.endingBalance)}
                        </p>
                      </div>
                    </button>

                    {/* Transactions Table - Accounting style */}
                    {!isCollapsed && (
                      <div className="overflow-x-auto scrollbar-hide">
                        <table className="w-full" style={{ minWidth: 900 }}>
                          <thead className="bg-white dark:bg-slate-900 border-y border-slate-100 dark:border-slate-800">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">
                                Tanggal
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">
                                No Ref
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">
                                Keterangan
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">
                                Proyek
                              </th>
                              <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">
                                Debit (Rp)
                              </th>
                              <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">
                                Kredit (Rp)
                              </th>
                              <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">
                                Saldo (Rp)
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                            {/* Opening Balance */}
                            <tr className="bg-slate-50/20 dark:bg-slate-800/10 italic">
                              <td className="px-6 py-3 text-sm text-slate-400">
                                —
                              </td>
                              <td className="px-6 py-3 text-sm text-slate-400">
                                —
                              </td>
                              <td className="px-6 py-3 text-sm font-semibold text-slate-500 dark:text-slate-400">
                                Saldo Awal
                              </td>
                              <td className="px-6 py-3 text-sm text-slate-400">
                                —
                              </td>
                              <td className="px-6 py-3 text-right text-sm text-slate-400">
                                —
                              </td>
                              <td className="px-6 py-3 text-right text-sm text-slate-400">
                                —
                              </td>
                              <td className="px-6 py-3 text-right text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                                {formatNominal(account.openingBalance)}
                              </td>
                            </tr>
                            {/* Entries */}
                            {account.transactions.map((trx) => (
                              <tr
                                key={trx.id}
                                className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                              >
                                <td className="px-6 py-4 text-sm font-semibold text-slate-900 dark:text-white">
                                  {formatDateShort(trx.date)}
                                </td>
                                <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white">
                                  {trx.reference}
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                                  {trx.description || "—"}
                                </td>
                                <td className="px-6 py-4">
                                  {trx.projectName !== "Tidak ada proyek" ? (
                                    <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md border border-slate-100 dark:border-slate-700">
                                      {trx.projectName}
                                    </span>
                                  ) : (
                                    <span className="text-slate-300">—</span>
                                  )}
                                </td>
                                <td className="px-6 py-4 text-right text-sm font-semibold text-slate-900 dark:text-white tabular-nums">
                                  {trx.debit > 0 ? (
                                    formatNominal(trx.debit)
                                  ) : (
                                    <span className="text-slate-400">—</span>
                                  )}
                                </td>
                                <td className="px-6 py-4 text-right text-sm font-semibold text-slate-900 dark:text-white tabular-nums">
                                  {trx.credit > 0 ? (
                                    formatNominal(trx.credit)
                                  ) : (
                                    <span className="text-slate-400">—</span>
                                  )}
                                </td>
                                <td
                                  className={`px-6 py-4 text-right text-sm font-bold tabular-nums ${trx.balance < 0 ? "text-rose-600" : "text-slate-900 dark:text-white"}`}
                                >
                                  {formatNominal(trx.balance)}
                                </td>
                              </tr>
                            ))}
                            {/* Summary row */}
                            <tr className="bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                              <td
                                colSpan={4}
                                className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest"
                              >
                                Total Per Akun
                              </td>
                              <td className="px-6 py-4 text-right text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                                {formatNominal(account.totalDebit)}
                              </td>
                              <td className="px-6 py-4 text-right text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                                {formatNominal(account.totalCredit)}
                              </td>
                              <td className="px-6 py-4 text-right text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                                {formatNominal(account.endingBalance)}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
