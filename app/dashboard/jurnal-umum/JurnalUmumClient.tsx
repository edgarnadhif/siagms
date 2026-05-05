"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteJournalEntriesByReference } from "@/app/actions";
import AddJurnalModal from "./AddJurnalModal";
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
  const [expandedRefs, setExpandedRefs] = useState<Set<string>>(new Set());
  const quickPeriod = "";
  const typeFilter = "";
  const [selectedRefs, setSelectedRefs] = useState<Set<string>>(new Set());

  const [deleteModal, setDeleteModal] = useState<{
    show: boolean;
    type: "single" | "bulk";
    reference?: string;
  }>({ show: false, type: "single" });
  const [toasts, setToasts] = useState<{ id: number; message: string; type: "success" | "error" }[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: "success" | "error") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 5000);
  }, [removeToast]);

  const confirmDelete = async () => {
    if (deleteModal.type === "single" && deleteModal.reference) {
      setDeletingRef(deleteModal.reference);
      const result = await deleteJournalEntriesByReference(deleteModal.reference);
      if (result?.error) {
        showToast(result.error, "error");
      } else {
        showToast("Jurnal berhasil dihapus", "error");
      }
      setDeletingRef(null);
      setDeleteModal({ show: false, type: "single" });
    } else if (deleteModal.type === "bulk") {
      setDeletingRef("bulk");
      const results = await Promise.all(
        Array.from(selectedRefs).map((ref) => deleteJournalEntriesByReference(ref)),
      );
      const errors = results.filter((r) => r?.error);
      if (errors.length > 0) {
        showToast(`${errors.length} jurnal gagal dihapus`, "error");
      } else {
        showToast(`${selectedRefs.size} jurnal berhasil dihapus`, "error");
      }
      setDeletingRef(null);
      setSelectedRefs(new Set());
      setDeleteModal({ show: false, type: "bulk" });
    }
    router.refresh();
  };

  const handleDelete = (reference: string) => {
    setDeleteModal({
      show: true,
      type: "single",
      reference: reference,
    });
  };

  const toggleExpand = (ref: string) => {
    setExpandedRefs((prev) => {
      const next = new Set(prev);
      if (next.has(ref)) next.delete(ref);
      else next.add(ref);
      return next;
    });
  };

  const getQuickDateRange = (period: string): { start: Date | null; end: Date | null } => {
    const now = new Date();
    if (period === "this-month") {
      return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: new Date(now.getFullYear(), now.getMonth() + 1, 0) };
    }
    if (period === "last-month") {
      return { start: new Date(now.getFullYear(), now.getMonth() - 1, 1), end: new Date(now.getFullYear(), now.getMonth(), 0) };
    }
    if (period === "3-months") {
      return { start: new Date(now.getFullYear(), now.getMonth() - 2, 1), end: new Date(now.getFullYear(), now.getMonth() + 1, 0) };
    }
    return { start: null, end: null };
  };

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [itemsPerPageOpen, setItemsPerPageOpen] = useState(false);
  const itemsPerPageRef = useRef<HTMLDivElement>(null);

  const [localSearch, setLocalSearch] = useState(search || "");
  const [projectFilter, setProjectFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [fromDateFocused, setFromDateFocused] = useState(false);
  const [toDateFocused, setToDateFocused] = useState(false);
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);
  const projectRef = useRef<HTMLDivElement>(null);

  const hideNativeDateIcon = (
    <style>{`
      input[type="date"]::-webkit-calendar-picker-indicator {
        display: none;
        -webkit-appearance: none;
      }
    `}</style>
  );

  const filteredJournals = journals.filter((j) => {
    const matchesSearch =
      (j.description || "").toLowerCase().includes(localSearch.toLowerCase()) ||
      j.reference.toLowerCase().includes(localSearch.toLowerCase());

    const jDate = new Date(j.date);
    jDate.setHours(0, 0, 0, 0);

    let matchesDate = true;
    if (quickPeriod) {
      const { start, end } = getQuickDateRange(quickPeriod);
      if (start && jDate < start) matchesDate = false;
      if (end) { end.setHours(23, 59, 59, 999); if (jDate > end) matchesDate = false; }
    } else {
      if (startDate) {
        const sDate = new Date(startDate);
        sDate.setHours(0, 0, 0, 0);
        if (jDate < sDate) matchesDate = false;
      }
      if (endDate) {
        const eDate = new Date(endDate);
        eDate.setHours(23, 59, 59, 999);
        if (jDate > eDate) matchesDate = false;
      }
    }

    const matchesProject = projectFilter ? j.projectId === projectFilter : true;
    const matchesType = typeFilter ? (j.isAuto ? "AUTO" : "MANUAL") === typeFilter : true;

    return matchesSearch && matchesDate && matchesProject && matchesType;
  });


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        itemsPerPageRef.current &&
        !itemsPerPageRef.current.contains(event.target as Node)
      ) {
        setItemsPerPageOpen(false);
      }
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

  const totalPages = Math.ceil(filteredJournals.length / itemsPerPage);
  const safeCurrentPage = Math.min(currentPage, Math.max(totalPages, 1));
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const paginatedJournals = filteredJournals.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  // Checkbox helpers
  const allOnPageSelected = paginatedJournals.length > 0 && paginatedJournals.every((j) => selectedRefs.has(j.reference));
  const toggleSelectAll = () => {
    setSelectedRefs((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) paginatedJournals.forEach((j) => next.delete(j.reference));
      else paginatedJournals.forEach((j) => next.add(j.reference));
      return next;
    });
  };
  const toggleSelect = (ref: string) => {
    setSelectedRefs((prev) => {
      const next = new Set(prev);
      if (next.has(ref)) next.delete(ref);
      else next.add(ref);
      return next;
    });
  };

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (safeCurrentPage <= 3) {
        pages.push(1, 2, 3, 4, "...", totalPages);
      } else if (safeCurrentPage >= totalPages - 2) {
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
          safeCurrentPage - 1,
          safeCurrentPage,
          safeCurrentPage + 1,
          "...",
          totalPages,
        );
      }
    }
    return pages;
  };

  return (
    <div className="text-gray-600 dark:text-gray-300 w-full h-full pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 lg:mb-3 px-4 md:px-0">
        <div>
          <h1 className="page-title dark:text-gray-100">Jurnal Umum</h1>
          <p className="card-subtitle text-gray-400 dark:text-gray-400 mt-2">
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
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-200 w-full md:w-auto"
          >
            <img
              src="/add.svg"
              alt="Add"
              className="w-4 h-4 invert dark:invert-0"
            />
            Tambah Jurnal
          </Link>
        </div>
      </div>

      {/* Search Area */}
      <div className="sticky -top-6 z-30 pt-2 pb-3 bg-white dark:bg-[#111827] -mx-6 px-6">
        <div className="flex flex-col md:flex-row flex-wrap items-center gap-3 w-full">
          {hideNativeDateIcon}
          
          {/* Search Input Section */}
          <div className="flex-1 min-w-[240px] h-11 inline-flex items-center gap-3 rounded-xl border-[0.5px] border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-800 px-3 focus-within:border-slate-400 focus-within:ring-2 focus-within:ring-slate-100 dark:focus-within:border-slate-500 dark:focus-within:ring-slate-800 transition-colors">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-4 h-4 text-slate-400 flex-shrink-0"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
            <input
              type="text"
              value={localSearch}
              onChange={(e) => {
                setLocalSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari jurnal..."
              className="flex-1 bg-transparent border-none focus:ring-0 outline-none text-sm font-medium text-slate-700 dark:text-slate-200 placeholder:font-normal placeholder:text-slate-400"
            />
            {localSearch && (
              <button
                type="button"
                onClick={() => {
                  setLocalSearch("");
                  setCurrentPage(1);
                }}
                className="p-1 text-slate-300 hover:text-slate-500 transition-colors"
                title="Hapus pencarian"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Project Dropdown */}
          <div className="w-full md:w-[150px] lg:w-[160px] relative" ref={projectRef}>
            <button
              type="button"
              onClick={() => setProjectMenuOpen(!projectMenuOpen)}
              className="w-full h-11 inline-flex items-center justify-between px-3 bg-white dark:bg-slate-800 border-[0.5px] border-[#E5E7EB] dark:border-slate-700 rounded-xl transition-colors"
            >
              <span className="text-sm font-normal text-slate-700 dark:text-slate-200 truncate">
                {projectFilter
                  ? projects.find((p) => p.id === projectFilter)?.code || projects.find((p) => p.id === projectFilter)?.name
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
                    setProjectFilter("");
                    setCurrentPage(1);
                    setProjectMenuOpen(false);
                  }}
                  className={`text-left px-3 py-2 text-sm rounded-md transition-colors ${projectFilter === "" ? "bg-slate-50 text-slate-900 font-medium dark:bg-slate-700 dark:text-white" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"}`}
                >
                  Semua Proyek
                </button>
                {projects.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setProjectFilter(p.id);
                      setCurrentPage(1);
                      setProjectMenuOpen(false);
                    }}
                    className={`text-left px-3 py-2 text-sm rounded-md transition-colors ${projectFilter === p.id ? "bg-slate-50 text-slate-900 font-medium dark:bg-slate-700 dark:text-white" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"}`}
                  >
                    {p.code} — {p.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Start Date */}
          <div className="w-full md:w-[150px] lg:w-[160px] relative">
            <div className="h-11 inline-flex w-full items-center justify-between rounded-xl border-[0.5px] border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-800 transition-colors relative">
              {!startDate && !fromDateFocused && (
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 pointer-events-none">
                  Dari Tanggal
                </span>
              )}
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setCurrentPage(1);
                }}
                onFocus={() => setFromDateFocused(true)}
                onBlur={() => setFromDateFocused(false)}
                onClick={(e) => e.currentTarget.showPicker()}
                className={`w-full h-11 pl-3 pr-8 border-0 bg-transparent text-sm font-normal focus:ring-0 focus:outline-none outline-none cursor-pointer rounded-xl ${startDate || fromDateFocused ? "text-slate-700 dark:text-slate-200" : "text-transparent"}`}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-slate-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                </svg>
              </div>
            </div>
          </div>
          
          {/* End Date */}
          <div className="w-full md:w-[150px] lg:w-[160px] relative">
            <div className="h-11 inline-flex w-full items-center justify-between rounded-xl border-[0.5px] border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-800 transition-colors relative">
              {!endDate && !toDateFocused && (
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 pointer-events-none">
                  Sampai Tanggal
                </span>
              )}
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setCurrentPage(1);
                }}
                onFocus={() => setToDateFocused(true)}
                onBlur={() => setToDateFocused(false)}
                onClick={(e) => e.currentTarget.showPicker()}
                className={`w-full h-11 pl-3 pr-8 border-0 bg-transparent text-sm font-normal focus:ring-0 focus:outline-none outline-none cursor-pointer rounded-xl ${endDate || toDateFocused ? "text-slate-700 dark:text-slate-200" : "text-transparent"}`}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-slate-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Selection Bar */}
      {selectedRefs.size > 0 && (
        <div className="mt-2 mb-4 animate-in fade-in slide-in-from-top-2 duration-300 mx-4 md:mx-0">
          <div className="flex flex-col md:flex-row items-center justify-between bg-[#FFF0E6] dark:bg-orange-500/10 border border-[#EA6C00] rounded-xl p-2 md:px-4 md:py-2 gap-3 shadow-sm">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {selectedRefs.size} jurnal dipilih
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <button
                onClick={() => setSelectedRefs(new Set())}
                className="flex-1 md:flex-none px-4 h-9 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95 shadow-sm"
              >
                Batalkan Pilihan
              </button>
              <button
                onClick={() => setDeleteModal({ show: true, type: "bulk" })}
                disabled={deletingRef !== null}
                className="flex-1 md:flex-none px-4 h-9 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-lg shadow-sm shadow-red-500/20 transition-all active:scale-95 disabled:opacity-50"
              >
                Hapus Terpilih
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Journal Table */}
      <div className="mb-15 mx-4 md:mx-0">
        {filteredJournals.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border-[0.5px] border-[#E5E7EB] dark:border-slate-700 shadow-sm py-55 px-16 text-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800/80 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
              <img
                src="/library_books.svg"
                alt="Jurnal"
                className="w-10 h-10 opacity-20 grayscale dark:invert"
              />
            </div>
            <p className="font-bold text-gray-900 dark:text-white">
              Belum ada jurnal
            </p>
            <p className="text-sm text-gray-400 mt-1 italic">
              Klik &quot;Tambah Jurnal&quot; untuk memulai pencatatan.
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 border-[0.5px] border-[#E5E7EB] dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">

            {/* Table */}
            {/* Table */}
            <div className="overflow-x-auto scrollbar-hide">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                    {/* Checkbox header */}
                    <th className="px-5 py-5 w-[50px] text-center">
                      <input
                        type="checkbox"
                        checked={allOnPageSelected}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-100 dark:border-slate-600 dark:bg-slate-700 cursor-pointer"
                      />
                    </th>
                    <th className="px-5 py-5 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400 w-[120px]">TANGGAL</th>
                    <th className="px-5 py-5 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400 w-[150px]">NO. JURNAL</th>
                    <th className="px-5 py-5 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">DESKRIPSI</th>
                    <th className="px-5 py-5 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400 w-[120px]">PROYEK</th>
                    <th className="px-5 py-5 text-right text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400 w-[160px]">TOTAL</th>
                    <th className="px-5 py-5 text-center text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400 w-[100px]">AKSI</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedJournals.map((journal) => {
                    const isExpanded = expandedRefs.has(journal.reference);
                    const isSelected = selectedRefs.has(journal.reference);
                    return (
                      <React.Fragment key={journal.reference}>
                        {/* Main row */}
                        <tr className={`border-b border-slate-100 dark:border-slate-700/50 transition-colors ${
                          isSelected ? "bg-slate-50/60 dark:bg-slate-700/30" : "hover:bg-slate-50/60 dark:hover:bg-slate-700/30"
                        }`}>
                          {/* Checkbox */}
                          <td className="px-5 py-5 whitespace-nowrap text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelect(journal.reference)}
                              className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-100 dark:border-slate-600 dark:bg-slate-700 cursor-pointer"
                            />
                          </td>
                          {/* Date */}
                          <td className="px-5 py-5 whitespace-nowrap text-sm font-medium text-slate-500 dark:text-slate-400">
                            {formatDate(journal.date)}
                          </td>
                          {/* Reference */}
                          <td className="px-5 py-5 whitespace-nowrap">
                            <span className="text-sm font-semibold text-slate-900 dark:text-white leading-none">{journal.reference}</span>
                          </td>
                          {/* Description */}
                          <td className="px-5 py-5">
                            <span className="text-sm font-medium text-slate-900 dark:text-white line-clamp-1">
                              {journal.description || "—"}
                            </span>
                          </td>
                          {/* Project */}
                          <td className="px-5 py-5 whitespace-nowrap text-sm font-medium text-slate-600 dark:text-slate-400">
                            {journal.projectId ? journal.projectCode : "Global"}
                          </td>
                          {/* Total */}
                          <td className="px-5 py-5 whitespace-nowrap text-sm font-semibold text-slate-900 dark:text-white tabular-nums text-right">
                            {formatRupiah(journal.totalDebit)}
                          </td>
                          {/* Actions */}
                          <td className="px-5 py-5 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center gap-1">
                              {/* Expand button */}
                              <button
                                type="button"
                                onClick={() => toggleExpand(journal.reference)}
                                className={`w-8 h-8 inline-flex items-center justify-center rounded-lg border transition-colors ${
                                  isExpanded
                                    ? "border-orange-200 bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:border-orange-500/20"
                                    : "border-slate-200 dark:border-slate-600 text-slate-400 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                                }`}
                                title={isExpanded ? "Sembunyikan detail" : "Lihat detail"}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
                                  className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                </svg>
                              </button>
                              {/* Delete button */}
                              <button
                                type="button"
                                onClick={() => handleDelete(journal.reference)}
                                disabled={deletingRef === journal.reference}
                                className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors disabled:opacity-50"
                                title="Hapus jurnal"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Expanded detail row */}
                        {isExpanded && (
                          <tr className="border-b border-slate-100 dark:border-slate-700/60">
                            <td colSpan={7} className="bg-slate-50/60 dark:bg-slate-900/20 px-12 py-3">
                              {/* Mini table header */}
                              <div className="grid grid-cols-[minmax(0,1fr)_160px_160px] pb-2">
                                <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400">Akun</span>
                                <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400 text-right">Debit</span>
                                <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400 text-right">Kredit</span>
                              </div>
                              {journal.entries.map((entry) => (
                                <div key={entry.id} className="grid grid-cols-[minmax(0,1fr)_160px_160px] items-center py-2 border-t border-slate-100 dark:border-slate-700/40">
                                  <span className="text-sm text-slate-700 dark:text-slate-300 truncate pr-4">{entry.accountCode} — {entry.accountName}</span>
                                  <span className={`text-sm font-semibold tabular-nums text-right ${entry.debit > 0 ? "text-slate-900 dark:text-white" : "text-slate-300 dark:text-slate-600"}`}>
                                    {entry.debit > 0 ? formatRupiah(entry.debit) : "—"}
                                  </span>
                                  <span className={`text-sm font-semibold tabular-nums text-right ${entry.credit > 0 ? "text-slate-900 dark:text-white" : "text-slate-300 dark:text-slate-600"}`}>
                                    {entry.credit > 0 ? formatRupiah(entry.credit) : "—"}
                                  </span>
                                </div>
                              ))}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination UI */}
            <div className="px-5 py-3.5 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700/50 flex flex-col md:flex-row items-center justify-between gap-4 rounded-b-2xl">
              {/* Left: count */}
              <div className="text-sm text-slate-500 dark:text-slate-400 order-2 md:order-1">
                Total Jurnal:{" "}
                <span className="font-semibold text-slate-900 dark:text-white">
                  {filteredJournals.length}
                </span>
              </div>

              {/* Center: page nav */}
              <div className="flex items-center gap-1 order-1 md:order-2">
                <button 
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} 
                  disabled={safeCurrentPage === 1}
                  className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:text-slate-400 disabled:hover:bg-transparent transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                </button>
                {getPageNumbers().map((page, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => typeof page === "number" && setCurrentPage(page)} 
                    disabled={page === "..."}
                    className={`min-w-[36px] h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-all ${
                      safeCurrentPage === page 
                        ? "bg-orange-50 text-orange-600 border border-orange-200 dark:bg-orange-500/10 dark:border-orange-500/20"
                        : page === "..." 
                          ? "text-slate-400 cursor-default"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button 
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} 
                  disabled={safeCurrentPage === totalPages || totalPages === 0}
                  className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:text-slate-400 disabled:hover:bg-transparent transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              </div>

              {/* Right: per-page */}
              <div className="flex items-center gap-3 order-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-[0.06em]">
                  Show per Page:
                </span>
                <div className="relative" ref={itemsPerPageRef}>
                  <button 
                    type="button" 
                    onClick={() => setItemsPerPageOpen(!itemsPerPageOpen)}
                    className="flex items-center gap-2 px-3 h-9 min-w-[60px] justify-between border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 transition-all hover:bg-slate-50 dark:hover:bg-slate-700 focus:ring-2 focus:ring-orange-100 dark:focus:ring-orange-900/30 active:scale-95"
                  >
                    <span>{itemsPerPage}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${itemsPerPageOpen ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  {itemsPerPageOpen && (
                    <div className="absolute z-50 bottom-full right-0 mb-2 w-[70px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[10px] shadow-lg overflow-hidden flex flex-col p-1 animate-in slide-in-from-bottom-2 duration-200">
                      {[5, 10, 20, 50].map((val) => (
                        <button 
                          key={val} 
                          type="button" 
                          onClick={() => { setItemsPerPage(val); setCurrentPage(1); setItemsPerPageOpen(false); }}
                          className={`text-center py-2 text-sm font-medium rounded-md transition-all ${
                            itemsPerPage === val 
                              ? "bg-slate-50 text-slate-900 font-semibold dark:bg-slate-700 dark:text-white" 
                              : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50"
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

          </div>
        )}
        <br></br>

      </div>


      {/* Modals */}
      {showAddModal && <AddJurnalModal accounts={accounts} projects={projects} showToast={showToast} />}
      {showConfigModal && (
        <KonfigurasiJurnalModal
          mappingAccounts={mappingAccounts}
          onClose={() => setShowConfigModal(false)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl w-full max-w-[400px] overflow-hidden p-8 flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-rose-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white text-center mb-2">
              {deleteModal.type === "bulk"
                ? `Hapus ${selectedRefs.size} Jurnal?`
                : "Hapus Jurnal?"}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-center mb-8">
              {deleteModal.type === "bulk"
                ? "Semua jurnal yang dipilih akan dihapus secara permanen."
                : "Jurnal ini akan dihapus secara permanen."}
            </p>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setDeleteModal({ show: false, type: "single" })}
                className="flex-1 h-12 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-[0.98]"
              >
                Batal
              </button>
              <button
                onClick={confirmDelete}
                disabled={deletingRef !== null}
                className="flex-1 h-12 rounded-xl bg-rose-500 text-white font-semibold hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deletingRef !== null ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "Ya, Hapus"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Toast Notifications */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-3 px-6 py-3.5 rounded-full shadow-2xl text-sm font-semibold text-white min-w-[280px] animate-in slide-in-from-right-5 duration-300 ${
              t.type === "success" ? "bg-[#00945E]" : "bg-red-600"
            }`}
          >
            {t.type === "success" ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5 shrink-0"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5 shrink-0"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            <span className="flex-1">{t.message}</span>
            <button
              onClick={() => removeToast(t.id)}
              className="text-white/70 hover:text-white ml-2 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
