"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as xlsx from "xlsx";

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

const TYPE_MAP: Record<string, string> = {
  ASET: "Asset",
  KEWAJIBAN: "Liability",
  EKUITAS: "Equity",
  PENDAPATAN: "Revenue",
  BEBAN: "Expense",
};

const PROJECT_BADGE_STYLES = [
  "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/20 dark:text-orange-300 dark:border-orange-900/30",
  "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-300 dark:border-blue-900/30",
  "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-300 dark:border-emerald-900/30",
  "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/20 dark:text-purple-300 dark:border-purple-900/30",
  "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-300 dark:border-rose-900/30",
];

function formatRupiah(num: number) {
  return "Rp " + Math.abs(num).toLocaleString("id-ID");
}

function formatNominal(num: number) {
  return Math.abs(num).toLocaleString("id-ID");
}

function formatDate(dateStr: string) {
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

function todayFormatted() {
  return formatDateShort(new Date().toISOString());
}

function getProjectBadgeClass(projectId: string) {
  if (projectId === "no-project") {
    return "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
  }
  let hash = 0;
  for (const char of projectId) hash += char.charCodeAt(0);
  return PROJECT_BADGE_STYLES[hash % PROJECT_BADGE_STYLES.length];
}

/** Running balance colour per spec */
function balanceColor(balance: number) {
  if (balance > 0) return "text-[#16A34A] dark:text-green-400";
  if (balance < 0) return "text-[#DC2626] dark:text-red-400";
  return "text-[#6B7280] dark:text-gray-400";
}

// ─────────────────────────────────────────────────────────────────────────────
// PDF template builder
// ─────────────────────────────────────────────────────────────────────────────
function buildPdfHtml(params: {
  companyName: string;
  fromDate: string;
  toDate: string;
  selectedProjectName: string;
  ledgerAccounts: LedgerAccount[];
  totalDebit: number;
  totalCredit: number;
}) {
  const {
    companyName,
    fromDate,
    toDate,
    selectedProjectName,
    ledgerAccounts,
    totalDebit,
    totalCredit,
  } = params;

  const periodStr =
    fromDate && toDate
      ? `${formatDateShort(fromDate)} s/d ${formatDateShort(toDate)}`
      : fromDate
        ? `${formatDateShort(fromDate)} s/d sekarang`
        : toDate
          ? `s/d ${formatDateShort(toDate)}`
          : "Semua Periode";

  const proyekStr = selectedProjectName || "Semua Proyek";

  const accountSections = ledgerAccounts
    .map((account) => {
      const openingRow = `
      <tr style="font-style:italic;color:#6B7280;background:#F9FAFB;">
        <td style="padding:4px 6px;">-</td>
        <td style="padding:4px 6px;">-</td>
        <td style="padding:4px 6px;">Saldo Awal</td>
        <td style="padding:4px 6px;">-</td>
        <td style="padding:4px 6px;text-align:right;">-</td>
        <td style="padding:4px 6px;text-align:right;">-</td>
        <td style="padding:4px 6px;text-align:right;">${formatNominal(account.openingBalance)}</td>
      </tr>`;

      const entryRows = account.transactions
        .map((trx, idx) => {
          const bg = idx % 2 === 1 ? "background:#F9FAFB;" : "";
          const balColor =
            trx.balance > 0
              ? "#16A34A"
              : trx.balance < 0
                ? "#DC2626"
                : "#6B7280";
          return `
      <tr style="${bg}">
        <td style="padding:4px 6px;">${formatDateShort(trx.date)}</td>
        <td style="padding:4px 6px;">${trx.reference}</td>
        <td style="padding:4px 6px;">${trx.description || "-"}</td>
        <td style="padding:4px 6px;">${trx.projectName !== "Tidak ada proyek" ? trx.projectName : "-"}</td>
        <td style="padding:4px 6px;text-align:right;">${trx.debit > 0 ? formatNominal(trx.debit) : "-"}</td>
        <td style="padding:4px 6px;text-align:right;">${trx.credit > 0 ? formatNominal(trx.credit) : "-"}</td>
        <td style="padding:4px 6px;text-align:right;color:${balColor};font-weight:bold;">${formatNominal(trx.balance)}</td>
      </tr>`;
        })
        .join("");

      const totalRow = `
      <tr style="font-weight:bold;background:#F3F4F6;border-top:2px solid #D1D5DB;">
        <td colspan="4" style="padding:5px 6px;">TOTAL</td>
        <td style="padding:5px 6px;text-align:right;">${formatNominal(account.totalDebit)}</td>
        <td style="padding:5px 6px;text-align:right;">${formatNominal(account.totalCredit)}</td>
        <td style="padding:5px 6px;text-align:right;">${formatNominal(account.endingBalance)}</td>
      </tr>`;

      return `
      <div style="page-break-inside:avoid;margin-bottom:20px;">
        <div style="background:#FFF7ED;border-left:3px solid #F97316;padding:8px 12px;margin-bottom:0;">
          <span style="font-weight:bold;color:#EA6C00;">${account.code}</span>
          <span style="font-weight:500;color:#1F2937;"> – ${account.name}</span>
          <span style="font-size:10px;color:#6B7280;margin-left:8px;">(${TYPE_MAP[account.type] || account.type}) &nbsp;|&nbsp; ${account.transactionCount} transaksi &nbsp;|&nbsp; Saldo Akhir: ${formatRupiah(account.endingBalance)}</span>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:9px;">
          <thead>
            <tr style="background:#F3F4F6;font-weight:bold;color:#374151;border-bottom:1px solid #D1D5DB;">
              <th style="padding:5px 6px;text-align:left;width:80px;">Tanggal</th>
              <th style="padding:5px 6px;text-align:left;width:90px;">No. Referensi</th>
              <th style="padding:5px 6px;text-align:left;">Keterangan</th>
              <th style="padding:5px 6px;text-align:left;width:90px;">Proyek</th>
              <th style="padding:5px 6px;text-align:right;width:90px;">Debit (Rp)</th>
              <th style="padding:5px 6px;text-align:right;width:90px;">Kredit (Rp)</th>
              <th style="padding:5px 6px;text-align:right;width:90px;">Saldo (Rp)</th>
            </tr>
          </thead>
          <tbody>
            ${openingRow}
            ${entryRows}
            ${totalRow}
          </tbody>
        </table>
      </div>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8"/>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 10px; color: #111827; padding: 20px; }
  .pdf-header { text-align: center; margin-bottom: 16px; border-bottom: 2px solid #F97316; padding-bottom: 10px; }
  .pdf-header h1 { font-size: 14px; font-weight: bold; color: #111827; }
  .pdf-header h2 { font-size: 12px; font-weight: bold; color: #EA6C00; margin-top: 2px; }
  .pdf-header p { font-size: 10px; color: #4B5563; margin-top: 3px; }
  .pdf-footer { margin-top: 20px; padding-top: 10px; border-top: 1px solid #D1D5DB; font-size: 10px; color: #4B5563; }
  @media print { @page { size: A4 landscape; margin: 10mm; } }
</style>
</head>
<body>
  <div class="pdf-header">
    <h1>${companyName}</h1>
    <h2>BUKU BESAR</h2>
    <p>Periode: ${periodStr}</p>
    <p>Proyek: ${proyekStr}</p>
    <p>Dicetak: ${todayFormatted()}</p>
  </div>

  ${accountSections}

  <div class="pdf-footer">
    <strong>Total Debit Keseluruhan:</strong> ${formatRupiah(totalDebit)} &nbsp;&nbsp;
    <strong>Total Kredit Keseluruhan:</strong> ${formatRupiah(totalCredit)}
  </div>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
export default function BukuBesarClient({
  companyName,
  allAccounts,
  projects,
  ledgerAccounts,
  projectSummary,
  totalDebit,
  totalCredit,
  accountFilter,
  projectFilter,
  fromDate,
  toDate,
  selectedProjectName,
  periodLabel,
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
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        exportMenuRef.current &&
        !exportMenuRef.current.contains(event.target as Node)
      ) {
        setExportMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const handleFilterSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (selectedAccount) params.set("account", selectedAccount);
    else params.delete("account");
    if (selectedProject) params.set("project", selectedProject);
    else params.delete("project");
    if (selectedFromDate) params.set("from", selectedFromDate);
    else params.delete("from");
    if (selectedToDate) params.set("to", selectedToDate);
    else params.delete("to");
    router.replace(`${pathname}?${params.toString()}`);
  };

  const toggleAccount = (accountId: string) => {
    setCollapsedAccounts((prev) => ({
      ...prev,
      [accountId]: !prev[accountId],
    }));
  };

  const handleProjectSummaryClick = (projectId: string) => {
    setSelectedProject(projectId === "no-project" ? "" : projectId);
  };

  // ── Export Excel ──────────────────────────────────────────────────────────
  const handleExportExcel = () => {
    const workbook = xlsx.utils.book_new();
    ledgerAccounts.forEach((account) => {
      const rows = [
        {
          Tanggal: "-",
          Referensi: "-",
          Keterangan: "Saldo Awal",
          Proyek: "-",
          Debit: "",
          Kredit: "",
          Saldo: account.openingBalance,
        },
        ...account.transactions.map((trx) => ({
          Tanggal: formatDate(trx.date),
          Referensi: trx.reference,
          Keterangan: trx.description || "-",
          Proyek: trx.projectName,
          Debit: trx.debit || "",
          Kredit: trx.credit || "",
          Saldo: trx.balance,
        })),
        {
          Tanggal: "-",
          Referensi: "-",
          Keterangan: "TOTAL",
          Proyek: "-",
          Debit: account.totalDebit,
          Kredit: account.totalCredit,
          Saldo: account.endingBalance,
        },
      ];
      const worksheet = xlsx.utils.json_to_sheet(rows);
      const sheetName = `${account.code} ${account.name}`.slice(0, 31);
      xlsx.utils.book_append_sheet(workbook, worksheet, sheetName);
    });
    xlsx.writeFile(
      workbook,
      `Buku_Besar_${new Date().toISOString().split("T")[0]}.xlsx`,
    );
  };

  // ── Export PDF via print dialog on hidden iframe ──────────────────────────
  const handleExportPDF = async () => {
    const html = buildPdfHtml({
      companyName,
      fromDate,
      toDate,
      selectedProjectName,
      ledgerAccounts,
      totalDebit,
      totalCredit,
    });

    // Use jsPDF's html() method if available, otherwise open a print window
    const printWin = window.open("", "_blank", "width=1000,height=800");
    if (!printWin) {
      alert("Popup diblokir. Izinkan popup untuk mengekspor PDF.");
      return;
    }
    printWin.document.write(html);
    printWin.document.close();
    printWin.focus();
    setTimeout(() => {
      printWin.print();
    }, 600);
  };

  const handlePrint = () => window.print();

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="text-gray-600 dark:text-gray-300 w-full h-full printable-area">
      {/* ── Page title + actions ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 px-4 md:px-0">
        <div>
          <h1 className="page-title dark:text-gray-100">Buku Besar</h1>
          <p className="card-subtitle text-gray-400 dark:text-gray-400 mt-3">
            Posting otomatis dari jurnal umum dan transaksi proyek
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 no-print">
          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={() => setExportMenuOpen(!exportMenuOpen)}
              className="px-5 h-10 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-bold shadow-sm transition-all hover:bg-gray-50 flex items-center gap-2 active:scale-95"
            >
              Export
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className={`w-4 h-4 transition-transform duration-200 ${exportMenuOpen ? "rotate-180" : ""}`}
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {exportMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl z-50 p-1.5 space-y-0.5 animate-in fade-in zoom-in duration-150">
                <button
                  onClick={() => {
                    handleExportPDF();
                    setExportMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-red-600 transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-4 h-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m.75 12 3 3m0 0 3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
                    />
                  </svg>
                  Export PDF
                </button>
                <button
                  onClick={() => {
                    handleExportExcel();
                    setExportMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-emerald-600 transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-4 h-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125V5.625c0-.621.504-1.125 1.125-1.125h17.25c.621 0 1.125.504 1.125 1.125v12.75c0 .621-.504 1.125-1.125 1.125m-17.25 0V5.625m17.25 13.875V5.625M12 8.25v2.25m0 0 2.25 2.25M12 10.5l-2.25 2.25m0-4.5 4.5 4.5"
                    />
                  </svg>
                  Export Excel
                </button>
                <div className="border-t border-gray-100 dark:border-slate-700 my-1" />
                <button
                  onClick={() => {
                    handlePrint();
                    setExportMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-gray-200 transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-4 h-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6.72 13.89l-4.72-4.72M19.5 7.125l-3.375-3.375m0 0l-3.375 3.375m3.375-3.375V14.25m-15 0a3 3 0 013-3h1.5A1.125 1.125 0 016.375 12.375v1.5a3 3 0 01-3 3h-1.5a3 3 0 01-3-3v-1.5z"
                    />
                  </svg>
                  Cetak Halaman
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 md:px-0">
        {/* ── Filter form ── */}
        <div className="sticky -top-6 z-30 pt-8 pb-4 bg-white dark:bg-[#111827] -mx-6 px-6 no-print">
          <form
            onSubmit={handleFilterSubmit}
            className="bg-white dark:bg-slate-800 rounded-xl border border-[#E5E7EB] dark:border-slate-700 p-1.5 min-h-14 md:h-14 shadow-sm relative focus-within:ring-2 focus-within:ring-[#EA6C00]/10 focus-within:border-[#EA6C00] transition-all"
          >
            {hideNativeDateIcon}
            <div className="flex flex-col md:flex-row items-center">
              {/* Custom Account Dropdown */}
              <div className="flex-1 w-full relative" ref={accountRef}>
                <button
                  type="button"
                  onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                  className="w-full h-11 flex items-center justify-between px-5 bg-transparent rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-200 truncate">
                      {selectedAccount
                        ? allAccounts.find((a) => a.id === selectedAccount)
                            ?.name
                        : "Semua Akun"}
                    </span>
                  </div>
                  <svg
                    className={`w-4 h-4 text-gray-300 transition-transform ${accountMenuOpen ? "rotate-180" : ""}`}
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
                </button>

                {accountMenuOpen && (
                  <div className="absolute left-0 top-full mt-3 w-full max-h-60 overflow-y-auto custom-scrollbar bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl shadow-xl z-50 p-1.5 animate-in fade-in zoom-in-95 duration-200">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAccount("");
                        setAccountMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm font-semibold rounded-md transition-colors ${!selectedAccount ? "bg-[#EA6C00] text-white" : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700/50"}`}
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
                        className={`w-full text-left px-3 py-2 text-sm font-semibold rounded-md transition-colors ${selectedAccount === acc.id ? "bg-[#EA6C00] text-white" : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700/50"}`}
                      >
                        {acc.code} - {acc.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="hidden md:block w-px h-6 bg-gray-100 dark:bg-slate-700 mx-1" />

              {/* Custom Project Dropdown */}
              <div className="flex-1 w-full relative" ref={projectRef}>
                <button
                  type="button"
                  onClick={() => setProjectMenuOpen(!projectMenuOpen)}
                  className="w-full h-11 flex items-center justify-between px-5 bg-transparent rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-200 truncate">
                      {selectedProject
                        ? projects.find((p) => p.id === selectedProject)?.name
                        : "Semua Proyek"}
                    </span>
                  </div>
                  <svg
                    className={`w-4 h-4 text-gray-300 transition-transform ${projectMenuOpen ? "rotate-180" : ""}`}
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
                </button>

                {projectMenuOpen && (
                  <div className="absolute left-0 top-full mt-3 w-full max-h-60 overflow-y-auto custom-scrollbar bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl shadow-xl z-50 p-1.5 animate-in fade-in zoom-in-95 duration-200">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedProject("");
                        setProjectMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm font-semibold rounded-md transition-colors ${!selectedProject ? "bg-[#EA6C00] text-white" : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700/50"}`}
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
                        className={`w-full text-left px-3 py-2 text-sm font-semibold rounded-md transition-colors ${selectedProject === p.id ? "bg-[#EA6C00] text-white" : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700/50"}`}
                      >
                        {p.code} - {p.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="hidden md:block w-px h-6 bg-gray-100 dark:bg-slate-700 mx-1" />

              {/* Date Inputs */}
              <div className="flex-1 w-full relative group">
                <div className="relative">
                  {!selectedFromDate && !fromDateFocused && (
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-700 dark:text-gray-200 pointer-events-none">
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
                    className={`w-full h-11 pl-5 pr-12 border-0 bg-transparent text-sm font-bold focus:ring-0 cursor-pointer rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors ${selectedFromDate || fromDateFocused ? "text-gray-700 dark:text-gray-200" : "text-transparent"}`}
                  />
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
                    <img
                      src="/calendar_month.svg"
                      alt=""
                      className="w-5 h-5 opacity-40 group-hover:opacity-100 transition-opacity"
                    />
                  </div>
                </div>
              </div>

              <div className="hidden md:block w-px h-6 bg-gray-100 dark:bg-slate-700 mx-1" />

              <div className="flex-1 w-full relative group">
                <div className="relative">
                  {!selectedToDate && !toDateFocused && (
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-700 dark:text-gray-200 pointer-events-none">
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
                    className={`w-full h-11 pl-5 pr-12 border-0 bg-transparent text-sm font-bold focus:ring-0 cursor-pointer rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors ${selectedToDate || toDateFocused ? "text-gray-700 dark:text-gray-200" : "text-transparent"}`}
                  />
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
                    <img
                      src="/calendar_month.svg"
                      alt=""
                      className="w-5 h-5 opacity-40 group-hover:opacity-100 transition-opacity"
                    />
                  </div>
                </div>
              </div>

              {/* Search Button */}
              <div className="pl-2 pr-1">
                <button
                  type="submit"
                  className="w-9 h-9 bg-[#EA6C00] text-white rounded-full shadow-lg shadow-orange-500/20 flex items-center justify-center shrink-0 hover:bg-[#C25500] hover:scale-105 active:scale-95 transition-all"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={3}
                    stroke="currentColor"
                    className="w-4.5 h-4.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* ── Report area ── */}
        <div>
          {/* Summary header */}

          {/* Totals */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[10px] mb-6">
            <div className="bg-white dark:bg-slate-800 rounded-[14px] border border-[#E5E7EB] dark:border-slate-700/50 p-5 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#EA6C00] mb-2">
                Total Debit
              </p>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatRupiah(totalDebit)}
              </h2>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-[14px] border border-[#E5E7EB] dark:border-slate-700/50 p-5 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#EA6C00] mb-2">
                Total Kredit
              </p>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatRupiah(totalCredit)}
              </h2>
            </div>
          </div>

          {/* Project summary table */}

          {/* Ledger accounts */}
          {ledgerAccounts.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-[14px] border border-[#E5E7EB] dark:border-slate-700 p-16 text-center shadow-sm">
              <p className="text-sm font-bold text-gray-700 dark:text-gray-200">
                Belum ada data buku besar.
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Coba ubah filter atau pastikan transaksi dan jurnal sudah
                tercatat.
              </p>
            </div>
          ) : (
            <div className="space-y-3 pb-6">
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
                    className="bg-white dark:bg-slate-900 rounded-[16px] border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden no-print"
                  >
                    {/* ── Account header ── */}
                    <button
                      onClick={() => toggleAccount(account.id)}
                      className="w-full px-6 py-3.5 flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-50 dark:bg-slate-900 hover:bg-gray-100/80 transition-colors text-left"
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-3">
                          <span
                            className={`px-3 py-1 text-xs font-black rounded-full ${
                              account.code.startsWith("1")
                                ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                : account.code.startsWith("2")
                                  ? "bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400"
                                  : account.code.startsWith("3")
                                    ? "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400"
                                    : account.code.startsWith("4")
                                      ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                      : "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400"
                            }`}
                          >
                            {account.code}
                          </span>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            {account.name}
                            <svg
                              className={`w-4 h-4 text-gray-300 transition-transform ${isCollapsed ? "" : "rotate-180"}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="3"
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </h3>
                        </div>
                        <p className="text-[11px] text-gray-400 font-medium ml-1">
                          Total : {account.transactionCount} Transaksi
                        </p>
                      </div>
                      <div className="mt-4 md:mt-0 text-right">
                        <p className="text-[10px] font-black text-gray-900 dark:text-gray-100 uppercase tracking-widest mb-0.5">
                          Saldo Akhir
                        </p>
                        <p
                          className={`text-base font-black ${isAbnormal ? "text-red-600" : "text-emerald-600 dark:text-emerald-400"}`}
                        >
                          {formatRupiah(account.endingBalance)}
                        </p>
                      </div>
                    </button>

                    {/* ── Transactions table ── */}
                    {!isCollapsed && (
                      <div className="overflow-x-auto">
                        <table className="w-full" style={{ minWidth: 900 }}>
                          <colgroup>
                            {/* TANGGAL 112px */}
                            <col style={{ width: 112 }} />
                            {/* REFERENSI 128px */}
                            <col style={{ width: 128 }} />
                            {/* KETERANGAN 250px */}
                            <col style={{ width: 250 }} />
                            {/* PROYEK 200px */}
                            <col style={{ width: 200 }} />
                            {/* DEBIT 128px */}
                            <col style={{ width: 128 }} />
                            {/* KREDIT 128px */}
                            <col style={{ width: 128 }} />
                            {/* SALDO 144px */}
                            <col style={{ width: 144 }} />
                          </colgroup>
                          <thead className="bg-gray-50/50 dark:bg-slate-900/50 border-b border-gray-100 dark:border-slate-800">
                            <tr>
                              <th className="px-6 py-2.5 text-left text-[10px] font-bold text-gray-400 tracking-wide">
                                Tanggal
                              </th>
                              <th className="px-6 py-2.5 text-left text-[10px] font-bold text-gray-400 tracking-wide">
                                No Ref
                              </th>
                              <th className="px-6 py-2.5 text-left text-[10px] font-bold text-gray-400 tracking-wide">
                                Keterangan
                              </th>
                              <th className="px-6 py-2.5 text-left text-[10px] font-bold text-gray-400 tracking-wide">
                                Proyek
                              </th>
                              <th className="px-6 py-2.5 text-right text-[10px] font-bold text-gray-400 tracking-wide">
                                Debit (Rp)
                              </th>
                              <th className="px-6 py-2.5 text-right text-[10px] font-bold text-gray-400 tracking-wide">
                                Kredit (Rp)
                              </th>
                              <th className="px-6 py-2.5 text-right text-[10px] font-bold text-gray-400 tracking-wide">
                                Saldo (Rp)
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50/50 dark:divide-slate-800/30">
                            {/* Opening balance row */}
                            <tr className="bg-gray-50/10 dark:bg-slate-900/10">
                              <td className="px-6 py-2.5 text-[10px] font-black text-gray-900 dark:text-white uppercase">
                                -
                              </td>
                              <td className="px-6 py-2.5 text-[10px] text-gray-400">
                                -
                              </td>
                              <td className="px-6 py-2.5 text-[10px] font-medium text-gray-400 italic">
                                Saldo Awal
                              </td>
                              <td className="px-6 py-2.5 text-[10px] text-gray-400">
                                -
                              </td>
                              <td className="px-6 py-2.5 text-right text-[10px] text-gray-400">
                                -
                              </td>
                              <td className="px-6 py-2.5 text-right text-[10px] text-gray-400">
                                -
                              </td>
                              <td
                                className={`px-6 py-2.5 text-right text-[10px] font-black ${balanceColor(account.openingBalance)}`}
                              >
                                {formatNominal(account.openingBalance)}
                              </td>
                            </tr>

                            {/* Transaction rows */}
                            {account.transactions.map((trx) => (
                              <tr
                                key={trx.id}
                                className="hover:bg-gray-50/30 dark:hover:bg-slate-800/30 transition-colors"
                              >
                                <td className="px-6 py-2 whitespace-nowrap text-[10px] font-black text-gray-900 dark:text-white uppercase">
                                  {formatDate(trx.date)}
                                </td>
                                <td className="px-6 py-2 whitespace-nowrap text-[10px] font-medium text-gray-400 dark:text-gray-500">
                                  {trx.reference}
                                </td>
                                <td
                                  className="px-6 py-2 text-[10px] font-medium text-gray-400 dark:text-gray-500 truncate"
                                  style={{ maxWidth: 250 }}
                                >
                                  {trx.description || "-"}
                                </td>
                                <td className="px-6 py-2 whitespace-nowrap">
                                  <span
                                    className="inline-flex items-center px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-md whitespace-nowrap"
                                    title={trx.projectName}
                                  >
                                    {trx.projectName === "Tidak ada proyek"
                                      ? "-"
                                      : trx.projectName}
                                  </span>
                                </td>
                                <td className="px-6 py-2 whitespace-nowrap text-[10px] font-bold text-gray-900 dark:text-gray-100 text-right">
                                  {trx.debit > 0
                                    ? formatNominal(trx.debit)
                                    : "-"}
                                </td>
                                <td className="px-6 py-2 whitespace-nowrap text-[10px] font-bold text-gray-900 dark:text-gray-100 text-right">
                                  {trx.credit > 0
                                    ? formatNominal(trx.credit)
                                    : "-"}
                                </td>
                                <td
                                  className={`px-6 py-2 whitespace-nowrap text-[10px] font-bold text-right ${balanceColor(trx.balance)}`}
                                >
                                  {formatNominal(trx.balance)}
                                </td>
                              </tr>
                            ))}

                            {/* Total row */}
                            <tr className="bg-white dark:bg-slate-900/40">
                              <td
                                className="px-6 py-5 text-[11px] font-black text-gray-400 dark:text-white uppercase"
                                colSpan={4}
                              >
                                Total (Rp)
                              </td>
                              <td className="px-6 py-5 text-right text-[11px] font-black text-gray-900 dark:text-white">
                                {formatNominal(account.totalDebit)}
                              </td>
                              <td className="px-6 py-5 text-right text-[11px] font-black text-gray-900 dark:text-white">
                                {formatNominal(account.totalCredit)}
                              </td>
                              <td
                                className={`px-6 py-5 text-right text-[11px] font-black ${isAbnormal ? "text-red-600" : "text-gray-400"}`}
                              >
                                {isAbnormal
                                  ? formatNominal(account.endingBalance)
                                  : "-"}
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

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
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
