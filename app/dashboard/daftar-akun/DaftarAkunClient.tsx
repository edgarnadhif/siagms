"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteAccount } from "@/app/actions";
import AddAkunModal from "./AddAkunModal";
import EditAkunModal from "./EditAkunModal";

interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
  normalBalance: string;
  description: string | null;
  isActive: boolean;
  isSystem: boolean;
}

const TYPE_LABELS: Record<string, string> = {
  ASET: "Aset",
  KEWAJIBAN: "Kewajiban",
  EKUITAS: "Ekuitas",
  PENDAPATAN: "Pendapatan",
  BEBAN: "Beban",
};

const TYPE_COLORS: Record<string, string> = {
  ASET: "bg-[#E6F1FB] text-[#185FA5] dark:bg-blue-900/40 dark:text-blue-300",
  KEWAJIBAN:
    "bg-[#FFF0E6] text-[#EA6C00] dark:bg-orange-900/40 dark:text-orange-300",
  EKUITAS:
    "bg-[#F3E8FF] text-[#7E22CE] dark:bg-purple-900/40 dark:text-purple-300",
  PENDAPATAN:
    "bg-[#DCFCE7] text-[#15803D] dark:bg-emerald-900/40 dark:text-emerald-300",
  BEBAN: "bg-[#FEE2E2] text-[#B91C1C] dark:bg-red-900/40 dark:text-red-300",
};

const BALANCE_COLORS: Record<string, string> = {
  DEBIT: "text-[#185FA5] bg-[#E6F1FB]",
  KREDIT: "text-[#EA6C00] bg-[#FFF0E6]",
};

