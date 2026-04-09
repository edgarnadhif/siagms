"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as xlsx from "xlsx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

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
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${d.getDate().toString().padStart(2, "0")} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function getProjectBadgeClass(projectId: string) {
  if (projectId === "no-project") {
    return "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
  }

  let hash = 0;
  for (const char of projectId) hash += char.charCodeAt(0);
  return PROJECT_BADGE_STYLES[hash % PROJECT_BADGE_STYLES.length];
}

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
  const reportRef = useRef<HTMLDivElement>(null);
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
    if (selectedAccount) params.set("account", selectedAccount);
    else params.delete("account");

    if (selectedProject) params.set("project", selectedProject);
    else params.delete("project");

    if (selectedFromDate) params.set("from", selectedFromDate);
    else params.delete("from");

    if (selectedToDate) params.set("to", selectedToDate);
    else params.delete("to");

    router.replace(`${pathname}?${params.toString()}`);
  }, [pathname, router, searchParams, selectedAccount, selectedProject, selectedFromDate, selectedToDate]);

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

    xlsx.writeFile(workbook, `Buku_Besar_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    const canvas = await html2canvas(reportRef.current, { scale: 2, backgroundColor: "#ffffff" });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Buku_Besar_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="border-2 shadow-xl border-gray-200 dark:border-gray-800 rounded-2xl bg-gray-100 dark:bg-[#0f172a] text-gray-600 dark:text-gray-300 pt-4 md:p-5 md:pt-5 min-h-screen printable-area">
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

        <div ref={reportRef}>
          <div className="bg-white dark:bg-slate-800 rounded-[14px] border border-[#E5E7EB] dark:border-slate-700/50 p-5 mb-6 shadow-sm">
            <h2 className="text-xl font-black text-gray-900 dark:text-white">
              Buku Besar{selectedProjectName ? ` — Proyek: ${selectedProjectName}` : ""}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Periode: {periodLabel}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{companyName}</p>
          </div>

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

          {ledgerAccounts.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-[14px] border border-[#E5E7EB] dark:border-slate-700 p-16 text-center shadow-sm">
              <p className="text-sm font-bold text-gray-700 dark:text-gray-200">Belum ada data buku besar.</p>
              <p className="text-xs text-gray-400 mt-1">Coba ubah filter atau pastikan transaksi dan jurnal sudah tercatat.</p>
            </div>
          ) : (
            <div className="space-y-8 pb-10">
              {ledgerAccounts.map((account) => {
                const isCollapsed = collapsedAccounts[account.id] || false;
                const isNormalBalance = account.endingBalance >= 0;
                const saldoClass = isNormalBalance ? "text-emerald-600 dark:text-emerald-400" : "text-red-500";
                const isAbnormal =
                  (account.normalBalance === "DEBIT" && account.endingBalance < 0) ||
                  (account.normalBalance === "KREDIT" && account.endingBalance < 0);

                return (
                  <div key={account.id} className="bg-white dark:bg-slate-800 rounded-[14px] border border-[#E5E7EB] dark:border-slate-700/50 shadow-sm overflow-hidden">
                    <button onClick={() => toggleAccount(account.id)} className="w-full px-6 py-5 flex flex-col md:flex-row justify-between items-start md:items-center bg-[#F9FAFB]/50 dark:bg-slate-700/20 border-b border-[#F1F5F9] dark:border-slate-700 text-left">
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 text-[#EA6C00] text-lg font-black">{isCollapsed ? "▼" : "▲"}</span>
                        <div className="flex flex-col gap-1">
                          <h3 className="text-[16px] font-bold text-gray-900 dark:text-slate-100">
                            <span className="text-[#EA6C00]">{account.code}</span> {account.name}
                          </h3>
                          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            {TYPE_MAP[account.type] || account.type} — {account.transactionCount} transaksi — Saldo Akhir: {formatRupiah(account.endingBalance)}
                          </span>
                        </div>
                      </div>
                      <div className="mt-4 md:mt-0 flex flex-col md:items-end">
                        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-1">Saldo Akhir</span>
                        <span className={`text-lg font-bold ${isAbnormal ? "text-red-500" : saldoClass}`}>{formatRupiah(account.endingBalance)}</span>
                      </div>
                    </button>

                    {!isCollapsed && (
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[1100px]">
                          <thead className="bg-[#F9FAFB] dark:bg-slate-700/40 border-b border-[#F1F5F9] dark:border-slate-700">
                            <tr>
                              <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] w-[130px]">Tanggal</th>
                              <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] w-[150px]">Referensi</th>
                              <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em]">Keterangan</th>
                              <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] w-[180px]">Proyek</th>
                              <th className="px-6 py-4 text-right text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] w-[160px]">Debit</th>
                              <th className="px-6 py-4 text-right text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] w-[160px]">Kredit</th>
                              <th className="px-6 py-4 text-right text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] w-[160px]">Saldo</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#F8FAFC] dark:divide-slate-700/50">
                            <tr className="bg-[#FFF8F2] dark:bg-orange-950/10">
                              <td className="px-6 py-4 text-xs font-semibold text-gray-500">-</td>
                              <td className="px-6 py-4 text-xs font-semibold text-gray-500">-</td>
                              <td className="px-6 py-4 text-xs font-bold text-gray-700 dark:text-gray-200">Saldo Awal</td>
                              <td className="px-6 py-4 text-xs font-semibold text-gray-500">-</td>
                              <td className="px-6 py-4 text-right text-sm font-bold text-gray-500">-</td>
                              <td className="px-6 py-4 text-right text-sm font-bold text-gray-500">-</td>
                              <td className={`px-6 py-4 text-right text-sm font-bold ${account.openingBalance < 0 ? "text-red-500" : "text-emerald-600 dark:text-emerald-400"}`}>{formatRupiah(account.openingBalance)}</td>
                            </tr>

                            {account.transactions.map((trx) => (
                              <tr key={trx.id} className="hover:bg-[#FFF0E6]/30 dark:hover:bg-orange-500/5 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-xs font-medium text-gray-500 dark:text-gray-400">{formatDate(trx.date)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-gray-900 dark:text-gray-200">{trx.reference}</td>
                                <td className="px-6 py-4 text-xs font-semibold text-gray-700 dark:text-gray-300">{trx.description || "-"}</td>
                                <td className="px-6 py-4">
                                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[10px] font-bold ${getProjectBadgeClass(trx.projectId)}`}>
                                    {trx.projectName}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-gray-100 text-right">
                                  {trx.debit > 0 ? formatRupiah(trx.debit) : "-"}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-gray-100 text-right">
                                  {trx.credit > 0 ? formatRupiah(trx.credit) : "-"}
                                </td>
                                <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold text-right ${trx.balance < 0 ? "text-red-500" : "text-emerald-600 dark:text-emerald-400"}`}>
                                  {formatRupiah(trx.balance)}
                                </td>
                              </tr>
                            ))}

                            <tr className="bg-[#F9FAFB] dark:bg-slate-900/50">
                              <td className="px-6 py-4 text-xs font-semibold text-gray-500">-</td>
                              <td className="px-6 py-4 text-xs font-semibold text-gray-500">-</td>
                              <td className="px-6 py-4 text-xs font-black text-gray-900 dark:text-white">TOTAL</td>
                              <td className="px-6 py-4 text-xs font-semibold text-gray-500">-</td>
                              <td className="px-6 py-4 text-right text-sm font-black text-gray-900 dark:text-white">{formatRupiah(account.totalDebit)}</td>
                              <td className="px-6 py-4 text-right text-sm font-black text-gray-900 dark:text-white">{formatRupiah(account.totalCredit)}</td>
                              <td className={`px-6 py-4 text-right text-sm font-black ${account.endingBalance < 0 ? "text-red-500" : "text-emerald-600 dark:text-emerald-400"}`}>{formatRupiah(account.endingBalance)}</td>
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
