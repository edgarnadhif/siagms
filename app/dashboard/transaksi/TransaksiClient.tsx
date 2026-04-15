"use client";

import React, { useState, useTransition, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteTransaction, deleteTransactions } from "@/app/actions";
import AddTransaksiModal from "./AddTransaksiModal";
import EditTransaksiModal from "./EditTransaksiModal";
import CategoryBadge from "@/components/ui/CategoryBadge";
import { TransactionCategory } from "@prisma/client";

interface Transaction {
  id: string;
  reference: string;
  date: string;
  description: string;
  note: string | null;
  category: string;
  amount: number;
  projectCode: string;
  projectName: string | null;
  projectId: string | null;
  hasJournal?: boolean;
}

interface Project {
  id: string;
  code: string;
  name: string;
}

interface CustomerOption {
  id: string;
  name: string;
  customerCode?: string;
  paymentMethod?: string;
}

interface UnitOption {
  id: string;
  unitCode: string;
  blockName: string;
  unitNumber: string;
  status: string;
  projectId: string;
  customer?: CustomerOption | null;
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

export default function TransaksiClient({
  transactions,
  projects,
  units,
  customers,
  search: initialSearch,
  category: initialCategory,
  projectFilter: initialProjectFilter,
  showAddModal,
}: {
  transactions: Transaction[];
  projects: Project[];
  units: UnitOption[];
  customers: CustomerOption[];
  search: string;
  category: string;
  projectFilter: string;
  showAddModal: boolean;
}) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  // Local state for real-time filtering
  const [search, setSearch] = useState(initialSearch || "");
  const [category, setCategory] = useState(initialCategory || "");
  const [projectFilter, setProjectFilter] = useState(
    initialProjectFilter || "",
  );

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus transaksi ini?")) return;
    setIsDeleting(true);
    setDeleteError("");
    const result = await deleteTransaction(id);
    if (result?.error) {
      setDeleteError(result.error);
    }
    setIsDeleting(false);
    router.refresh();
  };

  const handleBulkDelete = async () => {
    if (
      !confirm(
        `Apakah Anda yakin ingin menghapus ${selectedIds.length} transaksi yang dipilih?`,
      )
    )
      return;
    setIsDeleting(true);
    setDeleteError("");
    const result = await deleteTransactions(selectedIds);
    if (result?.error) {
      setDeleteError(result.error);
    } else {
      setSelectedIds([]);
    }
    setIsDeleting(false);
    router.refresh();
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === transactions.length && transactions.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(transactions.map((t) => t.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const [deleteModal, setDeleteModal] = useState<{
    show: boolean;
    type: "single" | "bulk";
    id?: string;
  }>({ show: false, type: "single" });

  const [editId, setEditId] = useState<string | null>(null);

  // Filter Dropdown States
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);
  const [projDropdownOpen, setProjDropdownOpen] = useState(false);
  const [itemsPerPageOpen, setItemsPerPageOpen] = useState(false);
  const catFilterRef = useRef<HTMLDivElement>(null);
  const projFilterRef = useRef<HTMLDivElement>(null);
  const itemsPerPageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        catFilterRef.current &&
        !catFilterRef.current.contains(event.target as Node)
      )
        setCatDropdownOpen(false);
      if (
        projFilterRef.current &&
        !projFilterRef.current.contains(event.target as Node)
      )
        setProjDropdownOpen(false);
      if (
        itemsPerPageRef.current &&
        !itemsPerPageRef.current.contains(event.target as Node)
      )
        setItemsPerPageOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const confirmDelete = async () => {
    setIsDeleting(true);
    setDeleteError("");

    if (deleteModal.type === "single" && deleteModal.id) {
      const result = await deleteTransaction(deleteModal.id);
      if (result?.error) setDeleteError(result.error);
    } else if (deleteModal.type === "bulk") {
      const result = await deleteTransactions(selectedIds);
      if (result?.error) {
        setDeleteError(result.error);
      } else {
        setSelectedIds([]);
      }
    }

    setIsDeleting(false);
    setDeleteModal({ show: false, type: "single" });
    router.refresh();
  };

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch =
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.reference.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category ? t.category === category : true;
    const matchesProject = projectFilter ? t.projectId === projectFilter : true;
    return matchesSearch && matchesCategory && matchesProject;
  });

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const safeCurrentPage = Math.min(currentPage, Math.max(totalPages, 1));
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

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
    <div className="text-gray-600 dark:text-gray-300 w-full h-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 px-4 md:px-0">
        <div>
          <h1 className="page-title dark:text-gray-100">Transaksi</h1>
          <p className="card-subtitle text-gray-400 dark:text-gray-400 mt-3">
            Kelola semua transaksi keuangan
          </p>
        </div>
        <Link
          href="?add=true"
          className="flex items-center gap-2 px-5 h-11 bg-[#EA6C00] hover:bg-[#C25500] text-white text-sm font-bold rounded-[10px] shadow-lg shadow-orange-500/20 transition-all active:scale-95 ml-auto w-full md:w-auto justify-center md:justify-start"
        >
          <img
            src="/add.svg"
            alt="Add"
            className="w-5 h-5 invert dark:invert-0"
          />
          Tambah Transaksi
        </Link>
      </div>

      {deleteError && (
        <div className="mb-4 mx-4 md:mx-0 p-3 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 text-xs font-semibold rounded-lg border border-red-100 dark:border-red-900/20">
          {deleteError}
        </div>
      )}

      {/* Main Container */}
      <div className="px-4 md:px-0 pb-10">
        <div className="sticky -top-6 z-30 pt-4 pb-3 bg-white dark:bg-[#111827] -mx-6 px-6">
          <div className="flex flex-col md:flex-row items-center bg-white dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 rounded-[12px] shadow-sm focus-within:ring-2 focus-within:ring-[#EA6C00]/10 focus-within:border-[#EA6C00] transition-all p-1.5 min-h-[56px] md:h-14">
            {/* Search Input Section */}
            <div className="flex flex-1 items-center px-3 gap-3 w-full h-full min-h-[44px]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
                className="w-4 h-4 text-gray-400 flex-shrink-0"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                />
              </svg>
              <input
                type="text"
                placeholder="Cari keterangan atau referensi..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="flex-1 bg-transparent border-none focus:ring-0 outline-none text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 font-medium"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setCurrentPage(1);
                  }}
                  className="p-1 text-gray-300 hover:text-gray-500 transition-colors"
                  title="Hapus pencarian"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>

            {/* Divider */}
            <div className="hidden md:block h-6 w-[1px] bg-gray-100 dark:bg-slate-700 mx-1" />

            {/* Category Dropdown */}
            <div className="relative w-full md:w-auto" ref={catFilterRef}>
              <button
                type="button"
                onClick={() => setCatDropdownOpen(!catDropdownOpen)}
                className="flex items-center justify-between md:justify-start gap-2 w-full md:w-auto px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors whitespace-nowrap"
              >
                <span>
                  {category ? category.replace(/_/g, " ") : "Semua Kategori"}
                </span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${catDropdownOpen ? "rotate-180" : ""}`}
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

              {catDropdownOpen && (
                <div className="absolute z-50 right-0 mt-3 w-56 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden flex flex-col p-1.5 animate-in fade-in zoom-in-95 duration-200">
                  <button
                    type="button"
                      onClick={() => {
                        setCategory("");
                        setCurrentPage(1);
                        setCatDropdownOpen(false);
                      }}
                    className={`text-left px-3 py-2 text-sm font-semibold rounded-md transition-colors ${category === "" ? "bg-[#EA6C00] text-white" : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700/50"}`}
                  >
                    Semua Kategori
                  </button>
                  {[
                    "BOOKING_FEE",
                    "DOWN_PAYMENT",
                    "PELUNASAN_CASH",
                    "PENCAIRAN_KPR",
                    "BIAYA_KONSTRUKSI",
                    "BIAYA_MARKETING",
                    "BIAYA_GAJI",
                    "BIAYA_OPERASIONAL",
                    "LAIN_LAIN",
                  ].map((cat) => (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => {
                        setCategory(cat);
                        setCurrentPage(1);
                        setCatDropdownOpen(false);
                      }}
                      className={`text-left px-3 py-2 text-sm font-semibold rounded-md transition-colors ${category === cat ? "bg-[#EA6C00] text-white" : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700/50"}`}
                    >
                      {cat.replace(/_/g, " ")}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="hidden md:block h-6 w-[1px] bg-gray-100 dark:bg-slate-700 mx-1" />

            {/* Project Dropdown */}
            <div className="relative w-full md:w-auto" ref={projFilterRef}>
              <button
                type="button"
                onClick={() => setProjDropdownOpen(!projDropdownOpen)}
                className="flex items-center justify-between md:justify-start gap-2 w-full md:w-auto px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors whitespace-nowrap"
              >
                <span className="truncate max-w-[150px]">
                  {projectFilter
                    ? projects.find((p) => p.id === projectFilter)?.code
                    : "Semua Proyek"}
                </span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`w-3.5 h-3.5 text-gray-400 flex-shrink-0 transition-transform duration-200 ${projDropdownOpen ? "rotate-180" : ""}`}
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

              {projDropdownOpen && (
                <div className="absolute z-50 right-0 mt-3 w-64 max-h-60 overflow-y-auto bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl shadow-xl flex flex-col p-1.5 animate-in fade-in zoom-in-95 duration-200">
                  <button
                    type="button"
                    onClick={() => {
                      setProjectFilter("");
                      setCurrentPage(1);
                      setProjDropdownOpen(false);
                    }}
                    className={`text-left px-3 py-2 text-sm font-semibold rounded-md transition-colors ${projectFilter === "" ? "bg-[#EA6C00] text-white" : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700/50"}`}
                  >
                    Semua Proyek
                  </button>
                  {projects.map((p) => (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => {
                        setProjectFilter(p.id);
                        setCurrentPage(1);
                        setProjDropdownOpen(false);
                      }}
                      className={`text-left px-3 py-2 text-sm font-semibold rounded-md transition-colors ${projectFilter === p.id ? "bg-[#EA6C00] text-white" : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700/50"}`}
                    >
                      {p.code} — {p.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Circular Search Button */}
            <button
              type="submit"
              className="ml-2 w-11 h-11 bg-[#EA6C00] hover:bg-[#C25500] text-white rounded-full transition-all shadow-md shadow-orange-500/20 flex items-center justify-center group flex-shrink-0 mt-2 md:mt-0"
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
        </div>

        {/* Selection Bar */}
        {selectedIds.length > 0 && (
          <div className="mb-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex flex-col md:flex-row items-center justify-between bg-[#FFF0E6] dark:bg-orange-500/10 border border-[#EA6C00] rounded-[10px] p-2.5 md:px-4 md:py-2.5 gap-3 shadow-md shadow-orange-500/5">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-200">
                {selectedIds.length} transaksi dipilih
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <button
                  onClick={() => setSelectedIds([])}
                  className="flex-1 md:flex-none px-6 h-11 bg-white dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 text-[#374151] dark:text-gray-200 text-sm font-bold rounded-[10px] hover:bg-gray-50 dark:hover:bg-slate-700 transition-all active:scale-95 shadow-sm"
                >
                  Batalkan Pilihan
                </button>
                <button
                  onClick={() => setDeleteModal({ show: true, type: "bulk" })}
                  disabled={isDeleting || isPending}
                  className="flex-1 md:flex-none px-6 h-11 bg-[#EF4444] hover:bg-red-600 text-white text-sm font-bold rounded-[10px] shadow-lg shadow-red-500/20 transition-all active:scale-95 disabled:opacity-50"
                >
                  Hapus Terpilih
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Table Container */}
        <div className="bg-white dark:bg-slate-800 border-[0.5px] border-[#E5E7EB] dark:border-slate-700/50 rounded-[14px] shadow-sm overflow-hidden">
          {filteredTransactions.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-16 h-16 bg-gray-50 dark:bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-8 h-8"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                  />
                </svg>
              </div>
              <p className="font-bold text-gray-900 dark:text-white">
                Belum ada transaksi
              </p>
              <p className="text-sm text-gray-400 mt-1 italic">
                Klik &quot;Tambah Transaksi&quot; untuk memulai pencatatan.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse">
                <thead className="bg-[#F9FAFB] dark:bg-slate-700/40">
                  <tr className="border-b border-[#F3F4F6] dark:border-slate-700/50">
                    <th className="px-5 py-4 w-[50px] text-center">
                      <input
                        type="checkbox"
                        checked={
                          selectedIds.length === transactions.length &&
                          transactions.length > 0
                        }
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded text-[#EA6C00] focus:ring-[#EA6C00] border-gray-300 dark:border-slate-600 dark:bg-slate-700 cursor-pointer accent-[#EA6C00]"
                      />
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-widest text-gray-400 w-[120px]">
                      TANGGAL
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-widest text-gray-400 w-[150px]">
                      NO. REFERENSI
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-widest text-gray-400">
                      KETERANGAN
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-widest text-gray-400 w-[120px]">
                      PROYEK
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-widest text-gray-400 w-[160px]">
                      KATEGORI
                    </th>
                    <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-widest text-gray-400 w-[160px]">
                      JUMLAH (RP)
                    </th>
                    <th className="px-5 py-4 text-center text-xs font-bold uppercase tracking-widest text-gray-400 w-[100px]">
                      AKSI
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3F4F6] dark:divide-white/[0.05]">
                  {paginatedTransactions.map((trx, idx) => (
                    <tr
                      key={trx.id}
                      className={`hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors ${selectedIds.includes(trx.id) ? "bg-slate-50/50 dark:bg-slate-700/20" : ""} ${idx === paginatedTransactions.length - 1 ? "border-b-0" : "border-b border-[#F3F4F6] dark:border-slate-700/50"}`}
                    >
                      <td className="px-5 py-4 whitespace-nowrap text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(trx.id)}
                          onChange={() => toggleSelect(trx.id)}
                          className="w-4 h-4 rounded text-[#EA6C00] focus:ring-[#EA6C00] border-gray-300 dark:border-slate-600 dark:bg-slate-700 cursor-pointer accent-[#EA6C00]"
                        />
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-xs font-medium text-gray-500 dark:text-gray-400">
                        {formatDate(trx.date)}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                            {trx.reference}
                          </span>
                          {trx.hasJournal && (
                            <div
                              title="Jurnal Otomatis Terbuat"
                              className="text-green-500 bg-green-50 dark:bg-green-900/30 p-1 rounded-full cursor-help"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={3}
                                stroke="currentColor"
                                className="w-3.5 h-3.5"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="m4.5 12.75 6 6 9-13.5"
                                />
                              </svg>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                            {trx.description}
                          </span>
                          {trx.note && (
                            <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 italic">
                              {trx.note}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm font-semibold text-gray-600 dark:text-gray-400">
                        {trx.projectCode}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <CategoryBadge
                          category={trx.category as TransactionCategory}
                        />
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm font-bold text-[#EA6C00] text-right">
                        {formatRupiah(trx.amount)}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-center text-gray-400">
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={() => setEditId(trx.id)}
                            className="p-1.5 hover:text-[#EA6C00] transition-colors rounded-lg hover:bg-white dark:hover:bg-slate-800"
                            title="Edit"
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
                                d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() =>
                              setDeleteModal({
                                show: true,
                                type: "single",
                                id: trx.id,
                              })
                            }
                            disabled={isDeleting}
                            className="p-1.5 hover:text-red-500 transition-colors rounded-lg hover:bg-white dark:hover:bg-slate-800 disabled:opacity-50"
                            title="Hapus"
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
                                d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                              />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination UI */}
          {filteredTransactions.length > 0 && (
            <div className="px-5 py-4 bg-white dark:bg-slate-800 border-t border-[#F3F4F6] dark:border-slate-700/50 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-500 dark:text-gray-400 order-2 md:order-1">
                Total Transaksi:{" "}
                <span className="font-bold text-gray-900 dark:text-white">
                  {filteredTransactions.length}
                </span>
              </div>

              <div className="flex items-center gap-1 order-1 md:order-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={safeCurrentPage === 1}
                  className="p-2 text-gray-400 hover:text-[#EA6C00] disabled:opacity-30 disabled:hover:text-gray-400 transition-colors"
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
                      safeCurrentPage === page
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
                  disabled={safeCurrentPage === totalPages || totalPages === 0}
                  className="p-2 text-gray-400 hover:text-[#EA6C00] disabled:opacity-30 disabled:hover:text-gray-400 transition-colors"
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
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-[28px] p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200 text-center">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-8 h-8 text-[#EF4444]"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
            </div>

            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {deleteModal.type === "bulk"
                ? `Hapus ${selectedIds.length} Transaksi?`
                : "Hapus Transaksi?"}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-8">
              {deleteModal.type === "bulk"
                ? "Semua transaksi yang dipilih akan dihapus secara permanen dari sistem."
                : "Transaksi ini akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan."}
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setDeleteModal({ show: false, type: "single" })}
                className="px-6 py-3 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 font-bold rounded-2xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-all active:scale-95"
              >
                Batal
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-6 py-3 bg-[#EF4444] text-white font-bold rounded-2xl hover:bg-red-600 transition-all active:scale-95 shadow-lg shadow-red-500/20 disabled:opacity-50"
              >
                {isDeleting ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <AddTransaksiModal
          projects={projects}
          units={units}
          customers={customers}
        />
      )}

      {/* Edit Modal */}
      {editId && transactions.find((t) => t.id === editId) && (
        <EditTransaksiModal
          projects={projects}
          transaction={transactions.find((t) => t.id === editId)}
          onClose={() => setEditId(null)}
        />
      )}
    </div>
  );
}
