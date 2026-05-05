"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import StatusBadge from "@/components/ui/StatusBadge";
import UnitDetailModal from "../unit/UnitDetailModal";

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
          className={`pointer-events-auto flex items-center gap-3 px-6 py-3.5 rounded-full shadow-2xl text-sm font-semibold text-white min-w-[280px] animate-in slide-in-from-right-5 duration-300 ${
            t.type === "success" ? "bg-[#00945E]" : "bg-red-600"
          }`}
        >
          {t.type === "success" ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m4.5 12.75 6 6 9-13.5"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
              />
            </svg>
          )}
          <span className="flex-1">{t.message}</span>
          <button
            onClick={() => remove(t.id)}
            className="p-1 hover:bg-white/20 rounded-lg transition-colors"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Common class strings ─────────────────────────────────────────────────────
const inputCls =
  "w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 form-input text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all shadow-sm";
const selectCls =
  "w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 form-input text-slate-900 dark:text-white focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all shadow-sm appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20d%3D%22m19.5%208.25-7.5%207.5-7.5-7.5%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_1rem_center] bg-no-repeat";
const labelCls = "form-label text-slate-800 dark:text-slate-300 mb-2 block";

interface EditCustomerForm {
  name: string;
  phone: string;
  email: string;
  address: string;
  bankName: string;
  kprAccountNo: string;
  kprAmount: string;
  kprTenor: string;
  kprAkadDate: string;
}

