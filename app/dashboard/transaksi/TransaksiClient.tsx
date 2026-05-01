"use client";

import React, { useState, useTransition, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteTransaction, deleteTransactions } from "@/app/actions";
import AddTransaksiModal from "./AddTransaksiModal";
import EditTransaksiModal from "./EditTransaksiModal";
import CategoryBadge from "@/components/ui/CategoryBadge";
import { TransactionCategory } from "@prisma/client";
import { useSearchParams } from "next/navigation";

// ─── Toast ────────────────────────────────────────────────────────────────────
type ToastType = "success" | "error";
interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

function ToastContainer({
  toasts,
  remove,
}: {
  toasts: Toast[];
  remove: (id: number) => void;
}) {
  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-semibold text-white min-w-[260px] animate-in slide-in-from-right-5 duration-300 ${
            t.type === "success" ? "bg-emerald-600" : "bg-red-600"
          }`}
        >
          {t.type === "success" ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4 shrink-0"
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
              className="w-4 h-4 shrink-0"
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
            onClick={() => remove(t.id)}
            className="text-white/70 hover:text-white"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-3.5 h-3.5"
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
  );
}

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
  const searchParams = useSearchParams();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  // Toast
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);
  const showToast = React.useCallback(
    (message: string, type: ToastType = "success") => {
      const id = ++toastId.current;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(
        () => setToasts((prev) => prev.filter((t) => t.id !== id)),
        4000,
      );
    },
    [],
  );
  const removeToast = React.useCallback(
    (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id)),
    [],
  );

  // Read URL toast messages
  useEffect(() => {
    const toastMsg = searchParams.get("toast");
    if (toastMsg === "add_success") {
      showToast("Transaksi berhasil ditambahkan", "success");
      window.history.replaceState(null, "", "/dashboard/transaksi");
    } else if (toastMsg === "edit_success") {
      showToast("Transaksi berhasil diperbarui", "success");
      window.history.replaceState(null, "", "/dashboard/transaksi");
    }
  }, [searchParams, showToast]);

  // Local state for real-time filtering
  const [search, setSearch] = useState(initialSearch || "");
  const [category, setCategory] = useState(initialCategory || "");
  const [projectFilter, setProjectFilter] = useState(
    initialProjectFilter || "",
  );
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [fromDateFocused, setFromDateFocused] = useState(false);
  const [toDateFocused, setToDateFocused] = useState(false);

  const hideNativeDateIcon = (
    <style>{`
      input[type="date"]::-webkit-calendar-picker-indicator {
        display: none;
        -webkit-appearance: none;
      }
    `}</style>
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
      if (result?.error) {
        setDeleteError(result.error);
        showToast(result.error, "error");
      } else {
        showToast("Transaksi berhasil dihapus", "error");
        setDeleteModal({ show: false, type: "single" });
      }
    } else if (deleteModal.type === "bulk") {
      const result = await deleteTransactions(selectedIds);
      if (result?.error) {
        setDeleteError(result.error);
        showToast(result.error, "error");
      } else {
        showToast(`${selectedIds.length} transaksi berhasil dihapus`, "error");
        setSelectedIds([]);
        setDeleteModal({ show: false, type: "bulk" });
      }
    }
    
    setIsDeleting(false);
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
    
    const tDate = new Date(t.date);
    tDate.setHours(0, 0, 0, 0);

    let matchesDate = true;
    if (startDate) {
      const sDate = new Date(startDate);
      sDate.setHours(0, 0, 0, 0);
      if (tDate < sDate) matchesDate = false;
    }
    if (endDate) {
      const eDate = new Date(endDate);
      eDate.setHours(23, 59, 59, 999);
      if (tDate > eDate) matchesDate = false;
    }

    return matchesSearch && matchesCategory && matchesProject && matchesDate;
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
    <>
      <ToastContainer toasts={toasts} remove={removeToast} />
      <div className="text-gray-600 dark:text-gray-300 w-full h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 px-4 md:px-0">
        <div>
          <h1 className="page-title dark:text-gray-100">Transaksi</h1>
          <p className="card-subtitle text-gray-400 dark:text-gray-400 mt-2">
            Kelola semua transaksi keuangan
          </p>
        </div>
        <Link
          href="?add=true"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-200 w-full md:w-auto md:ml-auto"
        >
          <img
            src="/add.svg"
            alt="Add"
            className="w-4 h-4 invert dark:invert-0"
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
                placeholder="Cari keterangan atau referensi..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="flex-1 bg-transparent border-none focus:ring-0 outline-none text-sm font-medium text-slate-700 dark:text-slate-200 placeholder:font-normal placeholder:text-slate-400"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setCurrentPage(1);
                  }}
                  className="p-1 text-slate-300 hover:text-slate-500 transition-colors"
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

            {/* Category Dropdown */}
            <div className="w-full md:w-[150px] lg:w-[160px] relative" ref={catFilterRef}>
              <button
                type="button"
                onClick={() => setCatDropdownOpen(!catDropdownOpen)}
                className="w-full h-11 inline-flex items-center justify-between px-3 bg-white dark:bg-slate-800 border-[0.5px] border-[#E5E7EB] dark:border-slate-700 rounded-xl transition-colors"
              >
                <span className="text-sm font-normal text-slate-700 dark:text-slate-200 truncate">
                  {category ? category.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ') : "Semua Kategori"}
                </span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${catDropdownOpen ? "rotate-180" : ""}`}
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
                <div className="absolute z-50 right-0 mt-2 w-56 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden flex flex-col p-1 animate-in fade-in zoom-in-95 duration-200">
                  <button
                    type="button"
                      onClick={() => {
                        setCategory("");
                        setCurrentPage(1);
                        setCatDropdownOpen(false);
                      }}
                    className={`text-left px-3 py-2 text-sm rounded-md transition-colors ${category === "" ? "bg-slate-50 text-slate-900 font-medium dark:bg-slate-700 dark:text-white" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"}`}
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
                      className={`text-left px-3 py-2 text-sm rounded-md transition-colors ${category === cat ? "bg-slate-50 text-slate-900 font-medium dark:bg-slate-700 dark:text-white" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"}`}
                    >
                      {cat.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Project Dropdown */}
            <div className="w-full md:w-[150px] lg:w-[160px] relative" ref={projFilterRef}>
              <button
                type="button"
                onClick={() => setProjDropdownOpen(!projDropdownOpen)}
                className="w-full h-11 inline-flex items-center justify-between px-3 bg-white dark:bg-slate-800 border-[0.5px] border-[#E5E7EB] dark:border-slate-700 rounded-xl transition-colors"
              >
                <span className="text-sm font-normal text-slate-700 dark:text-slate-200 truncate">
                  {projectFilter
                    ? projects.find((p) => p.id === projectFilter)?.code || projects.find((p) => p.id === projectFilter)?.name
                    : "Semua Proyek"}
                </span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${projDropdownOpen ? "rotate-180" : ""}`}
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
                <div className="absolute z-50 right-0 mt-2 w-64 max-h-60 overflow-y-auto bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl shadow-lg flex flex-col p-1 animate-in fade-in zoom-in-95 duration-200">
                  <button
                    type="button"
                    onClick={() => {
                      setProjectFilter("");
                      setCurrentPage(1);
                      setProjDropdownOpen(false);
                    }}
                    className={`text-left px-3 py-2 text-sm rounded-md transition-colors ${projectFilter === "" ? "bg-slate-50 text-slate-900 font-medium dark:bg-slate-700 dark:text-white" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"}`}
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
                      className={`text-left px-3 py-2 text-sm rounded-md transition-colors ${projectFilter === p.id ? "bg-slate-50 text-slate-900 font-medium dark:bg-slate-700 dark:text-white" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"}`}
                    >
                      {p.code} — {p.name}
                    </button>
                  ))}
                </div>
              )}
            </div>


          </div>
        </div>

        {/* Selection Bar */}
        {selectedIds.length > 0 && (
          <div className="mt-2 mb-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex flex-col md:flex-row items-center justify-between bg-[#FFF0E6] dark:bg-orange-500/10 border border-[#EA6C00] rounded-xl p-2 md:px-4 md:py-2 gap-3 shadow-sm">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-200">
                {selectedIds.length} transaksi dipilih
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <button
                  onClick={() => setSelectedIds([])}
                  className="flex-1 md:flex-none px-4 h-9 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95 shadow-sm"
                >
                  Batalkan Pilihan
                </button>
                <button
                  onClick={() => setDeleteModal({ show: true, type: "bulk" })}
                  disabled={isDeleting || isPending}
                  className="flex-1 md:flex-none px-4 h-9 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-lg shadow-sm shadow-red-500/20 transition-all active:scale-95 disabled:opacity-50"
                >
                  Hapus Terpilih
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Table Container */}
        <div className="bg-white dark:bg-slate-800 border-[0.5px] border-[#E5E7EB] dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
          {filteredTransactions.length === 0 ? (
            <div className="py-55 px-16 text-center">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800/80 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                <img
                  src="/credit_card.svg"
                  alt="Transaksi"
                  className="w-10 h-10 opacity-20 grayscale dark:invert"
                />
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
                <thead className="bg-slate-50 dark:bg-slate-800/50">
                  <tr className="border-b border-slate-100 dark:border-slate-700/50">
                    <th className="px-5 py-3.5 w-[50px] text-center">
                      <input
                        type="checkbox"
                        checked={
                          selectedIds.length === transactions.length &&
                          transactions.length > 0
                        }
                        onChange={toggleSelectAll}
                        className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-100 dark:border-slate-600 dark:bg-slate-700 cursor-pointer"
                      />
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400 w-[120px]">
                      TANGGAL
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400 w-[150px]">
                      NO. REFERENSI
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
                      KETERANGAN
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400 w-[120px]">
                      PROYEK
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400 w-[160px]">
                      KATEGORI
                    </th>
                    <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400 w-[160px]">
                      JUMLAH (RP)
                    </th>
                    <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400 w-[100px]">
                      AKSI
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {paginatedTransactions.map((trx, idx) => (
                    <tr
                      key={trx.id}
                      className={`hover:bg-slate-50/60 dark:hover:bg-slate-700/30 transition-colors ${selectedIds.includes(trx.id) ? "bg-slate-50/60 dark:bg-slate-700/30" : ""} ${idx === paginatedTransactions.length - 1 ? "border-b-0" : "border-b border-slate-100 dark:border-slate-700/50"}`}
                    >
                      <td className="px-5 py-3.5 whitespace-nowrap text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(trx.id)}
                          onChange={() => toggleSelect(trx.id)}
                          className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-100 dark:border-slate-600 dark:bg-slate-700 cursor-pointer"
                        />
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-sm font-medium text-slate-500 dark:text-slate-400">
                        {formatDate(trx.date)}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">
                          {trx.reference}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-slate-900 dark:text-white">
                            {trx.description}
                          </span>
                          {trx.note && (
                            <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 italic">
                              {trx.note}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-sm font-medium text-slate-600 dark:text-slate-400">
                        {trx.projectCode}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <CategoryBadge
                          category={trx.category as TransactionCategory}
                        />
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-sm font-semibold text-slate-900 dark:text-white tabular-nums text-right">
                        {formatRupiah(trx.amount)}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setEditId(trx.id)}
                            className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
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
                            className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors disabled:opacity-50"
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
            <div className="px-5 py-3.5 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700/50 flex flex-col md:flex-row items-center justify-between gap-4 rounded-b-2xl">
              <div className="text-sm text-slate-500 dark:text-slate-400 order-2 md:order-1">
                Total Transaksi:{" "}
                <span className="font-semibold text-slate-900 dark:text-white">
                  {filteredTransactions.length}
                </span>
              </div>

              <div className="flex items-center gap-1 order-1 md:order-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={safeCurrentPage === 1}
                  className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:text-slate-400 disabled:hover:bg-transparent transition-colors"
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
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={safeCurrentPage === totalPages || totalPages === 0}
                  className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:text-slate-400 disabled:hover:bg-transparent transition-colors"
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
                      d="M8.25 4.5l7.5 7.5-7.5 7.5"
                    />
                  </svg>
                </button>
              </div>

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
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${itemsPerPageOpen ? "rotate-180" : ""}`}
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
                    <div className="absolute z-50 bottom-full right-0 mb-2 w-[70px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[10px] shadow-lg overflow-hidden flex flex-col p-1 animate-in slide-in-from-bottom-2 duration-200">
                      {[5, 10, 20, 50].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => {
                            setItemsPerPage(val);
                            setCurrentPage(1);
                            setItemsPerPageOpen(false);
                          }}
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
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200 text-center">
            <div className="flex items-center justify-center w-20 h-20 rounded-full bg-red-50 dark:bg-red-900/20 mx-auto mb-6 shadow-inner">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-10 h-10 text-red-500"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
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
                : "Transaksi ini akan dihapus secara permanen."}
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal({ show: false, type: "single" })}
                className="flex-1 h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex-1 h-12 px-4 rounded-xl bg-red-500 text-sm font-semibold text-white hover:bg-red-600 shadow-sm shadow-red-500/20 transition-all active:scale-[0.98] disabled:opacity-50"
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
    </>
  );
}
