"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import UnitDetailModal from "./UnitDetailModal";

// ─── Toast ────────────────────────────────────────────────────────────────────
type ToastType = "success" | "error";
interface Toast { id: number; message: string; type: ToastType }

function ToastContainer({ toasts, remove }: { toasts: Toast[]; remove: (id: number) => void }) {
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
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          )}
          <span className="flex-1">{t.message}</span>
          <button onClick={() => remove(t.id)} className="text-white/70 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Input style ──────────────────────────────────────────────────────────────
const inputCls = "w-full h-11 px-4 rounded-[10px] border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-white focus:ring-4 focus:ring-[#EA6C00]/10 focus:border-[#EA6C00] outline-none transition-all placeholder-gray-400";
const labelCls = "block text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5";
const readonlyCls = "w-full h-11 px-4 rounded-[10px] border border-gray-100 dark:border-slate-700/50 bg-gray-50 dark:bg-slate-800/50 text-sm text-gray-500 dark:text-gray-400 flex items-center";

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
}: {
  initialData: any[];
  projects: any[];
  customers: any[];
}) {
  const [units, setUnits] = useState(initialData);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("SEMUA");
  const [projectFilter, setProjectFilter] = useState("SEMUA");
  const [showInactive, setShowInactive] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [editUnit, setEditUnit] = useState<any | null>(null);
  const [deleteUnit, setDeleteUnit] = useState<any | null>(null);

  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);
  const projectRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    blockName: "", unitNumber: "", type: "", landArea: "", buildingArea: "", price: "", projectId: "",
  });
  const [editForm, setEditForm] = useState<EditFormData>({
    blockName: "", unitNumber: "", type: "", landArea: "", buildingArea: "", price: "", projectId: "",
  });
  const [editErrors, setEditErrors] = useState<Partial<EditFormData>>({});

  const [assignData, setAssignData] = useState({ customerId: "" });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Toast
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);
  const showToast = useCallback((message: string, type: ToastType = "success") => {
    const id = ++toastId.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);
  const removeToast = useCallback((id: number) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusRef.current && !statusRef.current.contains(event.target as Node)) setStatusDropdownOpen(false);
      if (projectRef.current && !projectRef.current.contains(event.target as Node)) setProjectDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredUnits = units.filter((u) => {
    const matchesSearch =
      u.unitCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${u.blockName}${u.unitNumber}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "SEMUA" || u.status === statusFilter;
    const matchesProject = projectFilter === "SEMUA" || u.projectId === projectFilter;
    const matchesActive = showInactive ? true : u.isActive !== false;
    return matchesSearch && matchesStatus && matchesProject && matchesActive;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "TERSEDIA": return "bg-emerald-50 text-emerald-700 ring-emerald-700/10 dark:bg-emerald-900/30 dark:text-emerald-400";
      case "BOOKING": return "bg-blue-50 text-blue-700 ring-blue-700/10 dark:bg-blue-900/30 dark:text-blue-400";
      case "INDENT": return "bg-yellow-50 text-yellow-700 ring-yellow-700/10 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "AKAD": return "bg-orange-50 text-orange-700 ring-orange-700/10 dark:bg-orange-900/30 dark:text-orange-400";
      case "LUNAS": return "bg-purple-50 text-purple-700 ring-purple-700/10 dark:bg-purple-900/30 dark:text-purple-400";
      case "SERAH_TERIMA": return "bg-slate-100 text-slate-700 ring-slate-700/10 dark:bg-slate-800 dark:text-slate-400";
      default: return "bg-gray-100 text-gray-700 ring-gray-700/10";
    }
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
        setFormData({ blockName: "", unitNumber: "", type: "", landArea: "", buildingArea: "", price: "", projectId: "" });
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
    if (!editForm.landArea || parseFloat(editForm.landArea) <= 0) errs.landArea = "Harus angka positif";
    if (!editForm.buildingArea || parseFloat(editForm.buildingArea) <= 0) errs.buildingArea = "Harus angka positif";
    if (!editForm.price || parseFloat(editForm.price) <= 0) errs.price = "Harus angka positif";
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
        setUnits((prev) => prev.map((u) => (u.id === result.data.id ? result.data : u)));
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
      const response = await fetch(`/api/units/${deleteUnit.id}`, { method: "DELETE" });
      const result = await response.json();
      if (result.success) {
        setDeleteUnit(null);
        setUnits((prev) => prev.map((u) => (u.id === deleteUnit.id ? { ...u, isActive: false } : u)));
        showToast("Data unit berhasil dihapus");
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

      <div className="border-2 shadow-xl border-gray-200 dark:border-gray-800 rounded-2xl bg-gray-100 dark:bg-[#0f172a] text-gray-600 dark:text-gray-300 pt-4 md:p-5 md:pt-5 min-h-screen">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 px-4 md:px-0">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Master Unit Kavling</h1>
            <p className="text-sm text-gray-400 dark:text-gray-400 mt-3">Kelola persediaan unit perumahan dan kavling</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 h-11 bg-[#EA6C00] hover:bg-[#C25500] text-white text-sm font-bold rounded-[10px] shadow-lg shadow-orange-500/20 transition-all active:scale-95 ml-auto w-full md:w-auto justify-center md:justify-start"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Tambah Unit
          </button>
        </div>

        <div className="px-4 md:px-0 pb-10">
          {/* Filter bar */}
          <div className="sticky top-0 z-30 pt-2 pb-4 bg-gray-100 dark:bg-[#0f172a] -mx-4 md:-mx-0 px-4 md:px-0">
            <div className="flex flex-col md:flex-row items-center bg-white dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 rounded-[12px] shadow-sm p-1.5 min-h-[56px] md:h-14">
              <div className="flex flex-1 items-center px-3 gap-3 w-full h-full min-h-[44px]">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 text-gray-400 flex-shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                <input
                  type="text"
                  placeholder="Cari kode unit atau tipe..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 bg-transparent border-none focus:ring-0 outline-none text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 font-medium"
                />
                {searchTerm && (
                  <button type="button" onClick={() => setSearchTerm("")} className="p-1 text-gray-300 hover:text-gray-500 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
                  <div className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${showInactive ? "bg-[#EA6C00]" : "bg-gray-200 dark:bg-slate-700"}`}>
                    <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transform transition-transform ${showInactive ? "translate-x-4" : "translate-x-1"}`} />
                  </div>
                  Nonaktif
                </button>
                {/* Project filter */}
                <div className="relative" ref={projectRef}>
                  <button
                    type="button"
                    onClick={() => { setProjectDropdownOpen(!projectDropdownOpen); setStatusDropdownOpen(false); }}
                    className="flex items-center justify-between md:justify-start gap-2 w-full md:w-auto px-4 py-3 text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors whitespace-nowrap"
                  >
                    <span>{projectFilter === "SEMUA" ? "Semua Proyek" : projects.find((p) => p.id === projectFilter)?.name || "Pilih Proyek"}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${projectDropdownOpen ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  {projectDropdownOpen && (
                    <div className="absolute z-50 right-0 mt-3 w-56 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden flex flex-col p-1.5">
                      <button onClick={() => { setProjectFilter("SEMUA"); setProjectDropdownOpen(false); }} className={`flex items-center px-3 py-2 text-sm font-bold rounded-lg ${projectFilter === "SEMUA" ? "bg-orange-50 text-orange-600" : "text-gray-600 hover:bg-gray-50"}`}>Semua Proyek</button>
                      {projects.map((p) => (
                        <button key={p.id} onClick={() => { setProjectFilter(p.id); setProjectDropdownOpen(false); }} className={`flex items-center px-3 py-2 text-sm font-bold rounded-lg ${projectFilter === p.id ? "bg-orange-50 text-orange-600" : "text-gray-600 hover:bg-gray-50"}`}>{p.name}</button>
                      ))}
                    </div>
                  )}
                </div>
                {/* Status filter */}
                <div className="relative" ref={statusRef}>
                  <button
                    type="button"
                    onClick={() => { setStatusDropdownOpen(!statusDropdownOpen); setProjectDropdownOpen(false); }}
                    className="flex items-center justify-between md:justify-start gap-2 w-full md:w-auto px-4 py-3 text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors whitespace-nowrap"
                  >
                    <span>{statusFilter === "SEMUA" ? "Semua Status" : statusFilter}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${statusDropdownOpen ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  {statusDropdownOpen && (
                    <div className="absolute z-50 right-0 mt-3 w-56 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden flex flex-col p-1.5">
                      {["SEMUA", "TERSEDIA", "BOOKING", "INDENT", "AKAD", "LUNAS", "SERAH_TERIMA"].map((s) => (
                        <button key={s} onClick={() => { setStatusFilter(s); setStatusDropdownOpen(false); }} className={`flex items-center px-3 py-2 text-sm font-bold rounded-lg ${statusFilter === s ? "bg-orange-50 text-orange-600" : "text-gray-600 hover:bg-gray-50"}`}>{s}</button>
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
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Kode Unit</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Blok</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tipe</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Harga</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pelanggan</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700/50">
                  {filteredUnits.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-500 font-medium">
                        <div className="flex flex-col items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-gray-300">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5-11.5L3 18.75V21h.75v-.75" />
                          </svg>
                          Tidak ada data unit ditemukan.
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredUnits.map((u) => (
                      <tr key={u.id} className={`hover:bg-gray-50/80 dark:hover:bg-slate-700/30 transition-all group ${u.isActive === false ? "opacity-50" : ""}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-bold text-[#EA6C00]">{u.unitCode}</span>
                          {u.isActive === false && <span className="ml-2 text-[9px] font-black uppercase text-red-400 bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded-full">NONAKTIF</span>}
                        </td>
                        <td className="px-6 py-4 text-gray-700 dark:text-gray-300 font-medium whitespace-nowrap">
                          Blok {u.blockName} No. {u.unitNumber}
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400 font-medium">{u.type}</td>
                        <td className="px-6 py-4 font-bold text-gray-900 dark:text-gray-100">
                          Rp {new Intl.NumberFormat("id-ID").format(u.price)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ring-1 ring-inset ${getStatusBadge(u.status)}`}>
                            {u.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {u.customer ? (
                            <div className="flex flex-col">
                              <span className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-[#EA6C00] transition-colors">{u.customer.name}</span>
                              <span className="text-[10px] text-gray-400 font-medium uppercase">{u.customer.customerCode}</span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-gray-300 dark:text-slate-600 font-black italic uppercase tracking-wider">Tersedia</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Edit */}
                            {EDITABLE_STATUSES.includes(u.status) ? (
                              <button
                                onClick={() => openEditModal(u)}
                                title="Edit Unit"
                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-600 dark:hover:text-white transition-all"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                </svg>
                              </button>
                            ) : (
                              <div className="relative group/tooltip">
                                <button
                                  disabled
                                  title="Unit tidak dapat diedit karena sudah dalam proses transaksi"
                                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-300 bg-gray-50 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                  </svg>
                                </button>
                                <div className="absolute bottom-full right-0 mb-2 hidden group-hover/tooltip:block w-52 bg-gray-900 dark:bg-slate-700 text-white text-[11px] font-medium px-2.5 py-1.5 rounded-lg shadow-xl z-50 whitespace-normal text-center pointer-events-none">
                                  Unit tidak dapat diedit karena sudah dalam proses transaksi
                                  <div className="absolute top-full right-3 border-4 border-transparent border-t-gray-900 dark:border-t-slate-700" />
                                </div>
                              </div>
                            )}
                            {/* Detail */}
                            <button
                              onClick={() => setDetailId(u.id)}
                              title="Detail Unit"
                              className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-orange-600 bg-orange-50 hover:bg-orange-600 hover:text-white dark:bg-orange-900/20 dark:text-orange-400 dark:hover:bg-orange-600 dark:hover:text-white transition-all"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                              </svg>
                            </button>
                            {/* Assign / Unassign */}
                            {u.status === "TERSEDIA" && (
                              <button
                                onClick={() => { setShowAssignModal(u.id); setAssignData({ customerId: "" }); }}
                                title="Assign Pelanggan"
                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-emerald-600 bg-emerald-50 hover:bg-emerald-600 hover:text-white dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-600 dark:hover:text-white transition-all"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                                </svg>
                              </button>
                            )}
                            {/* Delete */}
                            {DELETABLE_STATUSES.includes(u.status) && u.isActive !== false && (
                              <button
                                onClick={() => setDeleteUnit(u)}
                                title="Hapus Unit"
                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-red-600 bg-red-50 hover:bg-red-600 hover:text-white dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-600 dark:hover:text-white transition-all"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ─── ADD UNIT MODAL ─────────────────────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Tambah Unit Baru</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleAddUnit} className="overflow-y-auto flex-1">
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className={labelCls}>Proyek *</label>
                    <select required value={formData.projectId} onChange={(e) => setFormData({ ...formData, projectId: e.target.value })} className={inputCls}>
                      <option value="">Pilih Proyek...</option>
                      {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Blok *</label>
                    <input type="text" required placeholder="Contoh: A, B, Mawar" value={formData.blockName} onChange={(e) => setFormData({ ...formData, blockName: e.target.value })} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Nomor Unit *</label>
                    <input type="text" required placeholder="Contoh: 01, 02a" value={formData.unitNumber} onChange={(e) => setFormData({ ...formData, unitNumber: e.target.value })} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Tipe (LB/LT) *</label>
                    <input type="text" required placeholder="Contoh: 36/72" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Harga *</label>
                    <input type="number" required placeholder="350000000" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Luas Bangunan (m2) *</label>
                    <input type="number" required value={formData.buildingArea} onChange={(e) => setFormData({ ...formData, buildingArea: e.target.value })} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Luas Tanah (m2) *</label>
                    <input type="number" required value={formData.landArea} onChange={(e) => setFormData({ ...formData, landArea: e.target.value })} className={inputCls} />
                  </div>
                </div>
              </div>
              <div className="p-5 border-t border-gray-100 dark:border-slate-700 flex justify-end gap-3 bg-gray-50/50 dark:bg-slate-800/30">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-5 h-11 text-sm font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-[10px] transition-all">Batal</button>
                <button type="submit" disabled={loading} className="px-6 h-11 bg-[#EA6C00] hover:bg-[#C25500] text-white text-sm font-bold rounded-[10px] shadow-lg shadow-orange-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center gap-2">
                  {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Memproses...</> : "Simpan Unit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── EDIT UNIT MODAL ─────────────────────────────────────────────────── */}
      {editUnit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-slate-700">
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Edit Unit</h2>
                <p className="text-xs text-gray-400 mt-0.5">Perbarui data unit kavling</p>
              </div>
              <button onClick={() => setEditUnit(null)} className="text-slate-400 hover:text-slate-600">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleEditUnit} className="overflow-y-auto flex-1">
              <div className="p-6 space-y-5">
                {/* Read-only section */}
                <div className="bg-gray-50 dark:bg-slate-900/50 rounded-xl p-4 space-y-3 border border-gray-100 dark:border-slate-700">
                  <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Informasi Read-Only</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className={labelCls}>Kode Unit</label>
                      <div className={readonlyCls}>{editUnit.unitCode}</div>
                      <p className="text-[10px] text-gray-400 mt-1">Kode unit tidak dapat diubah</p>
                    </div>
                    <div>
                      <label className={labelCls}>Status</label>
                      <div className="h-11 flex items-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ring-1 ring-inset ${getStatusBadge(editUnit.status)}`}>{editUnit.status}</span>
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>Pelanggan</label>
                      <div className={readonlyCls}>{editUnit.customer?.name || "—"}</div>
                      {editUnit.customer && <p className="text-[10px] text-gray-400 mt-1">Ubah pelanggan melalui fitur Assign/Unassign</p>}
                    </div>
                  </div>
                </div>

                {/* Editable fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className={labelCls}>Proyek *</label>
                    <select
                      value={editForm.projectId}
                      onChange={(e) => setEditForm({ ...editForm, projectId: e.target.value })}
                      className={`${inputCls} ${editErrors.projectId ? "border-red-400 focus:border-red-400" : ""}`}
                    >
                      <option value="">Pilih Proyek...</option>
                      {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    {editErrors.projectId && <p className="text-xs text-red-500 mt-1">{editErrors.projectId}</p>}
                  </div>
                  <div>
                    <label className={labelCls}>Blok *</label>
                    <input type="text" placeholder="Contoh: A" value={editForm.blockName} onChange={(e) => setEditForm({ ...editForm, blockName: e.target.value })} className={`${inputCls} ${editErrors.blockName ? "border-red-400 focus:border-red-400" : ""}`} />
                    {editErrors.blockName && <p className="text-xs text-red-500 mt-1">{editErrors.blockName}</p>}
                  </div>
                  <div>
                    <label className={labelCls}>Nomor Unit *</label>
                    <input type="text" placeholder="Contoh: 01" value={editForm.unitNumber} onChange={(e) => setEditForm({ ...editForm, unitNumber: e.target.value })} className={`${inputCls} ${editErrors.unitNumber ? "border-red-400 focus:border-red-400" : ""}`} />
                    {editErrors.unitNumber && <p className="text-xs text-red-500 mt-1">{editErrors.unitNumber}</p>}
                  </div>
                  <div>
                    <label className={labelCls}>Tipe (LB/LT) *</label>
                    <input type="text" placeholder="Contoh: 36/72" value={editForm.type} onChange={(e) => setEditForm({ ...editForm, type: e.target.value })} className={`${inputCls} ${editErrors.type ? "border-red-400 focus:border-red-400" : ""}`} />
                    {editErrors.type && <p className="text-xs text-red-500 mt-1">{editErrors.type}</p>}
                  </div>
                  <div>
                    <label className={labelCls}>Harga Jual (Rp) *</label>
                    <input type="number" min="1" placeholder="350000000" value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: e.target.value })} className={`${inputCls} ${editErrors.price ? "border-red-400 focus:border-red-400" : ""}`} />
                    {editErrors.price && <p className="text-xs text-red-500 mt-1">{editErrors.price}</p>}
                  </div>
                  <div>
                    <label className={labelCls}>Luas Bangunan (m²) *</label>
                    <input type="number" min="0.01" step="0.01" value={editForm.buildingArea} onChange={(e) => setEditForm({ ...editForm, buildingArea: e.target.value })} className={`${inputCls} ${editErrors.buildingArea ? "border-red-400 focus:border-red-400" : ""}`} />
                    {editErrors.buildingArea && <p className="text-xs text-red-500 mt-1">{editErrors.buildingArea}</p>}
                  </div>
                  <div>
                    <label className={labelCls}>Luas Tanah (m²) *</label>
                    <input type="number" min="0.01" step="0.01" value={editForm.landArea} onChange={(e) => setEditForm({ ...editForm, landArea: e.target.value })} className={`${inputCls} ${editErrors.landArea ? "border-red-400 focus:border-red-400" : ""}`} />
                    {editErrors.landArea && <p className="text-xs text-red-500 mt-1">{editErrors.landArea}</p>}
                  </div>
                </div>
              </div>
              <div className="p-5 border-t border-gray-100 dark:border-slate-700 flex justify-end gap-3 bg-gray-50/50 dark:bg-slate-800/30">
                <button type="button" onClick={() => setEditUnit(null)} className="px-5 h-11 text-sm font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-[10px] transition-all">Batal</button>
                <button type="submit" disabled={loading} className="px-6 h-11 bg-[#EA6C00] hover:bg-[#C25500] text-white text-sm font-bold rounded-[10px] shadow-lg shadow-orange-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center gap-2">
                  {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Menyimpan...</> : <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    Simpan Perubahan
                  </>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── ASSIGN MODAL ─────────────────────────────────────────────────────── */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-slate-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Assign Pelanggan ke Unit</h2>
              <button onClick={() => setShowAssignModal(null)} className="text-gray-400 hover:text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleAssign} className="p-6 space-y-5">
              <div>
                <label className={labelCls}>Pilih Pelanggan *</label>
                <select required value={assignData.customerId} onChange={(e) => setAssignData({ customerId: e.target.value })} className={inputCls}>
                  <option value="">Pilih pelanggan...</option>
                  {customers.map((c) => <option key={c.id} value={c.id}>{c.customerCode} - {c.name} ({c.paymentMethod})</option>)}
                </select>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowAssignModal(null)} className="px-5 h-11 text-sm font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-[10px] transition-all">Batal</button>
                <button type="submit" disabled={loading} className="px-6 h-11 bg-[#EA6C00] hover:bg-[#C25500] text-white text-sm font-bold rounded-[10px] shadow-lg shadow-orange-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2">
                  {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Memproses...</> : "Assign Unit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── DELETE CONFIRM MODAL ─────────────────────────────────────────────── */}
      {deleteUnit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Hapus Unit</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Tindakan ini tidak dapat dibatalkan.</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-slate-900/50 rounded-xl p-4">
                Apakah Anda yakin ingin menghapus unit <span className="font-bold text-[#EA6C00]">{deleteUnit.unitCode}</span> (Blok {deleteUnit.blockName} No. {deleteUnit.unitNumber})?
              </p>
            </div>
            <div className="px-6 pb-6 flex justify-end gap-3">
              <button onClick={() => setDeleteUnit(null)} className="px-5 h-11 text-sm font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-[10px] transition-all">Batal</button>
              <button
                onClick={handleDeleteUnit}
                disabled={loading}
                className="px-6 h-11 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-[10px] shadow-lg shadow-red-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Menghapus...</> : "Ya, Hapus Unit"}
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
