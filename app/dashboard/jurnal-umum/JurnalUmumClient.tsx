"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteJournalEntriesByReference } from "@/app/actions";
import AddJurnalModal from "./AddJurnalModal";
import StatusBadge from "@/components/ui/StatusBadge";
import KonfigurasiJurnalModal from "./KonfigurasiJurnalModal";

interface JournalGroup {
  reference: string;
  date: string;
  description: string | null;
  projectId: string | null;
  projectCode: string | null;
  projectName: string | null;
  entries: {
    id: string;
    accountCode: string;
    accountName: string;
    debit: number;
    credit: number;
  }[];
  totalDebit: number;
  totalCredit: number;
  isAuto: boolean;
}

interface Account {
  id: string;
  code: string;
  name: string;
}

interface Project {
  id: string;
  code: string;
  name: string;
}

function formatRupiah(num: number) {
  return "Rp " + num.toLocaleString("id-ID");
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${d.getDate().toString().padStart(2, "0")} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export default function JurnalUmumClient({
  journals,
  accounts,
  projects,
  mappingAccounts,
  search,
  showAddModal,
}: {
  journals: JournalGroup[];
  accounts: Account[];
  projects: Project[];
  mappingAccounts: { id: string; code: string; name: string; isActive: boolean }[];
  search: string;
  showAddModal: boolean;
}) {
  const router = useRouter();
  const [deletingRef, setDeletingRef] = useState<string | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);

  const handleDelete = async (reference: string) => {
    if (!confirm(`Yakin ingin menghapus jurnal ${reference}?`)) return;
    setDeletingRef(reference);
    await deleteJournalEntriesByReference(reference);
    setDeletingRef(null);
    router.refresh();
  };

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [itemsPerPageOpen, setItemsPerPageOpen] = useState(false);
  const itemsPerPageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        itemsPerPageRef.current &&
        !itemsPerPageRef.current.contains(event.target as Node)
      ) {
        setItemsPerPageOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const totalPages = Math.ceil(journals.length / itemsPerPage);
  const paginatedJournals = journals.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(
          1,
          "...",
          totalPages - 3,
          totalPages - 2,
          totalPages - 1,
          totalPages,
        );
      } else {
        pages.push(
          1,
          "...",
          currentPage - 1,
          currentPage,
          currentPage + 1,
          "...",
          totalPages,
        );
      }
    }
    return pages;
  };

  return (
    <div className="text-gray-600 dark:text-gray-300 w-full h-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 lg:mb-3 px-4 md:px-0">
        <div>
          <h1 className="page-title dark:text-gray-100">Jurnal Umum</h1>
          <p className="card-subtitle text-gray-400 dark:text-gray-400 mt-3">
            Pencatatan debit dan kredit
          </p>
        </div>
        <div className="flex items-center gap-3 ml-auto w-full md:w-auto">
          <button
            onClick={() => setShowConfigModal(true)}
            className="flex items-center gap-2 px-4 h-10 text-sm font-bold rounded-[10px] border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:border-[#EA6C00] hover:text-[#EA6C00] transition-all active:scale-95 w-full md:w-auto justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
            </svg>
            Konfigurasi Jurnal
          </button>
          <Link
            href="?add=true"
            className="flex items-center gap-2 px-5 h-10 bg-[#EA6C00] hover:bg-[#C25500] text-white text-sm font-bold rounded-[10px] shadow-lg shadow-orange-500/20 transition-all active:scale-95 w-full md:w-auto justify-center md:justify-start"
          >
            <img src="/add.svg" alt="Add" className="w-5 h-5 invert dark:invert-0" />
            Tambah Jurnal
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="sticky -top-6 z-30 pt-8 pb-4 bg-white dark:bg-[#111827] -mx-6 px-6">
        <form className="relative w-full">
          <div className="flex flex-col md:flex-row items-center bg-white dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 rounded-[12px] shadow-sm focus-within:ring-2 focus-within:ring-[#EA6C00]/10 focus-within:border-[#EA6C00] transition-all p-1.5 min-h-[56px] md:h-14 w-full">
            {/* Search Input Section */}
            <div className="flex flex-1 items-center px-3 gap-3 w-full h-full min-h-[44px]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
                className="w-4 h-4 text-gray-400"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                />
              </svg>
              <input
                type="text"
                name="search"
                defaultValue={search}
                placeholder="Cari jurnal..."
                className="w-full bg-transparent border-none focus:ring-0 outline-none text-sm py-2 text-gray-900 dark:text-gray-100 placeholder-gray-400 font-medium pr-12"
              />
            </div>

            {/* Circular Search Button - Now Absolute inside the right of the bar */}
            <button
              type="submit"
              className="absolute right-3 w-11 h-11 bg-[#EA6C00] hover:bg-[#C25500] text-white rounded-full transition-all shadow-md shadow-orange-500/20 flex items-center justify-center group flex-shrink-0"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5 group-hover:scale-110 transition-transform"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                />
              </svg>
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-[14px] border-[0.5px] border-[#E5E7EB] dark:border-slate-700/50 shadow-sm overflow-hidden mb-10 mx-4 md:mx-0">
        {journals.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center px-6">
            <div className="w-16 h-16 bg-[#FFF0E6] dark:bg-orange-900/20 rounded-full flex items-center justify-center mb-4 border border-orange-100 dark:border-orange-900/30">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-8 h-8 text-[#EA6C00]"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-300">
              Belum ada jurnal.
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Klik &quot;Tambah Jurnal&quot; untuk memulai pencatatan.
            </p>
            <Link
              href="?add=true"
              className="mt-4 px-5 py-2 bg-[#EA6C00] hover:bg-[#C25500] text-white text-xs font-bold rounded-[10px] shadow-md shadow-orange-500/10 transition-all active:scale-95"
            >
              Tambah Jurnal
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-slate-700/80">
            {paginatedJournals.map((journal) => (
              <div
                key={journal.reference}
                className="p-5 pb-9 hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors"
              >
                {/* Journal Header */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        {journal.reference}
                      </span>
                      <span className="text-sm text-slate-400 dark:text-slate-500">
                        {formatDate(journal.date)}
                      </span>
                      <StatusBadge
                        status={journal.isAuto ? "AUTO" : "MANUAL"}
                        variant="JOURNAL"
                        size="sm"
                      />
                    </div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {journal.description || "-"}
                    </p>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          journal.projectId
                            ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                            : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {journal.projectId
                          ? `${journal.projectCode} - ${journal.projectName}`
                          : "Global"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-[#0f172a] dark:text-white">
                      {formatRupiah(journal.totalDebit)}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDelete(journal.reference)}
                        disabled={deletingRef === journal.reference}
                        className="text-red-400 hover:text-red-600 transition-colors p-1 disabled:opacity-50"
                        title="Hapus"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-4 h-4"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sub Table */}
                <div className="w-full">
                  <div className="flex px-4 md:px-8 text-xs font-semibold text-[#64748b] dark:text-slate-400 mb-2 mt-4">
                    <div className="flex-1 text-left">Akun</div>
                    <div className="w-[120px] md:w-[200px] text-right">
                      Debit
                    </div>
                    <div className="w-[120px] md:w-[200px] text-right">
                      Kredit
                    </div>
                  </div>

                  <div className="space-y-1">
                    {journal.entries.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex px-4 md:px-8 text-xs text-[#475569] dark:text-slate-400 py-1"
                      >
                        <div className="flex-1">
                          {entry.accountCode} — {entry.accountName}
                        </div>
                        <div className="w-[120px] md:w-[200px] text-right">
                          {entry.debit > 0 ? formatRupiah(entry.debit) : ""}
                        </div>
                        <div className="w-[120px] md:w-[200px] text-right">
                          {entry.credit > 0 ? formatRupiah(entry.credit) : ""}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination UI */}
        {journals.length > 0 && (
          <div className="px-5 py-4 bg-white dark:bg-slate-800 border-t border-[#F3F4F6] dark:border-slate-700/50 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-500 dark:text-gray-400 order-2 md:order-1">
              Total Jurnal:{" "}
              <span className="font-bold text-gray-900 dark:text-white">
                {journals.length}
              </span>
            </div>

            <div className="flex items-center gap-1 order-1 md:order-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 text-gray-400 hover:text-[#EA6C00] disabled:opacity-30 disabled:hover:text-gray-400 transition-all"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 19.5L8.25 12l7.5-7.5"
                  />
                </svg>
              </button>

              {getPageNumbers().map((page, idx) => (
                <button
                  key={idx}
                  onClick={() =>
                    typeof page === "number" && setCurrentPage(page)
                  }
                  disabled={page === "..."}
                  className={`min-w-[32px] h-8 flex items-center justify-center rounded-lg text-sm font-bold transition-all ${
                    currentPage === page
                      ? "bg-[#FFF0E6] text-[#EA6C00]"
                      : page === "..."
                        ? "text-gray-400 cursor-default"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700"
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
                className="p-2 text-gray-400 hover:text-[#EA6C00] disabled:opacity-30 disabled:hover:text-gray-400 transition-all"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.25 4.5l7.5 7.5-7.5 7.5"
                  />
                </svg>
              </button>
            </div>

            <div className="flex items-center gap-3 order-3">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Show per Page:
              </span>
              <div className="relative" ref={itemsPerPageRef}>
                <button
                  type="button"
                  onClick={() => setItemsPerPageOpen(!itemsPerPageOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 min-w-[60px] justify-between border border-[#EA6C00] rounded-lg text-sm font-bold text-[#EA6C00] bg-white dark:bg-slate-800 transition-all hover:bg-orange-50 dark:hover:bg-orange-950/20 active:scale-95"
                >
                  <span>{itemsPerPage}</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${itemsPerPageOpen ? "rotate-180" : ""}`}
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

                {itemsPerPageOpen && (
                  <div className="absolute z-50 bottom-full left-0 mb-2 w-[70px] bg-white dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 rounded-[10px] shadow-[0_4px_12px_rgba(0,0,0,0.08)] overflow-hidden flex flex-col p-1 animate-in slide-in-from-bottom-2 duration-200">
                    {[5, 10, 20, 50].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => {
                          setItemsPerPage(val);
                          setCurrentPage(1);
                          setItemsPerPageOpen(false);
                        }}
                        className={`text-center py-2 text-sm font-bold rounded-md transition-all ${
                          itemsPerPage === val
                            ? "bg-[#EA6C00] text-white"
                            : "text-[#374151] dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700/50"
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddModal && <AddJurnalModal accounts={accounts} projects={projects} />}
      {showConfigModal && (
        <KonfigurasiJurnalModal
          mappingAccounts={mappingAccounts}
          onClose={() => setShowConfigModal(false)}
        />
      )}
    </div>
  );
}