export default function DaftarAkunClient({
  grouped,
  search,
  type,
  showAddModal,
}: {
  grouped: Record<string, Account[]>;
  search: string;
  type: string;
  showAddModal: boolean;
}) {
  const router = useRouter();
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    show: boolean;
    id: string | null;
    name: string;
  }>({ show: false, id: null, name: "" });
  const [isDeleting, setIsDeleting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState(search);
  const [toasts, setToasts] = useState<{ id: number; message: string; type: "success" | "error" }[]>([]);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const removeToast = React.useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = React.useCallback((message: string, type: "success" | "error") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 5000);
  }, [removeToast]);

  const totalAccounts = Object.values(grouped).reduce(
    (sum, accounts) => sum + accounts.length,
    0,
  );

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  React.useEffect(() => {
    const timeout = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      const trimmedSearch = localSearch.trim();
      if (trimmedSearch) params.set("search", trimmedSearch);
      else params.delete("search");

      const query = params.toString();
      router.replace(`${window.location.pathname}${query ? `?${query}` : ""}`);
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [localSearch, router]);

  const typeOrder = ["ASET", "KEWAJIBAN", "EKUITAS", "PENDAPATAN", "BEBAN"];

  const handleDelete = (account: Account) => {
    setDeleteModal({
      show: true,
      id: account.id,
      name: account.name,
    });
  };

  const confirmDelete = async () => {
    if (!deleteModal.id) return;
    setIsDeleting(true);
    const result = await deleteAccount(deleteModal.id);
    if (result?.error) {
      showToast(result.error, "error");
      setIsDeleting(false);
    } else {
      showToast("Akun berhasil dihapus", "error");
      setIsDeleting(false);
      setDeleteModal({ show: false, id: null, name: "" });
      router.refresh();
    }
  };

  return (
    <div className="text-gray-600 dark:text-gray-300 w-full h-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 px-4 md:px-0">
        <div>
          <h1 className="page-title dark:text-gray-100">Daftar Akun</h1>
          <p className="card-subtitle text-gray-400 dark:text-gray-400 mt-2">
            Kelola daftar akun keuangan
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
          Tambah Akun
        </Link>
      </div>

      <div className="px-4 md:px-0 pb-10">
      {/* Action Bar (Search) */}
      <div className="sticky -top-6 z-30 pt-2 pb-3 bg-white dark:bg-[#111827] -mx-6 px-6">
        <div className="w-full">
          <div className="flex flex-col md:flex-row flex-wrap items-center gap-3 w-full">
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
                placeholder="Cari kode atau nama akun..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="flex-1 bg-transparent border-none focus:ring-0 outline-none text-sm font-medium text-slate-700 dark:text-slate-200 placeholder:font-normal placeholder:text-slate-400"
              />
              {localSearch && (
                <button
                  type="button"
                  onClick={() => setLocalSearch("")}
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

            {/* Type Dropdown */}
            <div
              className="w-full md:w-[150px] lg:w-[160px] relative"
              ref={dropdownRef}
            >
              <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full h-11 inline-flex items-center justify-between px-3 bg-white dark:bg-slate-800 border-[0.5px] border-[#E5E7EB] dark:border-slate-700 rounded-xl transition-colors"
              >
                <span className="text-sm font-normal text-slate-700 dark:text-slate-200 truncate">
                  {type ? TYPE_LABELS[type] : "Semua Tipe"}
                </span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
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

              {isOpen && (
                <div className="absolute z-50 right-0 mt-2 w-56 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden flex flex-col p-1 animate-in fade-in zoom-in-95 duration-200">
                  <button
                    type="button"
                    onClick={() => {
                      const params = new URLSearchParams(
                        window.location.search,
                      );
                      params.delete("type");
                      if (localSearch.trim()) {
                        params.set("search", localSearch.trim());
                      } else {
                        params.delete("search");
                      }
                      router.replace(
                        `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`,
                      );
                      setIsOpen(false);
                    }}
                    className={`text-left px-3 py-2 text-sm rounded-md transition-colors ${!type ? "bg-slate-50 text-slate-900 font-medium dark:bg-slate-700 dark:text-white" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"}`}
                  >
                    Semua Tipe
                  </button>
                  {Object.entries(TYPE_LABELS).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        const params = new URLSearchParams(
                        window.location.search,
                      );
                      params.set("type", key);
                      if (localSearch.trim()) {
                        params.set("search", localSearch.trim());
                      } else {
                        params.delete("search");
                      }
                      router.replace(
                        `${window.location.pathname}?${params.toString()}`,
                      );
                      setIsOpen(false);
                    }}
                      className={`text-left px-3 py-2 text-sm rounded-md transition-colors ${type === key ? "bg-slate-50 text-slate-900 font-medium dark:bg-slate-700 dark:text-white" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

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

      {/* Empty state */}
      {totalAccounts === 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center border-[0.5px] border-[#E5E7EB] dark:border-slate-700 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            Belum ada akun terdaftar.
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Klik tombol &quot;Tambah Akun&quot; untuk memulai.
          </p>
        </div>
      )}

      {/* Account Groups */}
      <div className="space-y-4 mb-10">
        {typeOrder.map((typeKey) => {
          const accounts = grouped[typeKey];
          if (!accounts || accounts.length === 0) return null;

          return (
            <div
              key={typeKey}
              className="bg-white dark:bg-slate-800 border-[0.5px] border-[#E5E7EB] dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden"
            >
              {/* Group Header */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-700/50">
                <span
                  className={`px-3 py-1 font-semibold text-xs rounded-full ${TYPE_COLORS[typeKey]}`}
                >
                  {TYPE_LABELS[typeKey]}
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500 font-medium tracking-tight">
                  {accounts.length} akun
                </span>
              </div>

              {/* Table */}
              {/* Table */}
              <div className="overflow-x-auto scrollbar-hide">
                <table className="w-full border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-800/50">
                    <tr className="border-b border-slate-100 dark:border-slate-700/50">
                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400 w-[120px]">
                        KODE
                      </th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400 w-[240px]">
                        NAMA AKUN
                      </th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400 w-[150px]">
                        SALDO NORMAL
                      </th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
                        KETERANGAN
                      </th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400 w-[120px]">
                        STATUS
                      </th>
                      <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400 w-[100px]">
                        AKSI
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                    {accounts.map((akun, idx) => (
                      <tr
                        key={akun.id}
                        className={`hover:bg-slate-50/60 dark:hover:bg-slate-700/30 transition-colors ${idx === accounts.length - 1 ? "border-b-0" : "border-b border-slate-100 dark:border-slate-700/50"}`}
                      >
                        <td className="px-5 py-3.5 whitespace-nowrap text-sm font-semibold text-slate-900 dark:text-white">
                          {akun.code}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-900 dark:text-white">
                              {akun.name}
                            </span>
                            {akun.isSystem && (
                              <span className="inline-flex items-center p-1 rounded-md bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700" title="Sistem">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                                  <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                                </svg>
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span
                            className={`text-[11px] font-semibold px-2.5 py-1 rounded-md inline-flex items-center tracking-wide ${BALANCE_COLORS[akun.normalBalance]}`}
                          >
                            {akun.normalBalance === "DEBIT"
                              ? "Debit"
                              : "Kredit"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-sm font-medium text-slate-500 dark:text-slate-400">
                          {akun.description || "-"}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-sm">
                          {akun.isActive ? (
                            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-[13px]">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                              Aktif
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500 font-medium text-[13px]">
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                              Nonaktif
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-1">
                            {/* Edit Button */}
                            <div className="relative group/tooltip">
                              <button
                                onClick={() => !akun.isSystem && setEditingAccount(akun)}
                                disabled={akun.isSystem}
                                className={`w-8 h-8 inline-flex items-center justify-center rounded-lg transition-colors ${
                                  akun.isSystem
                                    ? "text-slate-200 dark:text-slate-700 cursor-not-allowed"
                                    : "text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                                }`}
                                title={akun.isSystem ? "Akun sistem tidak dapat diubah" : "Edit"}
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
                                    d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L5.32 18.67l1.47-3.32a4.5 4.5 0 011.13-1.897l8.94-8.94zM16.862 4.487L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                                  />
                                </svg>
                              </button>
                              {akun.isSystem && (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
                                  Akun sistem tidak dapat diubah
                                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
                                </div>
                              )}
                            </div>

                            {/* Delete Button */}
                            <div className="relative group/tooltip">
                              <button
                                onClick={() => !akun.isSystem && handleDelete(akun)}
                                disabled={isDeleting || akun.isSystem}
                                className={`w-8 h-8 inline-flex items-center justify-center rounded-lg transition-colors disabled:opacity-50 ${
                                  akun.isSystem
                                    ? "text-slate-200 dark:text-slate-700 cursor-not-allowed"
                                    : "text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30"
                                }`}
                                title={akun.isSystem ? "Akun sistem tidak dapat dihapus" : "Hapus"}
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
                                    d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                                  />
                                </svg>
                              </button>
                              {akun.isSystem && (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
                                  Akun sistem tidak dapat dihapus
                                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
      </div>

      {/* Add Modal */}
      {showAddModal && <AddAkunModal showToast={showToast} />}

      {/* Edit Modal */}
      {editingAccount && (
        <EditAkunModal
          account={editingAccount}
          onClose={() => setEditingAccount(null)}
          showToast={showToast}
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
              Hapus Akun?
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-center mb-8">
              Akun <span className="font-semibold text-slate-900 dark:text-slate-200">{deleteModal.name}</span> akan dihapus secara permanen.
            </p>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setDeleteModal({ show: false, id: null, name: "" })}
                className="flex-1 h-12 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-[0.98]"
              >
                Batal
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex-1 h-12 rounded-xl bg-rose-500 text-white font-semibold hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting ? (
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
