"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import StatusBadge from "@/components/ui/StatusBadge";

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

// ─── Common class strings ─────────────────────────────────────────────────────
const inputCls =
  "w-full h-11 px-4 rounded-[10px] border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-white focus:ring-4 focus:ring-[#EA6C00]/10 focus:border-[#EA6C00] outline-none transition-all placeholder-gray-400";
const labelCls =
  "block text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5";
const readonlyCls =
  "w-full h-11 px-4 rounded-[10px] border border-gray-100 dark:border-slate-700/50 bg-gray-50 dark:bg-slate-800/50 text-sm text-gray-500 dark:text-gray-400 flex items-center";

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
  currentRole: "SUPER_ADMIN" | "AKUNTAN" | "MARKETING";
}) {
  const [customers, setCustomers] = useState(initialData);
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("SEMUA");
  const [showInactive, setShowInactive] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [payDropdownOpen, setPayDropdownOpen] = useState(false);
  const [itemsPerPageOpen, setItemsPerPageOpen] = useState(false);
  const payFilterRef = useRef<HTMLDivElement>(null);
  const itemsPerPageRef = useRef<HTMLDivElement>(null);

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

  const [deactivateCustomer, setDeactivateCustomer] = useState<any | null>(
    null,
  );
  const [activateCustomer, setActivateCustomer] = useState<any | null>(null);
  const [deletePermanentCustomer, setDeletePermanentCustomer] = useState<any | null>(null);

  const [detailCustomer, setDetailCustomer] = useState<any | null>(null);

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
    const matchesActive = showInactive ? true : c.isActive !== false;
    return matchesSearch && matchesPayment && matchesActive;
  });

  // Reset to page 1 on filter
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, paymentFilter, showInactive]);

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCustomers = filteredCustomers.slice(
    startIndex,
    startIndex + itemsPerPage,
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

  // ─── Deactivate Customer ────────────────────────────────────────────────────
  const handleDeactivate = async () => {
    if (!deactivateCustomer) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/customers/${deactivateCustomer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deactivate" }),
      });
      const result = await response.json();
      if (result.success) {
        setDeactivateCustomer(null);
        setCustomers((prev) =>
          prev.map((c) =>
            c.id === deactivateCustomer.id ? { ...c, isActive: false } : c,
          ),
        );
        showToast("Pelanggan berhasil dinonaktifkan");
      } else {
        showToast(result.message, "error");
        setDeactivateCustomer(null);
      }
    } catch {
      showToast("Terjadi kesalahan sistem", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async () => {
    if (!activateCustomer) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/customers/${activateCustomer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "activate" }),
      });
      const result = await response.json();
      if (result.success) {
        setActivateCustomer(null);
        setCustomers((prev) =>
          prev.map((c) =>
            c.id === result.data.id ? { ...c, isActive: true } : c,
          ),
        );
        showToast("Pelanggan berhasil diaktifkan kembali");
      } else {
        showToast(result.message, "error");
        setActivateCustomer(null);
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
        `/api/customers/${deletePermanentCustomer.id}?permanent=true`,
        {
          method: "DELETE",
        },
      );
      const result = await response.json();
      if (result.success) {
        const deletedId = deletePermanentCustomer.id;
        setDeletePermanentCustomer(null);
        setCustomers((prev) => prev.filter((c) => c.id !== deletedId));
        showToast("Pelanggan berhasil dihapus permanen");
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

  return (
    <>
      <ToastContainer toasts={toasts} remove={removeToast} />

      <div className="text-gray-600 dark:text-gray-300 w-full h-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 px-4 md:px-0">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Master Pelanggan
            </h1>
            <p className="text-sm text-gray-400 dark:text-gray-400 mt-3">
              Kelola data pelanggan dan metode pembayaran
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-5 h-11 bg-[#EA6C00] hover:bg-[#C25500] text-white text-sm font-bold rounded-[10px] shadow-lg shadow-orange-500/20 transition-all active:scale-95 ml-auto w-full md:w-auto justify-center md:justify-start"
          >
            <img
              src="/add.svg"
              alt="Add"
              className="w-5 h-5 invert dark:invert-0"
            />
            Tambah Pelanggan
          </button>
        </div>

        <div className="px-4 md:px-0 pb-10">
          {/* Filter bar */}
          <div className="sticky -top-6 z-30 pt-8 pb-4 bg-white dark:bg-[#111827] -mx-6 px-6">
            <div className="flex flex-col md:flex-row items-center bg-white dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 rounded-[12px] shadow-sm p-1.5 min-h-[56px] md:h-14">
              <div className="flex flex-1 items-center px-3 gap-3 w-full h-full min-h-[44px]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                  className="w-4 h-4 text-gray-400 shrink-0"
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
                  className="flex-1 bg-transparent border-none focus:ring-0 outline-none text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 font-medium"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="p-1 text-gray-300 hover:text-gray-500 transition-colors"
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
              <div className="hidden md:block h-6 w-[1px] bg-gray-100 dark:bg-slate-700 mx-1" />
              <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-gray-100 dark:divide-slate-700 w-full md:w-auto">
                {/* Toggle inactive */}
                <button
                  type="button"
                  onClick={() => setShowInactive(!showInactive)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-bold transition-colors whitespace-nowrap ${showInactive ? "text-[#EA6C00]" : "text-gray-500 dark:text-gray-400 hover:text-gray-700"}`}
                >
                  <div
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${showInactive ? "bg-[#EA6C00]" : "bg-gray-200 dark:bg-slate-700"}`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transform transition-transform ${showInactive ? "translate-x-4" : "translate-x-1"}`}
                    />
                  </div>
                  Nonaktif
                </button>
                {/* Payment filter */}
                <div className="relative w-full md:w-auto" ref={payFilterRef}>
                  <button
                    type="button"
                    onClick={() => setPayDropdownOpen(!payDropdownOpen)}
                    className="flex items-center justify-between md:justify-start gap-2 w-full md:w-auto px-4 py-3 text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors whitespace-nowrap"
                  >
                    <span>
                      {paymentFilter === "SEMUA"
                        ? "Semua Metode"
                        : paymentFilter === "CASH"
                          ? "CASH KERAS"
                          : "KPR"}
                    </span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${payDropdownOpen ? "rotate-180" : ""}`}
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
                    <div className="absolute z-50 right-0 mt-3 w-56 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden flex flex-col p-1.5">
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
                          className={`flex items-center gap-3 px-3 py-2.5 text-sm font-bold rounded-lg transition-colors ${paymentFilter === opt.val ? "bg-[#EA6C00] text-white" : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700/50"}`}
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

          {/* Table */}
          <div className="bg-white dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 rounded-[12px] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-[#F9FAFB] dark:bg-slate-900 border-b border-[#E5E7EB] dark:border-slate-700">
                  <tr>
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Kode
                    </th>
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Nama & Kontak
                    </th>
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      NIK
                    </th>
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Metode
                    </th>
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Unit Terkait
                    </th>
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700/50">
                  {paginatedCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-10 h-10 text-gray-300"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                            />
                          </svg>
                          <p className="text-gray-400 font-medium">
                            Tidak ada data pelanggan ditemukan.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedCustomers.map((c) => (
                      <tr
                        key={c.id}
                        className={`hover:bg-gray-50/80 dark:hover:bg-slate-700/30 transition-all group ${c.isActive === false ? "opacity-50" : ""}`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-bold text-gray-900 dark:text-gray-100">
                            {c.customerCode}
                          </span>
                          {c.isActive === false && (
                            <span className="ml-2 text-[9px] font-black uppercase text-red-400 bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded-full">
                              NONAKTIF
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-900 dark:text-gray-100 transition-colors">
                              {c.name}
                            </span>
                            <span className="text-xs text-gray-400 mt-0.5">
                              {c.phone}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400 font-medium">
                          {c.nik}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge
                            status={c.paymentMethod}
                            variant="METODE_PEMBAYARAN"
                            size="sm"
                          />
                        </td>
                        <td className="px-6 py-4">
                          {c.unit ? (
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                              <span className="text-gray-700 dark:text-gray-300 font-bold">
                                {c.unit.unitCode}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-gray-300 dark:text-slate-600 font-black italic uppercase tracking-wider">
                              Tanpa Unit
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Edit */}
                            <button
                              onClick={() => openEditModal(c)}
                              title="Edit Pelanggan"
                              className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-600 dark:hover:text-white transition-all"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-4 h-4"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                              </svg>
                            </button>
                            {/* Detail */}
                            <button
                              onClick={() => setDetailCustomer(c)}
                              title="Detail Pelanggan"
                              className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-orange-600 bg-orange-50 hover:bg-orange-600 hover:text-white dark:bg-orange-900/20 dark:text-orange-400 dark:hover:bg-orange-600 dark:hover:text-white transition-all"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-4 h-4"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                <path
                                  fillRule="evenodd"
                                  d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </button>
                            {c.isActive !== false ? (
                              <button
                                onClick={() => setDeactivateCustomer(c)}
                                title="Nonaktifkan Pelanggan"
                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-red-600 bg-red-50 hover:bg-red-600 hover:text-white dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-600 dark:hover:text-white transition-all"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="w-4 h-4"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M13.477 14.89A6 6 0 015.11 6.524L13.477 14.89zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => setActivateCustomer(c)}
                                  title="Aktifkan Kembali"
                                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-emerald-600 bg-emerald-50 hover:bg-emerald-600 hover:text-white dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-600 dark:hover:text-white transition-all"
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="w-4 h-4"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </button>
                                {currentRole === "SUPER_ADMIN" && (
                                  <button
                                    onClick={() => setDeletePermanentCustomer(c)}
                                    title="Hapus Permanen"
                                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-red-600 bg-red-50 hover:bg-red-600 hover:text-white dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-600 dark:hover:text-white transition-all"
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="w-4 h-4"
                                      viewBox="0 0 20 20"
                                      fill="currentColor"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2h.293l.853 10.236A2 2 0 007.14 18h5.72a2 2 0 001.994-1.764L15.707 6H16a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zm-1 4a1 1 0 112 0v8a1 1 0 11-2 0V6zm4-1a1 1 0 00-1 1v8a1 1 0 102 0V6a1 1 0 00-1-1z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination UI */}
            {filteredCustomers.length > 0 && (
              <div className="px-5 py-4 bg-white dark:bg-slate-800 border-t border-[#F3F4F6] dark:border-slate-700/50 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-500 dark:text-gray-400 order-2 md:order-1">
                  Total Pelanggan:{" "}
                  <span className="font-bold text-gray-900 dark:text-white">
                    {filteredCustomers.length}
                  </span>
                </div>

                <div className="flex items-center gap-1 order-1 md:order-2">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
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
        </div>
      </div>

      {/* ─── ADD PELANGGAN MODAL ──────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                Tambah Pelanggan Baru
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
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
            <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <label className={labelCls}>No HP *</label>
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
                    <label className={labelCls}>Email</label>
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
                      rows={2}
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                      className="w-full p-4 rounded-[10px] border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-white focus:ring-4 focus:ring-[#EA6C00]/10 focus:border-[#EA6C00] outline-none transition-all placeholder-gray-400"
                      placeholder="Masukkan alamat..."
                    />
                  </div>
                  <div className="md:col-span-2 pt-6 mt-2 border-t border-gray-100 dark:border-slate-700">
                    <h3 className="text-xs font-black text-gray-900 dark:text-gray-100 uppercase tracking-[2px] mb-4 flex items-center gap-2">
                      <div className="w-1.5 h-4 bg-[#EA6C00] rounded-full" />
                      Informasi Pembayaran
                    </h3>
                    <div>
                      <label className={labelCls}>Metode Pembayaran *</label>
                      <select
                        value={formData.paymentMethod}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            paymentMethod: e.target.value,
                          })
                        }
                        className={inputCls}
                      >
                        <option value="CASH">CASH KERAS</option>
                        <option value="KPR">KPR</option>
                      </select>
                    </div>
                  </div>
                  {formData.paymentMethod === "KPR" && (
                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
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
              <div className="p-5 border-t border-gray-100 dark:border-slate-700 flex justify-end gap-3 bg-gray-50/50 dark:bg-slate-800/30">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 h-11 text-sm font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-[10px] transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 h-11 bg-[#EA6C00] hover:bg-[#C25500] text-white text-sm font-bold rounded-[10px] shadow-lg shadow-orange-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Memproses...
                    </>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-slate-700">
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                  Edit Pelanggan
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Perbarui data {editCustomer.name}
                </p>
              </div>
              <button
                onClick={() => setEditCustomer(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
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
              className="overflow-y-auto flex-1"
            >
              <div className="p-6 space-y-5">
                {/* Read-only section */}
                <div className="bg-gray-50 dark:bg-slate-900/50 rounded-xl p-4 space-y-3 border border-gray-100 dark:border-slate-700">
                  <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
                    Informasi Read-Only
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className={labelCls}>Kode Pelanggan</label>
                      <div className={readonlyCls}>
                        {editCustomer.customerCode}
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>NIK</label>
                      <div className={readonlyCls}>{editCustomer.nik}</div>
                      <p className="text-[10px] text-gray-400 mt-1">
                        NIK tidak dapat diubah. Hubungi admin jika terjadi
                        kesalahan.
                      </p>
                    </div>
                    <div>
                      <label className={labelCls}>Metode Pembayaran</label>
                      <div className="h-11 flex items-center gap-2">
                        <StatusBadge
                          status={editCustomer.paymentMethod}
                          variant="METODE_PEMBAYARAN"
                          size="sm"
                        />
                      </div>
                      <p className="text-[10px] text-gray-400">
                        Metode pembayaran tidak dapat diubah setelah transaksi
                        berjalan.
                      </p>
                    </div>
                    {editCustomer.unit && (
                      <div className="md:col-span-3">
                        <label className={labelCls}>Unit Terkait</label>
                        <div className={readonlyCls}>
                          {editCustomer.unit.unitCode}
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1">
                          Kelola unit melalui halaman Master Unit.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Editable fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <label className={labelCls}>Email</label>
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
                      className={`w-full p-4 rounded-[10px] border bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-white focus:ring-4 focus:ring-[#EA6C00]/10 focus:border-[#EA6C00] outline-none transition-all placeholder-gray-400 ${editErrors.address ? "border-red-400" : "border-gray-200 dark:border-slate-700"}`}
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <div className="p-5 border-t border-gray-100 dark:border-slate-700 flex justify-end gap-3 bg-gray-50/50 dark:bg-slate-800/30">
                <button
                  type="button"
                  onClick={() => setEditCustomer(null)}
                  className="px-5 h-11 text-sm font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-[10px] transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 h-11 bg-[#EA6C00] hover:bg-[#C25500] text-white text-sm font-bold rounded-[10px] shadow-lg shadow-orange-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-4 h-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Simpan Perubahan
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── DEACTIVATE CONFIRM MODAL ─────────────────────────────────────────── */}
      {deactivateCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-6 h-6 text-red-600"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M13.477 14.89A6 6 0 015.11 6.524L13.477 14.89zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Nonaktifkan Pelanggan
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Pelanggan tidak akan muncul di dropdown transaksi.
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-slate-900/50 rounded-xl p-4">
                Apakah Anda yakin ingin menonaktifkan pelanggan{" "}
                <span className="font-bold text-[#EA6C00]">
                  {deactivateCustomer.name}
                </span>{" "}
                ({deactivateCustomer.customerCode})?
              </p>
            </div>
            <div className="px-6 pb-6 flex justify-end gap-3">
              <button
                onClick={() => setDeactivateCustomer(null)}
                className="px-5 h-11 text-sm font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-[10px] transition-all"
              >
                Batal
              </button>
              <button
                onClick={handleDeactivate}
                disabled={loading}
                className="px-6 h-11 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-[10px] shadow-lg shadow-red-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Memproses...
                  </>
                ) : (
                  "Ya, Nonaktifkan"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {activateCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-6 h-6 text-emerald-600"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Aktifkan Kembali Pelanggan
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Pelanggan akan muncul lagi di daftar transaksi.
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-slate-900/50 rounded-xl p-4">
                Aktifkan kembali pelanggan{" "}
                <span className="font-bold text-[#EA6C00]">
                  {activateCustomer.name}
                </span>{" "}
                ({activateCustomer.customerCode})?
              </p>
            </div>
            <div className="px-6 pb-6 flex justify-end gap-3">
              <button
                onClick={() => setActivateCustomer(null)}
                className="px-5 h-11 text-sm font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-[10px] transition-all"
              >
                Batal
              </button>
              <button
                onClick={handleActivate}
                disabled={loading}
                className="px-6 h-11 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-[10px] shadow-lg shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Memproses...
                  </>
                ) : (
                  "Ya, Aktifkan"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {deletePermanentCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-6 h-6 text-red-600"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2h.293l.853 10.236A2 2 0 007.14 18h5.72a2 2 0 001.994-1.764L15.707 6H16a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zm-1 4a1 1 0 112 0v8a1 1 0 11-2 0V6zm4-1a1 1 0 00-1 1v8a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Hapus Permanen Pelanggan
                  </h3>
                  <p className="text-sm text-red-500">
                    Data akan dihapus permanen dan tidak bisa dikembalikan.
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-slate-900/50 rounded-xl p-4">
                Hapus permanen pelanggan{" "}
                <span className="font-bold text-[#EA6C00]">
                  {deletePermanentCustomer.name}
                </span>{" "}
                ({deletePermanentCustomer.customerCode})?
              </p>
            </div>
            <div className="px-6 pb-6 flex justify-end gap-3">
              <button
                onClick={() => setDeletePermanentCustomer(null)}
                className="px-5 h-11 text-sm font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-[10px] transition-all"
              >
                Batal
              </button>
              <button
                onClick={handlePermanentDelete}
                disabled={loading}
                className="px-6 h-11 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-[10px] shadow-lg shadow-red-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Menghapus...
                  </>
                ) : (
                  "Ya, Hapus Permanen"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── DETAIL PELANGGAN MODAL ───────────────────────────────────────────── */}
      {detailCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg overflow-hidden max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-slate-700">
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                  Detail Pelanggan
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {detailCustomer.customerCode}
                </p>
              </div>
              <button
                onClick={() => setDetailCustomer(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
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
            <div className="overflow-y-auto flex-1 p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
                    label: "Unit",
                    value: detailCustomer.unit?.unitCode || "—",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className={
                      item.label === "Nama Lengkap" ? "col-span-2" : ""
                    }
                  >
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                      {item.label}
                    </p>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                      {item.value}
                    </p>
                  </div>
                ))}
                <div className="col-span-2">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Alamat
                  </p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                    {detailCustomer.address}
                  </p>
                </div>
              </div>
              {detailCustomer.paymentMethod === "KPR" && (
                <div className="border-t border-gray-100 dark:border-slate-700 pt-4">
                  <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3">
                    Informasi KPR
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: "Bank", value: detailCustomer.bankName || "—" },
                      {
                        label: "No. Akad",
                        value: detailCustomer.kprAccountNo || "—",
                      },
                      {
                        label: "Plafon",
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
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                          {item.label}
                        </p>
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="p-5 border-t border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/30 flex justify-end">
              <button
                onClick={() => setDetailCustomer(null)}
                className="px-5 h-11 text-sm font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-[10px] transition-all"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
