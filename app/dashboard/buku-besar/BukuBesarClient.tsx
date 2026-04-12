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

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
  return `${d.getDate().toString().padStart(2, "0")} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function formatDateShort(dateStr: string) {
  const d = new Date(dateStr);
  const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
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
  const { companyName, fromDate, toDate, selectedProjectName, ledgerAccounts, totalDebit, totalCredit } = params;

  const periodStr = fromDate && toDate
    ? `${formatDateShort(fromDate)} s/d ${formatDateShort(toDate)}`
    : fromDate
      ? `${formatDateShort(fromDate)} s/d sekarang`
      : toDate
        ? `s/d ${formatDateShort(toDate)}`
        : "Semua Periode";

  const proyekStr = selectedProjectName || "Semua Proyek";

  const accountSections = ledgerAccounts.map((account) => {
    const openingRow = `
      <tr style="font-style:italic;color:#6B7280;background:#F9FAFB;">
        <td style="padding:4px 6px;">-</td>
        <td style="padding:4px 6px;">-</td>
        <td style="padding:4px 6px;">Saldo Awal</td>
        <td style="padding:4px 6px;">-</td>
        <td style="padding:4px 6px;text-align:right;">-</td>
        <td style="padding:4px 6px;text-align:right;">-</td>
        <td style="padding:4px 6px;text-align:right;">${formatRupiah(account.openingBalance)}</td>
      </tr>`;

    const entryRows = account.transactions.map((trx, idx) => {
      const bg = idx % 2 === 1 ? "background:#F9FAFB;" : "";
      const balColor = trx.balance > 0 ? "#16A34A" : trx.balance < 0 ? "#DC2626" : "#6B7280";
      return `
      <tr style="${bg}">
        <td style="padding:4px 6px;">${formatDateShort(trx.date)}</td>
        <td style="padding:4px 6px;">${trx.reference}</td>
        <td style="padding:4px 6px;">${trx.description || "-"}</td>
        <td style="padding:4px 6px;">${trx.projectName !== "Tidak ada proyek" ? trx.projectName : "-"}</td>
        <td style="padding:4px 6px;text-align:right;">${trx.debit > 0 ? formatRupiah(trx.debit) : "-"}</td>
        <td style="padding:4px 6px;text-align:right;">${trx.credit > 0 ? formatRupiah(trx.credit) : "-"}</td>
        <td style="padding:4px 6px;text-align:right;color:${balColor};font-weight:bold;">${formatRupiah(trx.balance)}</td>
      </tr>`;
    }).join("");

    const totalRow = `
      <tr style="font-weight:bold;background:#F3F4F6;border-top:2px solid #D1D5DB;">
        <td colspan="4" style="padding:5px 6px;">TOTAL</td>
        <td style="padding:5px 6px;text-align:right;">${formatRupiah(account.totalDebit)}</td>
        <td style="padding:5px 6px;text-align:right;">${formatRupiah(account.totalCredit)}</td>
        <td style="padding:5px 6px;text-align:right;">${formatRupiah(account.endingBalance)}</td>
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
              <th style="padding:5px 6px;text-align:right;width:90px;">Debit</th>
              <th style="padding:5px 6px;text-align:right;width:90px;">Kredit</th>
              <th style="padding:5px 6px;text-align:right;width:90px;">Saldo</th>
            </tr>
          </thead>
          <tbody>
            ${openingRow}
            ${entryRows}
            ${totalRow}
          </tbody>
        </table>
      </div>`;
  }).join("");

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
  const firstRenderRef = useRef(true);

  const [selectedAccount, setSelectedAccount] = useState(accountFilter);
  const [selectedProject, setSelectedProject] = useState(projectFilter);
  const [selectedFromDate, setSelectedFromDate] = useState(fromDate);
  const [selectedToDate, setSelectedToDate] = useState(toDate);
  const [collapsedAccounts, setCollapsedAccounts] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (firstRenderRef.current) {
      firstRenderRef.current = false;
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    if (selectedAccount) params.set("account", selectedAccount); else params.delete("account");
    if (selectedProject) params.set("project", selectedProject); else params.delete("project");
    if (selectedFromDate) params.set("from", selectedFromDate); else params.delete("from");
    if (selectedToDate) params.set("to", selectedToDate); else params.delete("to");
    router.replace(`${pathname}?${params.toString()}`);
  }, [pathname, router, searchParams, selectedAccount, selectedProject, selectedFromDate, selectedToDate]);

  const handleFilterSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (selectedAccount) params.set("account", selectedAccount); else params.delete("account");
    if (selectedProject) params.set("project", selectedProject); else params.delete("project");
    if (selectedFromDate) params.set("from", selectedFromDate); else params.delete("from");
    if (selectedToDate) params.set("to", selectedToDate); else params.delete("to");
    router.replace(`${pathname}?${params.toString()}`);
  };

  const toggleAccount = (accountId: string) => {
    setCollapsedAccounts((prev) => ({ ...prev, [accountId]: !prev[accountId] }));
  };

  const handleProjectSummaryClick = (projectId: string) => {
    setSelectedProject(projectId === "no-project" ? "" : projectId);
  };

  // ── Export Excel ──────────────────────────────────────────────────────────
  const handleExportExcel = () => {
    const workbook = xlsx.utils.book_new();
    ledgerAccounts.forEach((account) => {
      const rows = [
        { Tanggal: "-", Referensi: "-", Keterangan: "Saldo Awal", Proyek: "-", Debit: "", Kredit: "", Saldo: account.openingBalance },
        ...account.transactions.map((trx) => ({
          Tanggal: formatDate(trx.date),
          Referensi: trx.reference,
          Keterangan: trx.description || "-",
          Proyek: trx.projectName,
          Debit: trx.debit || "",
          Kredit: trx.credit || "",
          Saldo: trx.balance,
        })),
        { Tanggal: "-", Referensi: "-", Keterangan: "TOTAL", Proyek: "-", Debit: account.totalDebit, Kredit: account.totalCredit, Saldo: account.endingBalance },
      ];
      const worksheet = xlsx.utils.json_to_sheet(rows);
      const sheetName = `${account.code} ${account.name}`.slice(0, 31);
      xlsx.utils.book_append_sheet(workbook, worksheet, sheetName);
    });
    xlsx.writeFile(workbook, `Buku_Besar_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  // ── Export PDF via print dialog on hidden iframe ──────────────────────────
  const handleExportPDF = async () => {
    const html = buildPdfHtml({ companyName, fromDate, toDate, selectedProjectName, ledgerAccounts, totalDebit, totalCredit });

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
    <div className="border-2 shadow-xl border-gray-200 dark:border-gray-800 rounded-2xl bg-gray-100 dark:bg-[#0f172a] text-gray-600 dark:text-gray-300 pt-4 md:p-5 md:pt-5 min-h-screen printable-area">
      {/* ── Page title + actions ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 lg:mb-3 px-4 md:px-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Buku Besar</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Posting otomatis dari jurnal umum dan transaksi proyek</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 no-print">
          <button onClick={handleExportPDF} className="px-4 h-11 bg-red-600 hover:bg-red-700 text-white rounded-[10px] text-sm font-bold shadow-lg shadow-red-500/10 transition-all">
            Export PDF
          </button>
          <button onClick={handleExportExcel} className="px-4 h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[10px] text-sm font-bold shadow-lg shadow-emerald-500/10 transition-all">
            Export Excel
          </button>
          <button onClick={handlePrint} className="px-4 h-11 bg-slate-800 hover:bg-slate-700 text-white rounded-[10px] text-sm font-bold shadow-lg shadow-black/10 transition-all">
            Cetak
          </button>
        </div>
      </div>

      <div className="px-4 md:px-0">
        {/* ── Filter form ── */}
        <form onSubmit={handleFilterSubmit} className="bg-white dark:bg-slate-800 rounded-[14px] border-[0.5px] border-[#E5E7EB] dark:border-slate-700/50 p-5 mb-6 shadow-sm no-print">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-[0.15em]">Akun</label>
              <select value={selectedAccount} onChange={(e) => setSelectedAccount(e.target.value)} className="w-full h-11 px-4 border border-[#E5E7EB] dark:border-slate-700 rounded-[10px] text-sm bg-white dark:bg-slate-900 font-semibold">
                <option value="">Semua Akun</option>
                {allAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-[0.15em]">Proyek</label>
              <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)} className="w-full h-11 px-4 border border-[#E5E7EB] dark:border-slate-700 rounded-[10px] text-sm bg-white dark:bg-slate-900 font-semibold">
                <option value="">Semua Proyek</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>{project.code} - {project.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-[0.15em]">Dari Tanggal</label>
              <input type="date" value={selectedFromDate} onChange={(e) => setSelectedFromDate(e.target.value)} className="w-full h-11 px-4 border border-[#E5E7EB] dark:border-slate-700 rounded-[10px] text-sm bg-white dark:bg-slate-900 font-semibold" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-[0.15em]">Sampai Tanggal</label>
              <input type="date" value={selectedToDate} onChange={(e) => setSelectedToDate(e.target.value)} className="w-full h-11 px-4 border border-[#E5E7EB] dark:border-slate-700 rounded-[10px] text-sm bg-white dark:bg-slate-900 font-semibold" />
            </div>
            <div className="flex items-end">
              <button type="submit" className="w-full px-8 h-11 bg-[#EA6C00] hover:bg-[#C25500] text-white text-sm font-bold rounded-[10px] transition-all shadow-lg shadow-orange-500/20">
                Filter
              </button>
            </div>
          </div>
        </form>

        {/* ── Report area ── */}
        <div>
          {/* Summary header */}
          <div className="bg-white dark:bg-slate-800 rounded-[14px] border border-[#E5E7EB] dark:border-slate-700/50 p-5 mb-6 shadow-sm">
            <h2 className="text-xl font-black text-gray-900 dark:text-white">
              Buku Besar{selectedProjectName ? ` — Proyek: ${selectedProjectName}` : ""}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Periode: {periodLabel}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{companyName}</p>
          </div>

          {/* Totals */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white dark:bg-slate-800 rounded-[14px] border border-[#E5E7EB] dark:border-slate-700/50 p-5 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#EA6C00] mb-2">Total Debit</p>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{formatRupiah(totalDebit)}</h2>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-[14px] border border-[#E5E7EB] dark:border-slate-700/50 p-5 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#EA6C00] mb-2">Total Kredit</p>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{formatRupiah(totalCredit)}</h2>
            </div>
          </div>

          {/* Project summary table */}
          {!projectFilter && projectSummary.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-[14px] border border-[#E5E7EB] dark:border-slate-700/50 shadow-sm overflow-hidden mb-6">
              <div className="px-6 py-5 border-b border-[#F1F5F9] dark:border-slate-700 bg-[#F9FAFB]/50 dark:bg-slate-700/20">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">Ringkasan per Proyek</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px]">
                  <thead className="bg-[#F9FAFB] dark:bg-slate-700/40 border-b border-[#F1F5F9] dark:border-slate-700">
                    <tr>
                      <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em]">Proyek</th>
                      <th className="px-6 py-4 text-right text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em]">Total Debit</th>
                      <th className="px-6 py-4 text-right text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em]">Total Kredit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F8FAFC] dark:divide-slate-700/50">
                    {projectSummary.map((item) => (
                      <tr key={item.projectId} className="hover:bg-[#FFF0E6]/30 dark:hover:bg-orange-500/5 transition-colors">
                        <td className="px-6 py-4">
                          <button onClick={() => handleProjectSummaryClick(item.projectId)} className="text-sm font-bold text-[#EA6C00] hover:underline text-left">
                            {item.projectName}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-bold text-gray-900 dark:text-white">{formatRupiah(item.totalDebit)}</td>
                        <td className="px-6 py-4 text-right text-sm font-bold text-gray-900 dark:text-white">{formatRupiah(item.totalCredit)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-[#F9FAFB] dark:bg-slate-900/80 border-t border-[#F1F5F9] dark:border-slate-700">
                    <tr>
                      <td className="px-6 py-4 text-sm font-black text-gray-900 dark:text-white">TOTAL</td>
                      <td className="px-6 py-4 text-right text-sm font-black text-gray-900 dark:text-white">{formatRupiah(totalDebit)}</td>
                      <td className="px-6 py-4 text-right text-sm font-black text-gray-900 dark:text-white">{formatRupiah(totalCredit)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Ledger accounts */}
          {ledgerAccounts.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-[14px] border border-[#E5E7EB] dark:border-slate-700 p-16 text-center shadow-sm">
              <p className="text-sm font-bold text-gray-700 dark:text-gray-200">Belum ada data buku besar.</p>
              <p className="text-xs text-gray-400 mt-1">Coba ubah filter atau pastikan transaksi dan jurnal sudah tercatat.</p>
            </div>
          ) : (
            <div className="space-y-8 pb-10">
              {ledgerAccounts.map((account) => {
                const isCollapsed = collapsedAccounts[account.id] || false;
                const isAbnormal =
                  (account.normalBalance === "DEBIT" && account.endingBalance < 0) ||
                  (account.normalBalance === "KREDIT" && account.endingBalance < 0);

                return (
                  <div key={account.id} className="bg-white dark:bg-slate-800 rounded-[14px] border border-[#E5E7EB] dark:border-slate-700/50 shadow-sm overflow-hidden">
                    {/* ── Account header ── */}
                    <button
                      onClick={() => toggleAccount(account.id)}
                      className="w-full flex flex-col md:flex-row justify-between items-start md:items-center text-left"
                      style={{ background: "#FFF7ED", borderLeft: "3px solid #F97316", padding: "14px 20px" }}
                    >
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 text-[#EA6C00] text-lg font-black">{isCollapsed ? "▼" : "▲"}</span>
                        <div className="flex flex-col gap-0.5">
                          <h3 className="text-[15px] font-bold text-gray-800 dark:text-slate-100">
                            <span className="font-bold text-[#EA6C00]">{account.code}</span>
                            <span className="font-medium text-gray-800 dark:text-gray-200"> — {account.name}</span>
                          </h3>
                          <span className="text-[12px] text-gray-500">
                            {TYPE_MAP[account.type] || account.type} &nbsp;·&nbsp; {account.transactionCount} transaksi &nbsp;·&nbsp; Saldo Akhir: {formatRupiah(account.endingBalance)}
                          </span>
                        </div>
                      </div>
                      <div className="mt-4 md:mt-0 flex flex-col md:items-end">
                        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-1">Saldo Akhir</span>
                        <span className={`text-lg font-bold ${isAbnormal ? "text-[#DC2626]" : balanceColor(account.endingBalance)}`}>
                          {formatRupiah(account.endingBalance)}
                        </span>
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
                            {/* KETERANGAN flex */}
                            <col />
                            {/* PROYEK 144px */}
                            <col style={{ width: 144 }} />
                            {/* DEBIT 128px */}
                            <col style={{ width: 128 }} />
                            {/* KREDIT 128px */}
                            <col style={{ width: 128 }} />
                            {/* SALDO 144px */}
                            <col style={{ width: 144 }} />
                          </colgroup>
                          <thead className="bg-[#F9FAFB] dark:bg-slate-700/40 border-b border-[#F1F5F9] dark:border-slate-700">
                            <tr>
                              <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em]">Tanggal</th>
                              <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em]">Referensi</th>
                              <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em]">Keterangan</th>
                              <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em]">Proyek</th>
                              <th className="px-4 py-3 text-right text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em]">Debit</th>
                              <th className="px-4 py-3 text-right text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em]">Kredit</th>
                              <th className="px-4 py-3 text-right text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em]">Saldo</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#F8FAFC] dark:divide-slate-700/50">
                            {/* Opening balance row */}
                            <tr className="bg-gray-50 dark:bg-slate-900/30">
                              <td className="px-4 py-3 text-xs italic text-gray-400">-</td>
                              <td className="px-4 py-3 text-xs italic text-gray-400">-</td>
                              <td className="px-4 py-3 text-xs italic text-gray-400">Saldo Awal</td>
                              <td className="px-4 py-3 text-xs italic text-gray-400">-</td>
                              <td className="px-4 py-3 text-right text-xs italic text-gray-400">-</td>
                              <td className="px-4 py-3 text-right text-xs italic text-gray-400">-</td>
                              <td className={`px-4 py-3 text-right text-xs italic font-semibold ${balanceColor(account.openingBalance)}`}>
                                {formatRupiah(account.openingBalance)}
                              </td>
                            </tr>

                            {/* Transaction rows */}
                            {account.transactions.map((trx) => (
                              <tr key={trx.id} className="hover:bg-[#FFF0E6]/30 dark:hover:bg-orange-500/5 transition-colors">
                                <td className="px-4 py-3 whitespace-nowrap text-xs font-medium text-gray-500 dark:text-gray-400">
                                  {formatDate(trx.date)}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-xs font-bold text-gray-900 dark:text-gray-200">
                                  {trx.reference}
                                </td>
                                <td className="px-4 py-3 text-xs font-semibold text-gray-700 dark:text-gray-300">
                                  {trx.description || "-"}
                                </td>
                                <td className="px-4 py-3">
                                  {/* Badge with max-width + truncate + tooltip */}
                                  <span
                                    className={`inline-flex items-center border rounded-full font-bold ${getProjectBadgeClass(trx.projectId)}`}
                                    style={{ fontSize: 11, padding: "2px 8px", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "inline-block" }}
                                    title={trx.projectName}
                                  >
                                    {trx.projectName}
                                  </span>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-gray-100 text-right">
                                  {trx.debit > 0 ? formatRupiah(trx.debit) : "-"}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-gray-100 text-right">
                                  {trx.credit > 0 ? formatRupiah(trx.credit) : "-"}
                                </td>
                                <td className={`px-4 py-3 whitespace-nowrap text-sm font-bold text-right ${balanceColor(trx.balance)}`}>
                                  {formatRupiah(trx.balance)}
                                </td>
                              </tr>
                            ))}

                            {/* Total row */}
                            <tr className="bg-gray-100 dark:bg-slate-900/60 border-t-2 border-gray-300 dark:border-slate-600">
                              <td className="px-4 py-3 text-xs font-black text-gray-900 dark:text-white" colSpan={4}>TOTAL</td>
                              <td className="px-4 py-3 text-right text-sm font-black text-gray-900 dark:text-white">{formatRupiah(account.totalDebit)}</td>
                              <td className="px-4 py-3 text-right text-sm font-black text-gray-900 dark:text-white">{formatRupiah(account.totalCredit)}</td>
                              <td className={`px-4 py-3 text-right text-sm font-black ${isAbnormal ? "text-[#DC2626]" : balanceColor(account.endingBalance)}`}>
                                {formatRupiah(account.endingBalance)}
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

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * { visibility: hidden; }
          .printable-area, .printable-area * { visibility: visible; }
          .printable-area { position: absolute; left: 0; top: 0; width: 100%; border: none; box-shadow: none; background: white; padding: 0; }
          .no-print { display: none !important; }
        }
      ` }} />
    </div>
  );
}
