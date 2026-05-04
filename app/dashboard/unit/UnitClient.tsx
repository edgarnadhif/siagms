"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import UnitDetailModal from "./UnitDetailModal";
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
            onClick={() => remove(t.id)}
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
  );
}

// ─── Input style ──────────────────────────────────────────────────────────────
const transaksiLabelCls =
  "block text-[14px] font-semibold text-gray-700 dark:text-slate-300 mb-1.5 leading-[1.5]";
const transaksiInputCls =
  "w-full px-4 h-12 border border-[#E5E7EB] dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-[#EA6C00]/10 focus:border-[#EA6C00] outline-none transition-all placeholder-gray-400";
const transaksiReadonlyCls =
  "w-full px-4 h-12 border border-[#E5E7EB] dark:border-slate-600 rounded-xl text-sm bg-gray-50 dark:bg-slate-700/50 text-gray-700 dark:text-slate-300 flex items-center";

const EDITABLE_STATUSES = ["TERSEDIA", "BOOKING"];
const DELETABLE_STATUSES = ["TERSEDIA"];

interface EditFormData {
  blockName: string;
  unitNumber: string;
  type: string;
  landArea: string;
  buildingArea: string;
  price: string;
  projectId: string;
}

export default function UnitClient({
  initialData,
  projects,
  customers,
  currentRole,
}: {
  initialData: any[];
  projects: any[];
  customers: any[];
  currentRole: "ADMIN" | "AKUNTAN";
}) {
  const [units, setUnits] = useState(initialData);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("SEMUA");
  const [projectFilter, setProjectFilter] = useState("SEMUA");

  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [editUnit, setEditUnit] = useState<any | null>(null);
  const [deleteUnit, setDeleteUnit] = useState<any | null>(null);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [openActionId, setOpenActionId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const [itemsPerPageOpen, setItemsPerPageOpen] = useState(false);
  const [modalProjectOpen, setModalProjectOpen] = useState(false);
  const [editModalProjectOpen, setEditModalProjectOpen] = useState(false);
  const [assignCustomerOpen, setAssignCustomerOpen] = useState(false);
  const [searchModalProject, setSearchModalProject] = useState("");
  const [searchEditModalProject, setSearchEditModalProject] = useState("");
  const [searchAssignCustomer, setSearchAssignCustomer] = useState("");
  const statusRef = useRef<HTMLDivElement>(null);
  const projectRef = useRef<HTMLDivElement>(null);
  const itemsPerPageRef = useRef<HTMLDivElement>(null);
  const modalProjectRef = useRef<HTMLDivElement>(null);
  const editModalProjectRef = useRef<HTMLDivElement>(null);
  const assignCustomerRef = useRef<HTMLDivElement>(null);
  const actionMenuRef = useRef<HTMLDivElement>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [formData, setFormData] = useState({
    blockName: "",
    unitNumber: "",
    type: "",
    landArea: "",
    buildingArea: "",
    price: "",
    projectId: "",
  });
  const [editForm, setEditForm] = useState<EditFormData>({
    blockName: "",
    unitNumber: "",
    type: "",
    landArea: "",
    buildingArea: "",
    price: "",
    projectId: "",
  });
  const [editErrors, setEditErrors] = useState<Partial<EditFormData>>({});

  const [assignData, setAssignData] = useState({ customerId: "" });
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
        statusRef.current &&
        !statusRef.current.contains(event.target as Node)
      )
        setStatusDropdownOpen(false);
      if (
        projectRef.current &&
        !projectRef.current.contains(event.target as Node)
      )
        setProjectDropdownOpen(false);
      if (
        itemsPerPageRef.current &&
        !itemsPerPageRef.current.contains(event.target as Node)
      )
        setItemsPerPageOpen(false);
      if (
        modalProjectRef.current &&
        !modalProjectRef.current.contains(event.target as Node)
      )
        setModalProjectOpen(false);
      if (
        editModalProjectRef.current &&
        !editModalProjectRef.current.contains(event.target as Node)
      )
        setEditModalProjectOpen(false);
      if (
        assignCustomerRef.current &&
        !assignCustomerRef.current.contains(event.target as Node)
      )
        setAssignCustomerOpen(false);
      if (
        actionMenuRef.current &&
        !actionMenuRef.current.contains(event.target as Node)
      )
        setOpenActionId(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredUnits = units.filter((u) => {
    const matchesSearch =
      u.unitCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${u.blockName}${u.unitNumber}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "SEMUA" || u.status === statusFilter;
    const matchesProject =
      projectFilter === "SEMUA" || u.projectId === projectFilter;
    const matchesActive = u.isActive !== false;
    return matchesSearch && matchesStatus && matchesProject && matchesActive;
  });

  // Reset to page 1 on filter
  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds([]);
  }, [searchTerm, statusFilter, projectFilter]);

  const totalPages = Math.ceil(filteredUnits.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUnits = filteredUnits.slice(
    startIndex,
    startIndex + itemsPerPage,
  );
  const currentPageIds = paginatedUnits.map((u) => u.id);
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

  // ─── Add Unit ─────────────────────────────────────────────────────────────
  const handleAddUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/units", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          landArea: parseFloat(formData.landArea),
          buildingArea: parseFloat(formData.buildingArea),
          price: parseFloat(formData.price),
        }),
      });
      const result = await response.json();
      if (result.success) {
        setShowAddModal(false);
        setFormData({
          blockName: "",
          unitNumber: "",
          type: "",
          landArea: "",
          buildingArea: "",
          price: "",
          projectId: "",
        });
        showToast("Unit berhasil ditambahkan");
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

  // ─── Edit Unit ────────────────────────────────────────────────────────────
  const openEditModal = (u: any) => {
    setEditUnit(u);
    setEditErrors({});
    setEditForm({
      blockName: u.blockName,
      unitNumber: u.unitNumber,
      type: u.type,
      landArea: String(u.landArea),
      buildingArea: String(u.buildingArea),
      price: String(u.price),
      projectId: u.projectId,
    });
  };

  const validateEditForm = (): boolean => {
    const errs: Partial<EditFormData> = {};
    if (!editForm.blockName.trim()) errs.blockName = "Blok wajib diisi";
    if (!editForm.unitNumber.trim()) errs.unitNumber = "Nomor unit wajib diisi";
    if (!editForm.type.trim()) errs.type = "Tipe wajib diisi";
    if (!editForm.landArea || parseFloat(editForm.landArea) <= 0)
      errs.landArea = "Harus angka positif";
    if (!editForm.buildingArea || parseFloat(editForm.buildingArea) <= 0)
      errs.buildingArea = "Harus angka positif";
    if (!editForm.price || parseFloat(editForm.price) <= 0)
      errs.price = "Harus angka positif";
    if (!editForm.projectId) errs.projectId = "Pilih proyek";
    setEditErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleEditUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUnit || !validateEditForm()) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/units/${editUnit.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const result = await response.json();
      if (result.success) {
        setEditUnit(null);
        setUnits((prev) =>
          prev.map((u) => (u.id === result.data.id ? result.data : u)),
        );
        showToast("Data unit berhasil diperbarui");
      } else {
        showToast(result.message, "error");
      }
    } catch {
      showToast("Terjadi kesalahan sistem", "error");
    } finally {
      setLoading(false);
    }
  };

  // ─── Delete Unit ──────────────────────────────────────────────────────────
  const handleDeleteUnit = async () => {
    if (!deleteUnit) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/units/${deleteUnit.id}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (result.success) {
        setDeleteUnit(null);
        setUnits((prev) => prev.filter((u) => u.id !== deleteUnit.id));
        showToast("Data unit berhasil dihapus secara permanen", "error");
      } else {
        showToast(result.message, "error");
        setDeleteUnit(null);
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
      const response = await fetch("/api/units", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });
      const result = await response.json();
      if (result.success) {
        setUnits((prev) => prev.filter((u) => !selectedIds.includes(u.id)));
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

  // ─── Assign ───────────────────────────────────────────────────────────────
  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAssignModal) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/units/${showAssignModal}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(assignData),
      });
      const result = await response.json();
      if (result.success) {
        setShowAssignModal(null);
        showToast("Pelanggan berhasil di-assign ke unit");
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

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      <ToastContainer toasts={toasts} remove={removeToast} />

      <div className="text-gray-600 dark:text-gray-300 w-full h-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 px-4 md:px-0">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Master Unit
            </h1>
            <p className="card-subtitle text-gray-400 dark:text-gray-400 mt-2">
              Kelola persediaan unit perumahan
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-200 w-full md:w-auto md:ml-auto"
          >
            <img
              src="/add.svg"
              alt="Add"
              className="w-4 h-4 invert dark:invert-0"
            />
            Tambah Unit
          </button>
        </div>

        <div className="px-4 md:px-0 pb-10">
          {/* Filter bar */}
          <div className="sticky -top-6 z-30 pt-2 pb-3 bg-white dark:bg-[#111827] -mx-6 px-6">
            <div className="flex flex-col md:flex-row flex-wrap items-center gap-3 w-full">
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
                  placeholder="Cari kode unit atau tipe..."
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
                {/* Project filter */}
                <div
                  className="w-full md:w-[150px] lg:w-[160px] relative"
                  ref={projectRef}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setProjectDropdownOpen(!projectDropdownOpen);
                      setStatusDropdownOpen(false);
                    }}
                    className="w-full h-11 inline-flex items-center justify-between px-3 bg-white dark:bg-slate-800 border-[0.5px] border-[#E5E7EB] dark:border-slate-700 rounded-xl transition-colors"
                  >
                    <span className="text-sm font-normal text-slate-700 dark:text-slate-200 truncate">
                      {projectFilter === "SEMUA"
                        ? "Semua Proyek"
                        : projects.find((p) => p.id === projectFilter)?.name ||
                          "Pilih Proyek"}
                    </span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${projectDropdownOpen ? "rotate-180" : ""}`}
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
                  {projectDropdownOpen && (
                    <div className="absolute z-50 right-0 mt-2 w-64 max-h-60 overflow-y-auto bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl shadow-lg flex flex-col p-1 animate-in fade-in zoom-in-95 duration-200">
                      <button
                        onClick={() => {
                          setProjectFilter("SEMUA");
                          setProjectDropdownOpen(false);
                        }}
                        className={`text-left px-3 py-2 text-sm rounded-md transition-colors ${projectFilter === "SEMUA" ? "bg-slate-50 text-slate-900 font-medium dark:bg-slate-700 dark:text-white" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"}`}
                      >
                        Semua Proyek
                      </button>
                      {projects.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => {
                            setProjectFilter(p.id);
                            setProjectDropdownOpen(false);
                          }}
                          className={`text-left px-3 py-2 text-sm rounded-md transition-colors ${projectFilter === p.id ? "bg-slate-50 text-slate-900 font-medium dark:bg-slate-700 dark:text-white" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"}`}
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {/* Status filter */}
                <div
                  className="w-full md:w-[150px] lg:w-[160px] relative"
                  ref={statusRef}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setStatusDropdownOpen(!statusDropdownOpen);
                      setProjectDropdownOpen(false);
                    }}
                    className="w-full h-11 inline-flex items-center justify-between px-3 bg-white dark:bg-slate-800 border-[0.5px] border-[#E5E7EB] dark:border-slate-700 rounded-xl transition-colors"
                  >
                    <span className="text-sm font-normal text-slate-700 dark:text-slate-200 truncate">
                      {statusFilter === "SEMUA" ? "Semua Status" : statusFilter}
                    </span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${statusDropdownOpen ? "rotate-180" : ""}`}
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
                  {statusDropdownOpen && (
                    <div className="absolute z-50 right-0 mt-2 w-56 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden flex flex-col p-1 animate-in fade-in zoom-in-95 duration-200">
                      {[
                        "SEMUA",
                        "TERSEDIA",
                        "BOOKING",
                        "INDENT",
                        "AKAD",
                        "LUNAS",
                        "SERAH_TERIMA",
                      ].map((s) => (
                        <button
                          key={s}
                          onClick={() => {
                            setStatusFilter(s);
                            setStatusDropdownOpen(false);
                          }}
                          className={`text-left px-3 py-2 text-sm rounded-md transition-colors ${statusFilter === s ? "bg-slate-50 text-slate-900 font-medium dark:bg-slate-700 dark:text-white" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"}`}
                        >
                          {s}
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
                  {selectedIds.length} unit dipilih
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
                        const cannotDelete = units.some(
                          (u) =>
                            selectedIds.includes(u.id) &&
                            (u.status !== "TERSEDIA" ||
                              (u.transactions && u.transactions.length > 0)),
                        );
                        if (cannotDelete) {
                          showToast(
                            "Beberapa unit yang dipilih sudah memiliki transaksi dan tidak dapat dihapus sekaligus.",
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

          {/* Table */}
          <div className="bg-white dark:bg-slate-800 border-[0.5px] border-[#E5E7EB] dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead
                  className={`bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700/50 ${paginatedUnits.length === 0 ? "hidden" : ""}`}
                >
                  <tr>
                    <th className="px-5 py-4 w-[50px] text-center">
                      <input
                        type="checkbox"
                        checked={isCurrentPageSelected}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-100 dark:border-slate-600 dark:bg-slate-700 cursor-pointer"
                      />
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-[0.08em]">
                      KODE UNIT
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-[0.08em]">
                      BLOK / NOMOR
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-[0.08em]">
                      TIPE
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-[0.08em]">
                      HARGA
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-[0.08em]">
                      STATUS
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-[0.08em]">
                      PELANGGAN
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-[0.08em] text-center w-[120px]">
                      AKSI
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700/50">
                  {paginatedUnits.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-55 px-16 text-center">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800/80 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                          <img
                            src="/perumahan.svg"
                            alt="Perumahan"
                            className="w-10 h-10 opacity-20 grayscale"
                          />
                        </div>
                        <p className="font-bold text-gray-900 dark:text-white">
                          Belum ada unit
                        </p>
                        <p className="text-sm text-gray-400 mt-1 italic">
                          Klik &quot;Tambah Unit&quot; untuk menambahkan data
                          unit.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    paginatedUnits.map((u, idx) => (
                      <tr
                        key={u.id}
                        className={`hover:bg-gray-50/80 dark:hover:bg-slate-700/30 transition-all group ${selectedIds.includes(u.id) ? "bg-slate-50/60 dark:bg-slate-700/30" : ""} ${u.isActive === false ? "opacity-50" : ""}`}
                      >
                        <td className="px-5 py-4 whitespace-nowrap text-center">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(u.id)}
                            onChange={() => toggleSelect(u.id)}
                            className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-100 dark:border-slate-600 dark:bg-slate-700 cursor-pointer"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-semibold text-slate-900 dark:text-white">
                            {u.unitCode}
                          </span>
                          {u.isActive === false && (
                            <span className="ml-2 text-[9px] font-black uppercase text-red-400 bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded-full">
                              NONAKTIF
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-3.5 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">
                          Blok {u.blockName} No. {u.unitNumber}
                        </td>
                        <td className="px-6 py-3.5 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">
                          {u.type}
                        </td>
                        <td className="px-6 py-3.5 whitespace-nowrap text-sm font-semibold text-slate-900 dark:text-white tabular-nums text-right">
                          Rp {new Intl.NumberFormat("id-ID").format(u.price)}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge
                            status={u.status}
                            variant="UNIT"
                            size="sm"
                          />
                        </td>
                        <td className="px-6 py-3.5">
                          {u.customer ? (
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-slate-900 dark:text-white">
                                {u.customer.name}
                              </span>
                              <span className="text-xs text-slate-500 uppercase">
                                {u.customer.customerCode}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 dark:text-slate-500 italic uppercase tracking-[0.06em] font-medium">
                              Tersedia
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div
                            className="relative inline-flex justify-center"
                            ref={openActionId === u.id ? actionMenuRef : null}
                          >
                            <button
                              type="button"
                              onClick={() =>
                                setOpenActionId((prev) =>
                                  prev === u.id ? null : u.id,
                                )
                              }
                              className={`w-8 h-8 inline-flex items-center justify-center rounded-lg transition-colors ${
                                openActionId === u.id
                                  ? "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-white"
                                  : "text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                              }`}
                              title="Aksi"
                            >
                              <span className="text-lg leading-none -mt-1">
                                ...
                              </span>
                            </button>
                            {openActionId === u.id && (
                              <div
                                className={`absolute right-0 z-50 w-48 rounded-xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-1.5 shadow-xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150 ${
                                  idx >= paginatedUnits.length - 2
                                    ? "bottom-9"
                                    : "top-9"
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDetailId(u.id);
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
                                  <span className="font-medium">
                                    Detail Unit
                                  </span>
                                </button>
                                {EDITABLE_STATUSES.includes(u.status) && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      openEditModal(u);
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
                                      Edit Unit
                                    </span>
                                  </button>
                                )}
                                {u.status === "TERSEDIA" && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setShowAssignModal(u.id);
                                      setAssignData({ customerId: "" });
                                      setSearchAssignCustomer("");
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
                                        d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3.75 19.5a6.75 6.75 0 0 1 13.5 0v.75H3.75v-.75Z"
                                      />
                                    </svg>
                                    <span className="font-medium">
                                      Assign Pelanggan
                                    </span>
                                  </button>
                                )}
                                {DELETABLE_STATUSES.includes(u.status) && (
                                  <div className="mt-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-700">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setDeleteUnit(u);
                                        setOpenActionId(null);
                                      }}
                                      className="w-full inline-flex items-center gap-3 text-left px-3 py-2.5 text-sm rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors"
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
                                        Hapus Unit
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

            {/* Pagination UI */}
            {filteredUnits.length > 0 && (
              <div className="px-5 py-3.5 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700/50 flex flex-col md:flex-row items-center justify-between gap-4 rounded-b-2xl">
                <div className="text-sm text-slate-500 dark:text-slate-400 order-2 md:order-1">
                  Total Unit:{" "}
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {filteredUnits.length}
                  </span>
                </div>

                <div className="flex items-center gap-1 order-1 md:order-2">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
                    disabled={currentPage === 1}
                    className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-30 transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-4 h-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>

                  <div className="flex items-center gap-1">
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
                  </div>

                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-30 transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-4 h-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
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
                      className="flex items-center gap-2 px-3 h-9 min-w-[60px] justify-between border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 transition-all hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95"
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
      </div>

      {/* ─── ADD UNIT MODAL ─────────────────────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-[16px] shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden border border-white/20 dark:border-slate-700 flex flex-col animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b border-[#F3F4F6] dark:border-slate-700">
              <h2 className="text-[18px] font-semibold text-gray-900 dark:text-white leading-tight">
                Tambah Unit Baru
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 text-gray-400 hover:text-[#EA6C00] dark:hover:text-[#EA6C00] transition-colors rounded-full hover:bg-gray-50 dark:hover:bg-slate-700"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
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
              onSubmit={handleAddUnit}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <div className="flex-1 overflow-y-auto p-6 space-y-4 subtle-scrollbar">
                <div className="flex flex-col gap-4">
                  {/* Proyek Select */}
                  <div className="relative" ref={modalProjectRef}>
                    <label className={transaksiLabelCls}>
                      Pilih Proyek <span className="text-[#EA6C00]">*</span>
                    </label>
                    <div
                      onClick={() => {
                        if (!modalProjectOpen) {
                          setModalProjectOpen(true);
                          setSearchModalProject("");
                        } else {
                          setModalProjectOpen(false);
                        }
                      }}
                      className={`flex justify-between items-center w-full px-4 h-12 border rounded-xl text-sm transition-all text-left ${
                        modalProjectOpen
                          ? "border-[#EA6C00] ring-4 ring-[#EA6C00]/10"
                          : "border-[#E5E7EB] dark:border-slate-600"
                      } bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none cursor-text`}
                    >
                      {modalProjectOpen ? (
                        <input
                          autoFocus
                          type="text"
                          className="w-full bg-transparent border-none outline-none focus:ring-0 p-0 text-sm placeholder-gray-400 dark:placeholder-gray-500"
                          placeholder="Ketik untuk mencari proyek..."
                          value={searchModalProject}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) =>
                            setSearchModalProject(e.target.value)
                          }
                        />
                      ) : (
                        <span
                          className={
                            formData.projectId
                              ? "truncate pr-2"
                              : "text-gray-400 truncate pr-2"
                          }
                        >
                          {formData.projectId
                            ? projects.find((p) => p.id === formData.projectId)
                                ?.name
                            : "Pilih proyek..."}
                        </span>
                      )}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={`w-4 h-4 transition-transform ${modalProjectOpen ? "rotate-180" : ""}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>

                    {modalProjectOpen && (
                      <div className="absolute z-[60] left-0 right-0 mt-2 max-h-60 overflow-y-auto bg-white dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 rounded-2xl shadow-xl p-1.5 custom-scrollbar">
                        {projects.filter((p) => {
                          const search = searchModalProject.toLowerCase();
                          return (
                            p.name.toLowerCase().includes(search) ||
                            (p.code || "").toLowerCase().includes(search)
                          );
                        }).length === 0 ? (
                          <div className="px-4 py-3 text-sm text-center text-gray-500 italic">
                            Proyek tidak ditemukan
                          </div>
                        ) : (
                          projects
                            .filter((p) => {
                              const search = searchModalProject.toLowerCase();
                              return (
                                p.name.toLowerCase().includes(search) ||
                                (p.code || "").toLowerCase().includes(search)
                              );
                            })
                            .map((p) => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => {
                                  setFormData({ ...formData, projectId: p.id });
                                  setModalProjectOpen(false);
                                  setSearchModalProject("");
                                }}
                                className={`block w-full text-left px-4 py-3 text-sm transition-all rounded-xl ${
                                  formData.projectId === p.id
                                    ? "bg-slate-50 dark:bg-slate-700/50 text-gray-900 dark:text-white font-medium"
                                    : "text-gray-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-slate-700/30 font-medium"
                                }`}
                              >
                                <span className="block font-semibold">
                                  {p.name}
                                </span>
                                {p.code && (
                                  <span className="text-[11px] text-gray-500">
                                    {p.code}
                                  </span>
                                )}
                              </button>
                            ))
                        )}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={transaksiLabelCls}>
                        Blok <span className="text-[#EA6C00]">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: A"
                        value={formData.blockName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            blockName: e.target.value,
                          })
                        }
                        className={transaksiInputCls}
                      />
                    </div>
                    <div>
                      <label className={transaksiLabelCls}>
                        Nomor Unit <span className="text-[#EA6C00]">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: 01"
                        value={formData.unitNumber}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            unitNumber: e.target.value,
                          })
                        }
                        className={transaksiInputCls}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={transaksiLabelCls}>
                      Tipe (LB/LT) <span className="text-[#EA6C00]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: 36/72"
                      value={formData.type}
                      onChange={(e) =>
                        setFormData({ ...formData, type: e.target.value })
                      }
                      className={transaksiInputCls}
                    />
                    <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">
                      Gunakan format LB/LT (Luas Bangunan / Luas Tanah)
                    </p>
                  </div>

                  <div>
                    <label className={transaksiLabelCls}>
                      Harga Jual <span className="text-[#EA6C00]">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400">
                        Rp
                      </span>
                      <input
                        type="number"
                        required
                        placeholder="0"
                        value={formData.price}
                        onChange={(e) =>
                          setFormData({ ...formData, price: e.target.value })
                        }
                        className={`${transaksiInputCls} pl-11`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={transaksiLabelCls}>
                        Luas Bangunan <span className="text-[#EA6C00]">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        value={formData.buildingArea}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            buildingArea: e.target.value,
                          })
                        }
                        className={transaksiInputCls}
                      />
                    </div>
                    <div>
                      <label className={transaksiLabelCls}>
                        Luas Tanah <span className="text-[#EA6C00]">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        value={formData.landArea}
                        onChange={(e) =>
                          setFormData({ ...formData, landArea: e.target.value })
                        }
                        className={transaksiInputCls}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-5 border-t border-[#F3F4F6] dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 h-11 text-sm font-semibold text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 h-11 bg-[#EA6C00] hover:bg-[#C25500] text-white text-sm font-semibold rounded-xl shadow-lg shadow-orange-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    "Simpan Unit"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── EDIT UNIT MODAL ─────────────────────────────────────────────────── */}
      {editUnit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-[16px] shadow-2xl w-full max-w-lg overflow-hidden border border-white/20 dark:border-slate-700 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b border-[#F3F4F6] dark:border-slate-700">
              <h2 className="text-[18px] font-semibold text-gray-900 dark:text-white leading-tight">
                Edit Unit
              </h2>
              <button
                onClick={() => setEditUnit(null)}
                className="p-2 text-gray-400 hover:text-[#EA6C00] dark:hover:text-[#EA6C00] transition-colors rounded-full hover:bg-gray-50 dark:hover:bg-slate-700"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
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
              onSubmit={handleEditUnit}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <div className="flex-1 overflow-y-auto p-6 space-y-4 subtle-scrollbar">
                {/* Read-only section */}
                <div className="rounded-2xl border border-[#E5E7EB] dark:border-slate-700 bg-gray-50/70 dark:bg-slate-900/30 p-4 space-y-4">
                  <h3 className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-[0.08em]">
                    Informasi Unit
                  </h3>

                  <div className="flex flex-col gap-4">
                    <div>
                      <label className={transaksiLabelCls}>Kode Unit</label>
                      <div className={transaksiReadonlyCls}>
                        {editUnit.unitCode}
                      </div>
                      <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">
                        Kode unit bersifat unik dan tidak dapat diubah
                      </p>
                    </div>

                    <div>
                      <label className={transaksiLabelCls}>Status Unit</label>
                      <div
                        className={`${transaksiReadonlyCls} justify-between`}
                      >
                        <span className="font-bold text-slate-900 dark:text-white">
                          {editUnit.status}
                        </span>
                        <StatusBadge
                          status={editUnit.status}
                          variant="UNIT"
                          size="sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className={transaksiLabelCls}>
                        Pelanggan Terkait
                      </label>
                      <div className={transaksiReadonlyCls}>
                        {editUnit.customer?.name || "Belum ada pelanggan"}
                      </div>
                      <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">
                        {editUnit.customer
                          ? "Ubah melalui fitur Assign/Unassign"
                          : "Unit ini masih tersedia untuk dipasarkan"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  {/* Proyek Select */}
                  <div className="relative" ref={editModalProjectRef}>
                    <label className={transaksiLabelCls}>
                      Pilih Proyek <span className="text-[#EA6C00]">*</span>
                    </label>
                    <div
                      onClick={() => {
                        if (!editModalProjectOpen) {
                          setEditModalProjectOpen(true);
                          setSearchEditModalProject("");
                        } else {
                          setEditModalProjectOpen(false);
                        }
                      }}
                      className={`flex justify-between items-center w-full px-4 h-12 border rounded-xl text-sm transition-all text-left ${
                        editModalProjectOpen
                          ? "border-[#EA6C00] ring-4 ring-[#EA6C00]/10"
                          : editErrors.projectId
                            ? "border-red-400"
                            : "border-[#E5E7EB] dark:border-slate-600"
                      } bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none cursor-text`}
                    >
                      {editModalProjectOpen ? (
                        <input
                          autoFocus
                          type="text"
                          className="w-full bg-transparent border-none outline-none focus:ring-0 p-0 text-sm placeholder-gray-400 dark:placeholder-gray-500"
                          placeholder="Ketik untuk mencari proyek..."
                          value={searchEditModalProject}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) =>
                            setSearchEditModalProject(e.target.value)
                          }
                        />
                      ) : (
                        <span
                          className={
                            editForm.projectId
                              ? "truncate pr-2"
                              : "text-gray-400 truncate pr-2"
                          }
                        >
                          {editForm.projectId
                            ? projects.find((p) => p.id === editForm.projectId)
                                ?.name
                            : "Pilih proyek..."}
                        </span>
                      )}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={`w-4 h-4 transition-transform ${editModalProjectOpen ? "rotate-180" : ""}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>

                    {editModalProjectOpen && (
                      <div className="absolute z-[60] left-0 right-0 mt-2 max-h-60 overflow-y-auto bg-white dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 rounded-2xl shadow-xl p-1.5 custom-scrollbar">
                        {projects.filter((p) => {
                          const search = searchEditModalProject.toLowerCase();
                          return (
                            p.name.toLowerCase().includes(search) ||
                            (p.code || "").toLowerCase().includes(search)
                          );
                        }).length === 0 ? (
                          <div className="px-4 py-3 text-sm text-center text-gray-500 italic">
                            Proyek tidak ditemukan
                          </div>
                        ) : (
                          projects
                            .filter((p) => {
                              const search =
                                searchEditModalProject.toLowerCase();
                              return (
                                p.name.toLowerCase().includes(search) ||
                                (p.code || "").toLowerCase().includes(search)
                              );
                            })
                            .map((p) => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => {
                                  setEditForm({ ...editForm, projectId: p.id });
                                  setEditModalProjectOpen(false);
                                  setSearchEditModalProject("");
                                }}
                                className={`block w-full text-left px-4 py-3 text-sm transition-all rounded-xl ${
                                  editForm.projectId === p.id
                                    ? "bg-slate-50 dark:bg-slate-700/50 text-gray-900 dark:text-white font-medium"
                                    : "text-gray-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-slate-700/30 font-medium"
                                }`}
                              >
                                <span className="block font-semibold">
                                  {p.name}
                                </span>
                                {p.code && (
                                  <span className="text-[11px] text-gray-500">
                                    {p.code}
                                  </span>
                                )}
                              </button>
                            ))
                        )}
                      </div>
                    )}
                    {editErrors.projectId && (
                      <p className="text-xs text-red-500 mt-2">
                        {editErrors.projectId}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={transaksiLabelCls}>
                        Blok <span className="text-[#EA6C00]">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: A"
                        value={editForm.blockName}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            blockName: e.target.value,
                          })
                        }
                        className={`${transaksiInputCls} ${editErrors.blockName ? "border-red-400" : ""}`}
                      />
                      {editErrors.blockName && (
                        <p className="text-xs text-red-500 mt-2">
                          {editErrors.blockName}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className={transaksiLabelCls}>
                        Nomor Unit <span className="text-[#EA6C00]">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: 01"
                        value={editForm.unitNumber}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            unitNumber: e.target.value,
                          })
                        }
                        className={`${transaksiInputCls} ${editErrors.unitNumber ? "border-red-400" : ""}`}
                      />
                      {editErrors.unitNumber && (
                        <p className="text-xs text-red-500 mt-2">
                          {editErrors.unitNumber}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className={transaksiLabelCls}>
                      Tipe (LB/LT) <span className="text-[#EA6C00]">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: 36/72"
                      value={editForm.type}
                      onChange={(e) =>
                        setEditForm({ ...editForm, type: e.target.value })
                      }
                      className={`${transaksiInputCls} ${editErrors.type ? "border-red-400" : ""}`}
                    />
                    {editErrors.type && (
                      <p className="text-xs text-red-500 mt-2">
                        {editErrors.type}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className={transaksiLabelCls}>
                      Harga Jual <span className="text-[#EA6C00]">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400">
                        Rp
                      </span>
                      <input
                        type="number"
                        placeholder="0"
                        value={editForm.price}
                        onChange={(e) =>
                          setEditForm({ ...editForm, price: e.target.value })
                        }
                        className={`${transaksiInputCls} pl-11 ${editErrors.price ? "border-red-400" : ""}`}
                      />
                    </div>
                    {editErrors.price && (
                      <p className="text-xs text-red-500 mt-2">
                        {editErrors.price}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={transaksiLabelCls}>
                        Luas Bangunan <span className="text-[#EA6C00]">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={editForm.buildingArea}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            buildingArea: e.target.value,
                          })
                        }
                        className={`${transaksiInputCls} ${editErrors.buildingArea ? "border-red-400" : ""}`}
                      />
                      {editErrors.buildingArea && (
                        <p className="text-xs text-red-500 mt-2">
                          {editErrors.buildingArea}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className={transaksiLabelCls}>
                        Luas Tanah <span className="text-[#EA6C00]">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={editForm.landArea}
                        onChange={(e) =>
                          setEditForm({ ...editForm, landArea: e.target.value })
                        }
                        className={`${transaksiInputCls} ${editErrors.landArea ? "border-red-400" : ""}`}
                      />
                      {editErrors.landArea && (
                        <p className="text-xs text-red-500 mt-2">
                          {editErrors.landArea}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-5 border-t border-[#F3F4F6] dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditUnit(null)}
                  className="px-5 h-11 text-sm font-semibold text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 h-11 bg-[#EA6C00] hover:bg-[#C25500] text-white text-sm font-semibold rounded-xl shadow-lg shadow-orange-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Simpan Perubahan"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── ASSIGN MODAL ─────────────────────────────────────────────────────── */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-[16px] shadow-2xl w-full max-w-md overflow-hidden border border-white/20 dark:border-slate-700 flex flex-col animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b border-[#F3F4F6] dark:border-slate-700">
              <h2 className="text-[18px] font-semibold text-gray-900 dark:text-white leading-tight">
                Assign Pelanggan
              </h2>
              <button
                onClick={() => {
                  setShowAssignModal(null);
                  setAssignCustomerOpen(false);
                  setSearchAssignCustomer("");
                }}
                className="p-2 text-gray-400 hover:text-[#EA6C00] dark:hover:text-[#EA6C00] transition-colors rounded-full hover:bg-gray-50 dark:hover:bg-slate-700"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAssign} className="p-6 space-y-4">
              {/* Customer Select */}
              <div className="relative" ref={assignCustomerRef}>
                <label className={transaksiLabelCls}>
                  Pelanggan <span className="text-[#EA6C00]">*</span>
                </label>
                <div
                  onClick={() => {
                    if (!assignCustomerOpen) {
                      setAssignCustomerOpen(true);
                      setSearchAssignCustomer("");
                    } else {
                      setAssignCustomerOpen(false);
                    }
                  }}
                  className={`flex justify-between items-center w-full px-4 h-12 border rounded-xl text-sm transition-all text-left cursor-text ${
                    assignCustomerOpen
                      ? "border-[#EA6C00] ring-4 ring-[#EA6C00]/10"
                      : "border-[#E5E7EB] dark:border-slate-600"
                  } bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm`}
                >
                  {assignCustomerOpen ? (
                    <input
                      autoFocus
                      type="text"
                      className="w-full bg-transparent border-none outline-none focus:ring-0 p-0 text-sm placeholder-gray-400 dark:placeholder-gray-500"
                      placeholder="Ketik nama atau kode pelanggan..."
                      value={searchAssignCustomer}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => setSearchAssignCustomer(e.target.value)}
                    />
                  ) : (
                    <div className="flex flex-col truncate pr-2">
                      <span
                        className={`truncate ${assignData.customerId ? "text-gray-900 dark:text-white font-medium" : "text-gray-400"}`}
                      >
                        {assignData.customerId
                          ? customers.find(
                              (c) => c.id === assignData.customerId,
                            )?.name
                          : "Pilih pelanggan..."}
                      </span>
                      {assignData.customerId && (
                        <span className="text-[11px] text-gray-500 font-normal truncate">
                          {
                            customers.find(
                              (c) => c.id === assignData.customerId,
                            )?.customerCode
                          }{" "}
                          -{" "}
                          {
                            customers.find(
                              (c) => c.id === assignData.customerId,
                            )?.paymentMethod
                          }
                        </span>
                      )}
                    </div>
                  )}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`w-4 h-4 flex-shrink-0 transition-transform ${assignCustomerOpen ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
                <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">
                  Ketik nama atau kode untuk mencari pelanggan
                </p>

                {assignCustomerOpen && (
                  <div className="mt-2 max-h-56 overflow-y-auto bg-white dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 rounded-2xl shadow-xl p-1.5 custom-scrollbar">
                    {customers
                      .filter((c) => {
                        const search = searchAssignCustomer.toLowerCase();
                        return (
                          c.name.toLowerCase().includes(search) ||
                          (c.customerCode || "")
                            .toLowerCase()
                            .includes(search) ||
                          (c.paymentMethod || "").toLowerCase().includes(search)
                        );
                      })
                      .map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setAssignData({ customerId: c.id });
                            setAssignCustomerOpen(false);
                            setSearchAssignCustomer("");
                          }}
                          className={`w-full text-left px-4 py-3 text-sm rounded-xl transition-all mb-1 last:mb-0 ${assignData.customerId === c.id ? "bg-orange-50 text-orange-600 font-bold dark:bg-orange-950/30" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"}`}
                        >
                          <div className="flex flex-col">
                            <span>{c.name}</span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase">
                              {c.customerCode} • {c.paymentMethod}
                            </span>
                          </div>
                        </button>
                      ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAssignModal(null);
                    setAssignCustomerOpen(false);
                    setSearchAssignCustomer("");
                  }}
                  className="flex-1 h-11 text-sm font-semibold text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 h-11 bg-[#EA6C00] hover:bg-[#C25500] text-white text-sm font-semibold rounded-xl shadow-lg shadow-orange-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Assign Sekarang"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── DELETE CONFIRM MODAL ─────────────────────────────────────────────── */}
      {deleteUnit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
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
              Hapus Unit?
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-center mb-8">
              Unit{" "}
              <span className="font-bold text-slate-900 dark:text-white">
                {deleteUnit.unitCode}
              </span>{" "}
              akan dihapus secara permanen.
            </p>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setDeleteUnit(null)}
                className="flex-1 h-12 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-[0.98]"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteUnit}
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

      {/* ─── BULK DELETE MODAL ─────────────────────────────────────────────────── */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
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
              Hapus {selectedIds.length} Unit?
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-center mb-8">
              Seluruh unit yang dipilih akan dihapus secara permanen. Tindakan
              ini tidak dapat dibatalkan.
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
                  "Ya, Hapus Semua"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {detailId && (
        <UnitDetailModal
          unitId={detailId}
          onClose={() => setDetailId(null)}
          onCancelSuccess={() => {
            // Refresh unit status in the table by reloading unit data
            setDetailId(null);
            window.location.reload();
          }}
        />
      )}
    </>
  );
}