export default function PelangganClient({
  initialData,
  currentRole,
}: {
  initialData: any[];
  currentRole: "ADMIN" | "AKUNTAN";
}) {
  const [customers, setCustomers] = useState(initialData);
  const [searchTerm, setSearchTerm] = useState("");
  const [unitFilter, setUnitFilter] = useState("SEMUA");
  const [paymentFilter, setPaymentFilter] = useState("SEMUA");
  const [showModal, setShowModal] = useState(false);
  const [unitDropdownOpen, setUnitDropdownOpen] = useState(false);
  const [payDropdownOpen, setPayDropdownOpen] = useState(false);
  const [itemsPerPageOpen, setItemsPerPageOpen] = useState(false);
  const [detailCustomer, setDetailCustomer] = useState<any>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [openActionId, setOpenActionId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const unitFilterRef = useRef<HTMLDivElement>(null);
  const payFilterRef = useRef<HTMLDivElement>(null);
  const itemsPerPageRef = useRef<HTMLDivElement>(null);
  const actionMenuRef = useRef<HTMLDivElement>(null);
  const modalPayRef = useRef<HTMLDivElement>(null);

  const [modalPayOpen, setModalPayOpen] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [editCustomer, setEditCustomer] = useState<any | null>(null);
  const [editForm, setEditForm] = useState<EditCustomerForm>({
    name: "",
    phone: "",
    email: "",
    address: "",
    bankName: "",
    kprAccountNo: "",
    kprAmount: "",
    kprTenor: "",
    kprAkadDate: "",
  });
  const [editErrors, setEditErrors] = useState<Partial<EditCustomerForm>>({});

  const [deletePermanentCustomer, setDeletePermanentCustomer] = useState<
    any | null
  >(null);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    nik: "",
    phone: "",
    email: "",
    address: "",
    paymentMethod: "CASH",
    bankName: "",
    kprAccountNo: "",
    kprAmount: "",
    kprTenor: "",
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Toast
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);
  const showToast = useCallback(
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
  const removeToast = useCallback(
    (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id)),
    [],
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        unitFilterRef.current &&
        !unitFilterRef.current.contains(event.target as Node)
      ) {
        setUnitDropdownOpen(false);
      }
      if (
        payFilterRef.current &&
        !payFilterRef.current.contains(event.target as Node)
      ) {
        setPayDropdownOpen(false);
      }
      if (
        itemsPerPageRef.current &&
        !itemsPerPageRef.current.contains(event.target as Node)
      ) {
        setItemsPerPageOpen(false);
      }
      if (
        actionMenuRef.current &&
        !actionMenuRef.current.contains(event.target as Node)
      ) {
        setOpenActionId(null);
      }
      if (
        modalPayRef.current &&
        !modalPayRef.current.contains(event.target as Node)
      ) {
        setModalPayOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.nik.includes(searchTerm) ||
      c.customerCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPayment =
      paymentFilter === "SEMUA" || c.paymentMethod === paymentFilter;
    const matchesUnit =
      unitFilter === "SEMUA" ||
      (unitFilter === "ADA_UNIT" && Boolean(c.unit)) ||
      (unitFilter === "TANPA_UNIT" && !c.unit);
    return matchesSearch && matchesUnit && matchesPayment;
  });

  // Reset to page 1 on filter
  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds([]);
  }, [searchTerm, unitFilter, paymentFilter]);

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCustomers = filteredCustomers.slice(
    startIndex,
    startIndex + itemsPerPage,
  );
  const currentPageIds = paginatedCustomers.map((c) => c.id);
  const isCurrentPageSelected =
    currentPageIds.length > 0 &&
    currentPageIds.every((id) => selectedIds.includes(id));

  const toggleSelectAll = () => {
    if (isCurrentPageSelected) {
      setSelectedIds((prev) =>
        prev.filter((id) => !currentPageIds.includes(id)),
      );
    } else {
      setSelectedIds((prev) =>
        Array.from(new Set([...prev, ...currentPageIds])),
      );
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

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

  // ─── Add Customer ──────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          kprAmount: formData.kprAmount ? parseFloat(formData.kprAmount) : null,
          kprTenor: formData.kprTenor ? parseInt(formData.kprTenor) : null,
        }),
      });
      const result = await response.json();
      if (result.success) {
        setShowModal(false);
        showToast("Pelanggan berhasil ditambahkan");
        router.refresh();
        window.location.reload();
      } else {
        showToast(result.message, "error");
      }
    } catch {
      showToast("Terjadi kesalahan sistem", "error");
    } finally {
      setLoading(false);
    }
  };

  // ─── Edit Customer ─────────────────────────────────────────────────────────
  const openEditModal = (c: any) => {
    setEditCustomer(c);
    setEditErrors({});
    setEditForm({
      name: c.name,
      phone: c.phone,
      email: c.email || "",
      address: c.address,
      bankName: c.bankName || "",
      kprAccountNo: c.kprAccountNo || "",
      kprAmount: c.kprAmount ? String(c.kprAmount) : "",
      kprTenor: c.kprTenor ? String(c.kprTenor) : "",
      kprAkadDate: c.kprAkadDate ? c.kprAkadDate.split("T")[0] : "",
    });
  };

  const validateEditForm = (): boolean => {
    const errs: Partial<EditCustomerForm> = {};
    if (!editForm.name.trim()) errs.name = "Nama wajib diisi";
    const phoneRegex = /^(\+628|08)\d{8,12}$/;
    if (!phoneRegex.test(editForm.phone))
      errs.phone = "Format: 08xx atau +628xx, minimal 10 digit";
    if (editForm.email && editForm.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(editForm.email))
        errs.email = "Format email tidak valid";
    }
    if (!editForm.address.trim()) errs.address = "Alamat wajib diisi";
    if (editCustomer?.paymentMethod === "KPR") {
      if (!editForm.kprAmount || parseFloat(editForm.kprAmount) <= 0)
        errs.kprAmount = "Plafon harus angka positif";
      if (
        !editForm.kprTenor ||
        parseInt(editForm.kprTenor) <= 0 ||
        parseInt(editForm.kprTenor) > 360
      )
        errs.kprTenor = "Tenor 1-360 bulan";
    }
    setEditErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleEditCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCustomer || !validateEditForm()) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/customers/${editCustomer.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const result = await response.json();
      if (result.success) {
        setEditCustomer(null);
        setCustomers((prev) =>
          prev.map((c) => (c.id === result.data.id ? result.data : c)),
        );
        showToast("Data pelanggan berhasil diperbarui");
      } else {
        showToast(result.message, "error");
      }
    } catch {
      showToast("Terjadi kesalahan sistem", "error");
    } finally {
      setLoading(false);
    }
  };

  const handlePermanentDelete = async () => {
    if (!deletePermanentCustomer) return;
    setLoading(true);
    try {
      const response = await fetch(
        `/api/customers/${deletePermanentCustomer.id}`,
        {
          method: "DELETE",
        },
      );
      const result = await response.json();
      if (result.success) {
        const deletedId = deletePermanentCustomer.id;
        setDeletePermanentCustomer(null);
        setCustomers((prev) => prev.filter((c) => c.id !== deletedId));
        setSelectedIds((prev) => prev.filter((id) => id !== deletedId));
        showToast("Pelanggan berhasil dihapus", "error");
      } else {
        showToast(result.message, "error");
        setDeletePermanentCustomer(null);
      }
    } catch {
      showToast("Terjadi kesalahan sistem", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/customers", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });
      const result = await response.json();
      if (result.success) {
        setCustomers((prev) => prev.filter((c) => !selectedIds.includes(c.id)));
        setSelectedIds([]);
        setShowBulkDeleteModal(false);
        showToast(result.message, "error");
      } else {
        showToast(result.message, "error");
      }
    } catch {
      showToast("Terjadi kesalahan sistem", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ToastContainer toasts={toasts} remove={removeToast} />

      <div className="text-gray-600 dark:text-gray-300 w-full h-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 px-4 md:px-0">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Master Pelanggan
            </h1>
            <p className="card-subtitle text-gray-400 dark:text-gray-400 mt-2">
              Kelola data pelanggan dan metode pembayaran
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-orange-500/20 transition-all hover:bg-orange-600 active:scale-[0.98] w-full md:w-auto md:ml-auto"
          >
            <img
              src="/add.svg"
              alt="Add"
              className="w-4 h-4 invert dark:invert-0"
            />
            Tambah Pelanggan
          </button>
        </div>

        <div className="px-4 md:px-0 pb-10">
          {/* Filter bar - Modernized style */}
          <div className="sticky -top-6 z-30 pt-2 pb-3 bg-white dark:bg-[#111827] -mx-6 px-6 no-print mb-3">
            <div className="flex flex-col md:flex-row flex-wrap items-center gap-3 w-full">
              <div className="flex-1 min-w-[240px] h-11 inline-flex items-center gap-3 rounded-xl border-[0.5px] border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 transition-all hover:border-slate-400 focus-within:ring-2 focus-within:ring-slate-100 dark:focus-within:ring-slate-800/30">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-4 h-4 text-slate-400 shrink-0"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Cari nama, NIK, atau kode..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 bg-transparent border-none focus:ring-0 outline-none text-sm font-medium text-slate-700 dark:text-slate-200 placeholder:font-normal placeholder:text-slate-400"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
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
              <div className="contents">
                {/* Unit filter */}
                <div
                  className="w-full md:w-[140px] lg:w-[150px] relative"
                  ref={unitFilterRef}
                >
                  <button
                    type="button"
                    onClick={() => setUnitDropdownOpen(!unitDropdownOpen)}
                    className="w-full h-11 inline-flex items-center justify-between px-4 bg-white dark:bg-slate-800 border-[0.5px] border-slate-200 dark:border-slate-700 rounded-xl transition-all hover:border-slate-400 focus:ring-4 focus:ring-slate-100 dark:focus:ring-slate-800/20"
                  >
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                      {unitFilter === "SEMUA"
                        ? "Semua Unit"
                        : unitFilter === "ADA_UNIT"
                          ? "Ada Unit"
                          : "Tanpa Unit"}
                    </span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${unitDropdownOpen ? "rotate-180" : ""}`}
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
                  {unitDropdownOpen && (
                    <div className="absolute z-50 right-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden flex flex-col p-1.5 animate-in fade-in zoom-in-95 duration-200">
                      {[
                        { val: "SEMUA", label: "Semua Unit" },
                        { val: "ADA_UNIT", label: "Ada Unit" },
                        { val: "TANPA_UNIT", label: "Tanpa Unit" },
                      ].map((opt) => (
                        <button
                          key={opt.val}
                          onClick={() => {
                            setUnitFilter(opt.val);
                            setUnitDropdownOpen(false);
                          }}
                          className={`text-left px-3 py-2.5 text-sm rounded-lg transition-colors ${unitFilter === opt.val ? "bg-slate-50 text-slate-900 font-bold dark:bg-slate-700/50 dark:text-white" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/30"}`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {/* Payment filter */}
                <div
                  className="w-full md:w-[150px] lg:w-[160px] relative"
                  ref={payFilterRef}
                >
                  <button
                    type="button"
                    onClick={() => setPayDropdownOpen(!payDropdownOpen)}
                    className="w-full h-11 inline-flex items-center justify-between px-4 bg-white dark:bg-slate-800 border-[0.5px] border-slate-200 dark:border-slate-700 rounded-xl transition-all hover:border-slate-400 focus:ring-4 focus:ring-slate-100 dark:focus:ring-slate-800/20"
                  >
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                      {paymentFilter === "SEMUA"
                        ? "Semua Metode"
                        : paymentFilter === "CASH"
                          ? "CASH KERAS"
                          : "KPR"}
                    </span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${payDropdownOpen ? "rotate-180" : ""}`}
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
                  {payDropdownOpen && (
                    <div className="absolute z-50 right-0 mt-2 w-56 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden flex flex-col p-1.5 animate-in fade-in zoom-in-95 duration-200">
                      {[
                        { val: "SEMUA", label: "Semua Metode" },
                        { val: "CASH", label: "CASH KERAS" },
                        { val: "KPR", label: "KPR" },
                      ].map((opt) => (
                        <button
                          key={opt.val}
                          onClick={() => {
                            setPaymentFilter(opt.val);
                            setPayDropdownOpen(false);
                          }}
                          className={`text-left px-3 py-2.5 text-sm rounded-lg transition-colors ${paymentFilter === opt.val ? "bg-slate-50 text-slate-900 font-bold dark:bg-slate-700/50 dark:text-white" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/30"}`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {selectedIds.length > 0 && (
            <div className="mt-2 mb-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex flex-col md:flex-row items-center justify-between bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/30 rounded-xl p-2 md:px-4 md:py-2 gap-3 shadow-sm">
                <div className="text-sm font-medium text-orange-800 dark:text-orange-200 flex items-center gap-2">
                  {selectedIds.length} pelanggan dipilih
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <button
                    onClick={() => setSelectedIds([])}
                    className="flex-1 md:flex-none px-4 h-9 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95 shadow-sm"
                  >
                    Batalkan Pilihan
                  </button>
                  {currentRole === "ADMIN" && (
                    <button
                      onClick={() => {
                        const hasUnit = customers.some(
                          (c) => selectedIds.includes(c.id) && c.unit,
                        );
                        if (hasUnit) {
                          showToast(
                            "Beberapa pelanggan yang dipilih sudah memiliki unit dan tidak dapat dihapus sekaligus.",
                            "error",
                          );
                        } else {
                          setShowBulkDeleteModal(true);
                        }
                      }}
                      className="flex-1 md:flex-none px-4 h-9 bg-orange-600 text-white text-sm font-semibold rounded-lg hover:bg-orange-700 transition-all active:scale-95 shadow-sm shadow-orange-500/20 flex items-center justify-center gap-2"
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
                          d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                        />
                      </svg>
                      Hapus Terpilih
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Table Container */}
          <div className="bg-white dark:bg-slate-800 border-[0.5px] border-[#E5E7EB] dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead
                  className={`bg-slate-50 dark:bg-slate-800/50 sticky top-0 z-10 ${paginatedCustomers.length === 0 ? "hidden" : ""}`}
                >
                  <tr className="border-b border-slate-100 dark:border-slate-700/50">
                    <th className="px-5 py-3.5 w-[50px] text-center">
                      <input
                        type="checkbox"
                        checked={isCurrentPageSelected}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-100 dark:border-slate-600 dark:bg-slate-700 cursor-pointer"
                      />
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400 w-[130px]">
                      KODE
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
                      NAMA & KONTAK
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400 w-[200px]">
                      NIK
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400 w-[130px]">
                      METODE
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400 w-[170px]">
                      UNIT TERKAIT
                    </th>
                    <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400 w-[120px]">
                      AKSI
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {paginatedCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-50 px-16 text-center">
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
                              d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                            />
                          </svg>
                        </div>
                        <p className="font-bold text-slate-900 dark:text-white">
                          Belum ada data pelanggan
                        </p>
                        <p className="text-sm text-slate-400 mt-1 italic">
                          Coba ubah filter atau tambahkan pelanggan baru.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    paginatedCustomers.map((c, idx) => (
                      <tr
                        key={c.id}
                        className={`hover:bg-slate-50/60 dark:hover:bg-slate-700/30 transition-colors ${selectedIds.includes(c.id) ? "bg-slate-50/60 dark:bg-slate-700/30" : ""} ${idx === paginatedCustomers.length - 1 ? "border-b-0" : "border-b border-slate-100 dark:border-slate-700/50"}`}
                      >
                        <td className="px-5 py-3.5 whitespace-nowrap text-center">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(c.id)}
                            onChange={() => toggleSelect(c.id)}
                            className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-100 dark:border-slate-600 dark:bg-slate-700 cursor-pointer"
                          />
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className="text-sm font-semibold text-slate-900 dark:text-white">
                            {c.customerCode}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-slate-900 dark:text-white">
                              {c.name}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              {c.phone}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">
                          {c.nik}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <StatusBadge
                            status={c.paymentMethod}
                            variant="METODE_PEMBAYARAN"
                            size="sm"
                          />
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          {c.unit ? (
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                              <button
                                onClick={() => setSelectedUnitId(c.unit.id)}
                                className="text-sm font-semibold text-slate-900 dark:text-white hover:text-orange-600 dark:hover:text-orange-500 transition-colors"
                              >
                                {c.unit.unitCode}
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 dark:text-slate-500 italic uppercase tracking-[0.06em] font-medium">
                              Tanpa Unit
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-center">
                          <div
                            className="relative inline-flex justify-center"
                            ref={openActionId === c.id ? actionMenuRef : null}
                          >
                            <button
                              type="button"
                              onClick={() =>
                                setOpenActionId((prev) =>
                                  prev === c.id ? null : c.id,
                                )
                              }
                              className={`w-8 h-8 inline-flex items-center justify-center rounded-lg transition-colors ${
                                openActionId === c.id
                                  ? "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-white"
                                  : "text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                              }`}
                              title="Aksi"
                            >
                              <span className="text-lg leading-none -mt-1">
                                ...
                              </span>
                            </button>
                            {openActionId === c.id && (
                              <div
                                className={`absolute right-0 z-50 w-48 rounded-xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-1.5 shadow-xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150 ${
                                  idx >= paginatedCustomers.length - 2
                                    ? "bottom-9"
                                    : "top-9"
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    openEditModal(c);
                                    setOpenActionId(null);
                                  }}
                                  className="w-full inline-flex items-center gap-3 text-left px-3 py-2.5 text-sm rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                                >
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
                                      d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                                    />
                                  </svg>
                                  <span className="font-medium">
                                    Edit Pelanggan
                                  </span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDetailCustomer(c);
                                    setOpenActionId(null);
                                  }}
                                  className="w-full inline-flex items-center gap-3 text-left px-3 py-2.5 text-sm rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                                >
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
                                      d="M2.036 12.322a1.012 1.012 0 0 1 0-.644m17.928 0a1.012 1.012 0 0 1 0 .644M12 18.75c-4.478 0-8.268-2.943-9.542-7a10.025 10.025 0 0 1 9.542-7c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 0 1-9.542 7ZM12 15.75a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z"
                                    />
                                  </svg>
                                  <span className="font-medium">Detail</span>
                                </button>
                                {currentRole === "ADMIN" && (
                                  <div className="mt-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-700">
                                    <button
                                      type="button"
                                      disabled={Boolean(c.unit)}
                                      onClick={() => {
                                        setDeletePermanentCustomer(c);
                                        setOpenActionId(null);
                                      }}
                                      className={`w-full inline-flex items-center gap-3 text-left px-3 py-2.5 text-sm rounded-lg transition-colors ${c.unit ? "text-slate-300 dark:text-slate-600 cursor-not-allowed" : "text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30"}`}
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
                                          d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                                        />
                                      </svg>
                                      <span className="font-medium">
                                        Hapus Data
                                      </span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination UI - Modernized */}
            {filteredCustomers.length > 0 && (
              <div className="px-5 py-3.5 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700/50 flex flex-col md:flex-row items-center justify-between gap-4 rounded-b-2xl">
                <div className="text-sm text-slate-500 dark:text-slate-400 order-2 md:order-1">
                  Total Pelanggan:{" "}
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {filteredCustomers.length}
                  </span>
                </div>

                <div className="flex items-center gap-1 order-1 md:order-2">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
                    disabled={currentPage === 1}
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
                        currentPage === page
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
                    disabled={currentPage === totalPages || totalPages === 0}
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
                                ? "bg-slate-50 text-slate-900 font-bold dark:bg-slate-700/50 dark:text-white"
                                : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/30"
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
      </div>

      {/* Bulk Delete Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl w-full max-w-[400px] overflow-hidden p-8 flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-10 h-10 text-rose-500"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white text-center mb-2">
              Hapus {selectedIds.length} Pelanggan?
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-center mb-8">
              Data yang dipilih akan dihapus secara permanen.
            </p>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setShowBulkDeleteModal(false)}
                className="flex-1 h-12 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-[0.98]"
              >
                Batal
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={loading}
                className="flex-1 h-12 rounded-xl bg-rose-500 text-white font-semibold hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "Ya, Hapus"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── ADD PELANGGAN MODAL ──────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-700 max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-[#F3F4F6] dark:border-slate-700 shrink-0">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">
                Tambah Pelanggan Baru
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-slate-400 hover:text-orange-500 dark:hover:text-orange-500 transition-colors rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <div className="flex-1 overflow-y-auto p-6 space-y-6 subtle-scrollbar">
                <div className="flex flex-col gap-6">
                  <div>
                    <label className={labelCls}>Nama Lengkap *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className={inputCls}
                      placeholder="Masukkan nama..."
                    />
                  </div>
                  <div>
                    <label className={labelCls}>NIK (16 Digit) *</label>
                    <input
                      type="text"
                      required
                      pattern="\d{16}"
                      title="NIK harus 16 digit angka"
                      value={formData.nik}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          nik: e.target.value.replace(/\D/g, "").slice(0, 16),
                        })
                      }
                      className={inputCls}
                      placeholder="0000000000000000"
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Nomor HP *</label>
                    <input
                      type="text"
                      required
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className={inputCls}
                      placeholder="08..."
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Email (opsional)</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className={inputCls}
                      placeholder="email@example.com"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelCls}>Alamat Lengkap *</label>
                    <textarea
                      required
                      rows={3}
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                      className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-white focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all placeholder-slate-400 shadow-sm"
                      placeholder="Masukkan alamat lengkap..."
                    />
                  </div>
                  <div className="md:col-span-2 pt-6 border-t border-slate-100 dark:border-slate-700/50">
                    <h3 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-[2px] mb-6 flex items-center gap-3">
                      <div className="w-1.5 h-4 bg-orange-500 rounded-full" />
                      Informasi Pembayaran
                    </h3>
                    <div className="relative" ref={modalPayRef}>
                      <label className={labelCls}>Metode Pembayaran *</label>
                      <button
                        type="button"
                        onClick={() => setModalPayOpen(!modalPayOpen)}
                        className={`${selectCls} text-left flex items-center justify-between transition-all hover:border-slate-400`}
                      >
                        <span
                          className={
                            formData.paymentMethod
                              ? "text-slate-900 dark:text-white"
                              : "text-slate-400"
                          }
                        >
                          {formData.paymentMethod === "CASH"
                            ? "CASH KERAS"
                            : formData.paymentMethod === "KPR"
                              ? "KPR"
                              : "Pilih Metode..."}
                        </span>
                      </button>

                      {modalPayOpen && (
                        <div className="absolute z-[60] left-0 mt-2 w-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-2xl p-2 animate-in fade-in zoom-in-95 duration-200">
                          {[
                            { val: "CASH", label: "CASH KERAS" },
                            { val: "KPR", label: "KPR" },
                          ].map((opt) => (
                            <button
                              key={opt.val}
                              type="button"
                              onClick={() => {
                                setFormData({
                                  ...formData,
                                  paymentMethod: opt.val,
                                });
                                setModalPayOpen(false);
                              }}
                              className={`w-full text-left px-4 py-3 text-sm rounded-xl transition-all ${
                                formData.paymentMethod === opt.val
                                  ? "bg-slate-50 text-slate-900 font-bold dark:bg-slate-700 dark:text-white"
                                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  {formData.paymentMethod === "KPR" && (
                    <div className="md:col-span-1 grid grid-cols-1 gap-6 pt-6 border-t border-slate-100 dark:border-slate-700/50">
                      <div>
                        <label className={labelCls}>Nama Bank</label>
                        <input
                          type="text"
                          value={formData.bankName}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              bankName: e.target.value,
                            })
                          }
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className={labelCls}>Plafon (Rp)</label>
                        <input
                          type="number"
                          value={formData.kprAmount}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              kprAmount: e.target.value,
                            })
                          }
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className={labelCls}>Tenor (Bln)</label>
                        <input
                          type="number"
                          value={formData.kprTenor}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              kprTenor: e.target.value,
                            })
                          }
                          className={inputCls}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {/* Footer */}
              <div className="flex justify-end gap-3 p-6 border-t border-[#F3F4F6] dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-[10px] hover:bg-slate-50 dark:hover:bg-slate-600 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 text-sm font-bold text-white bg-[#EA6C00] hover:bg-[#C25500] rounded-[10px] shadow-md shadow-orange-500/20 transition-all active:scale-95 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="flex items-center gap-2 text-white">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Menyimpan...
                    </div>
                  ) : (
                    "Simpan Pelanggan"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── EDIT PELANGGAN MODAL ─────────────────────────────────────────────── */}
      {editCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-700 max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-[#F3F4F6] dark:border-slate-700 shrink-0">
              <div className="min-w-0">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight truncate">
                  Edit Pelanggan
                </h2>
                <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                  Perbarui data {editCustomer.name}
                </p>
              </div>
              <button
                onClick={() => setEditCustomer(null)}
                className="p-2 text-slate-400 hover:text-orange-500 dark:hover:text-orange-500 transition-colors rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form
              onSubmit={handleEditCustomer}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <div className="flex-1 overflow-y-auto p-6 space-y-6 subtle-scrollbar">
                {/* Read-only section */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-6 space-y-6">
                  <h3 className="text-[11px] font-black uppercase tracking-[2px] text-slate-400 dark:text-slate-500">
                    Informasi Read-only
                  </h3>

                  <div className="flex flex-col gap-6">
                    {/* Kode Pelanggan */}
                    <div className="flex flex-col">
                      <label className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">
                        Kode Pelanggan
                      </label>
                      <div className="h-14 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 flex items-center text-sm text-slate-700 dark:text-slate-300 shadow-sm">
                        {editCustomer.customerCode}
                      </div>
                    </div>

                    {/* NIK */}
                    <div className="flex flex-col">
                      <label className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">
                        NIK
                      </label>
                      <div className="h-14 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 flex items-center text-sm text-slate-700 dark:text-slate-300 shadow-sm">
                        {editCustomer.nik}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-5">
                        NIK tidak dapat diubah. Hubungi admin jika terjadi
                        kesalahan.
                      </p>
                    </div>

                    {/* Unit Terkait */}
                    {editCustomer.unit && (
                      <div className="flex flex-col">
                        <label className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">
                          Unit Terkait
                        </label>
                        <div className="h-14 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 flex items-center text-sm text-slate-700 dark:text-slate-300 shadow-sm">
                          {editCustomer.unit.unitCode}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-5">
                          Kelola unit melalui halaman Master Unit.
                        </p>
                      </div>
                    )}

                    {/* Metode Pembayaran */}
                    <div className="flex flex-col">
                      <label className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">
                        Metode Pembayaran
                      </label>
                      <div className="h-14 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 flex items-center justify-between text-sm text-slate-700 dark:text-slate-300 shadow-sm">
                        <span>
                          {editCustomer.paymentMethod === "CASH"
                            ? "CASH KERAS"
                            : "KPR"}
                        </span>
                        <StatusBadge
                          status={editCustomer.paymentMethod}
                          variant="METODE_PEMBAYARAN"
                          size="sm"
                        />
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-5">
                        Metode pembayaran tidak dapat diubah setelah transaksi
                        berjalan.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-6">
                  <div>
                    <label className={labelCls}>Nama Lengkap *</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) =>
                        setEditForm({ ...editForm, name: e.target.value })
                      }
                      className={`${inputCls} ${editErrors.name ? "border-red-400" : ""}`}
                      placeholder="Nama pelanggan..."
                    />
                    {editErrors.name && (
                      <p className="text-xs text-red-500 mt-1">
                        {editErrors.name}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className={labelCls}>Nomor HP *</label>
                    <input
                      type="text"
                      value={editForm.phone}
                      onChange={(e) =>
                        setEditForm({ ...editForm, phone: e.target.value })
                      }
                      className={`${inputCls} ${editErrors.phone ? "border-red-400" : ""}`}
                      placeholder="08..."
                    />
                    {editErrors.phone && (
                      <p className="text-xs text-red-500 mt-1">
                        {editErrors.phone}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className={labelCls}>Email (opsional)</label>
                    <input
                      type="text"
                      value={editForm.email}
                      onChange={(e) =>
                        setEditForm({ ...editForm, email: e.target.value })
                      }
                      className={`${inputCls} ${editErrors.email ? "border-red-400" : ""}`}
                      placeholder="email@example.com"
                    />
                    {editErrors.email && (
                      <p className="text-xs text-red-500 mt-1">
                        {editErrors.email}
                      </p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelCls}>Alamat Lengkap *</label>
                    <textarea
                      rows={2}
                      value={editForm.address}
                      onChange={(e) =>
                        setEditForm({ ...editForm, address: e.target.value })
                      }
                      className={`w-full min-h-[88px] px-4 py-3 rounded-xl border bg-white text-sm text-slate-900 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all placeholder:text-slate-400 ${editErrors.address ? "border-red-400" : "border-slate-200"}`}
                      placeholder="Alamat lengkap..."
                    />
                    {editErrors.address && (
                      <p className="text-xs text-red-500 mt-1">
                        {editErrors.address}
                      </p>
                    )}
                  </div>
                </div>

                {/* KPR fields */}
                {editCustomer.paymentMethod === "KPR" && (
                  <div className="border-t border-gray-100 dark:border-slate-700 pt-4">
                    <h3 className="text-xs font-black text-gray-900 dark:text-gray-100 uppercase tracking-[2px] mb-4 flex items-center gap-2">
                      <div className="w-1.5 h-4 bg-blue-500 rounded-full" />
                      Informasi KPR
                    </h3>
                    <div className="grid grid-cols-1 gap-6">
                      <div>
                        <label className={labelCls}>Nama Bank</label>
                        <input
                          type="text"
                          value={editForm.bankName}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              bankName: e.target.value,
                            })
                          }
                          className={inputCls}
                          placeholder="BCA, BRI, BTN..."
                        />
                      </div>
                      <div>
                        <label className={labelCls}>No. Akad KPR</label>
                        <input
                          type="text"
                          value={editForm.kprAccountNo}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              kprAccountNo: e.target.value,
                            })
                          }
                          className={inputCls}
                          placeholder="Nomor akad..."
                        />
                      </div>
                      <div>
                        <label className={labelCls}>Nilai Plafon (Rp) *</label>
                        <input
                          type="number"
                          min="1"
                          value={editForm.kprAmount}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              kprAmount: e.target.value,
                            })
                          }
                          className={`${inputCls} ${editErrors.kprAmount ? "border-red-400" : ""}`}
                        />
                        {editErrors.kprAmount && (
                          <p className="text-xs text-red-500 mt-1">
                            {editErrors.kprAmount}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className={labelCls}>Tenor (Bulan) *</label>
                        <input
                          type="number"
                          min="1"
                          max="360"
                          value={editForm.kprTenor}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              kprTenor: e.target.value,
                            })
                          }
                          className={`${inputCls} ${editErrors.kprTenor ? "border-red-400" : ""}`}
                        />
                        {editErrors.kprTenor && (
                          <p className="text-xs text-red-500 mt-1">
                            {editErrors.kprTenor}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className={labelCls}>Tanggal Akad</label>
                        <input
                          type="date"
                          value={editForm.kprAkadDate}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              kprAkadDate: e.target.value,
                            })
                          }
                          className={inputCls}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 p-6 border-t border-[#F3F4F6] dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0">
                <button
                  onClick={() => setEditCustomer(null)}
                  type="button"
                  className="px-6 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-[10px] hover:bg-slate-50 dark:hover:bg-slate-600 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 text-sm font-bold text-white bg-[#EA6C00] hover:bg-[#C25500] rounded-[10px] shadow-md shadow-orange-500/20 transition-all active:scale-95 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="flex items-center gap-2 text-white">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Menyimpan...
                    </div>
                  ) : (
                    "Simpan"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Individual Delete confirm modal */}
      {deletePermanentCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl w-full max-w-[400px] overflow-hidden p-8 flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-10 h-10 text-rose-500"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white text-center mb-2">
              Hapus Pelanggan?
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-center mb-8">
              Pelanggan ini akan dihapus secara permanen.
            </p>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setDeletePermanentCustomer(null)}
                className="flex-1 h-12 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-[0.98]"
              >
                Batal
              </button>
              <button
                onClick={handlePermanentDelete}
                disabled={loading}
                className="flex-1 h-12 rounded-xl bg-rose-500 text-white font-semibold hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "Ya, Hapus"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── DETAIL PELANGGAN MODAL ───────────────────────────────────────────── */}
      {detailCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-700 max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-[#F3F4F6] dark:border-slate-700 shrink-0">
              <div className="min-w-0">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight truncate">
                  Detail Pelanggan
                </h2>
                <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                  {detailCustomer.customerCode}
                </p>
              </div>
              <button
                onClick={() => setDetailCustomer(null)}
                className="p-2 text-slate-400 hover:text-orange-500 dark:hover:text-orange-500 transition-colors rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6 subtle-scrollbar">
              <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                {[
                  { label: "Nama Lengkap", value: detailCustomer.name },
                  { label: "NIK", value: detailCustomer.nik },
                  { label: "Nomor HP", value: detailCustomer.phone },
                  { label: "Email", value: detailCustomer.email || "—" },
                  {
                    label: "Metode Bayar",
                    value: detailCustomer.paymentMethod,
                  },
                  {
                    label: "Unit Terkait",
                    value: detailCustomer.unit ? (
                      <button
                        onClick={() =>
                          setSelectedUnitId(detailCustomer.unit.id)
                        }
                        className="text-orange-600 hover:text-orange-700 transition-colors underline underline-offset-4"
                      >
                        {detailCustomer.unit.unitCode}
                      </button>
                    ) : (
                      "—"
                    ),
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className={
                      item.label === "Nama Lengkap" ? "col-span-2" : ""
                    }
                  >
                    <p className="form-label text-slate-400 dark:text-slate-500 mb-1.5">
                      {item.label}
                    </p>
                    <p className="table-body-primary dark:text-white font-semibold">
                      {item.value}
                    </p>
                  </div>
                ))}
                <div className="col-span-2">
                  <p className="form-label text-slate-400 dark:text-slate-500 mb-1.5">
                    Alamat Lengkap
                  </p>
                  <p className="table-body-primary dark:text-white font-semibold leading-relaxed">
                    {detailCustomer.address}
                  </p>
                </div>
              </div>
              {detailCustomer.paymentMethod === "KPR" && (
                <div className="pt-6 border-t border-slate-100 dark:border-slate-700/50">
                  <h3 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-[2px] mb-6 flex items-center gap-3">
                    <div className="w-1.5 h-4 bg-orange-500 rounded-full" />
                    Informasi Pembayaran KPR
                  </h3>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                    {[
                      {
                        label: "Nama Bank",
                        value: detailCustomer.bankName || "—",
                      },
                      {
                        label: "No. Akad KPR",
                        value: detailCustomer.kprAccountNo || "—",
                      },
                      {
                        label: "Nilai Plafon",
                        value: detailCustomer.kprAmount
                          ? `Rp ${new Intl.NumberFormat("id-ID").format(detailCustomer.kprAmount)}`
                          : "—",
                      },
                      {
                        label: "Tenor",
                        value: detailCustomer.kprTenor
                          ? `${detailCustomer.kprTenor} bulan`
                          : "—",
                      },
                    ].map((item) => (
                      <div key={item.label}>
                        <p className="form-label text-slate-400 dark:text-slate-500 mb-1.5">
                          {item.label}
                        </p>
                        <p className="table-body-primary dark:text-white font-semibold">
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {/* Footer */}
            <div className="flex justify-end gap-3 p-6 border-t border-[#F3F4F6] dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0">
              <button
                onClick={() => setDetailCustomer(null)}
                className="px-6 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-[10px] hover:bg-slate-50 dark:hover:bg-slate-600 transition-all"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Unit Detail Modal */}
      {selectedUnitId && (
        <UnitDetailModal
          unitId={selectedUnitId}
          onClose={() => setSelectedUnitId(null)}
        />
      )}
    </>
  );
}
