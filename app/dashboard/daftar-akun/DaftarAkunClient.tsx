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
  KEWAJIBAN: "bg-[#FFF0E6] text-[#EA6C00] dark:bg-orange-900/40 dark:text-orange-300",
  EKUITAS: "bg-[#F3E8FF] text-[#7E22CE] dark:bg-purple-900/40 dark:text-purple-300",
  PENDAPATAN: "bg-[#DCFCE7] text-[#15803D] dark:bg-emerald-900/40 dark:text-emerald-300",
  BEBAN: "bg-[#FEE2E2] text-[#B91C1C] dark:bg-red-900/40 dark:text-red-300",
};

const BALANCE_COLORS: Record<string, string> = {
  DEBIT: "text-[#185FA5] bg-[#E6F1FB]",
  KREDIT: "text-[#EA6C00] bg-[#FFF0E6]",
};

export default function DaftarAkunClient({
  grouped,
  totalCount,
  search,
  type,
  showAddModal,
}: {
  grouped: Record<string, Account[]>;
  totalCount: number;
  search: string;
  type: string;
  showAddModal: boolean;
}) {
  const router = useRouter();
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const typeOrder = ["ASET", "KEWAJIBAN", "EKUITAS", "PENDAPATAN", "BEBAN"];

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus akun ini?")) return;
    setDeletingId(id);
    setDeleteError("");
    const result = await deleteAccount(id);
    if (result?.error) {
      setDeleteError(result.error);
      setDeletingId(null);
    } else {
      setDeletingId(null);
      router.refresh();
    }
  };

  return (
    <div className="border-2 shadow-xl border-gray-200 dark:border-gray-800 rounded-2xl bg-gray-100 dark:bg-[#0f172a] text-gray-600 dark:text-gray-300 pt-4 md:p-5 md:pt-5 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 px-4 md:px-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
            Daftar Akun
          </h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-3">
            Chart of Accounts — <span className="font-semibold text-[#EA6C00]">{totalCount}</span> akun terdaftar
          </p>
        </div>
        <Link
          href="?add=true"
          className="flex items-center gap-2 px-5 h-11 bg-[#EA6C00] hover:bg-[#C25500] text-white text-sm font-bold rounded-[10px] shadow-lg shadow-orange-500/20 transition-all active:scale-95 ml-auto w-full md:w-auto justify-center md:justify-start"
        >
          Tambah Akun
          <span className="text-xl leading-none font-light">+</span>
        </Link>
      </div>

      {/* Action Bar (Search) */}
      <div className="sticky top-0 z-30 pt-2 pb-4 bg-gray-100 dark:bg-[#0f172a] -mx-4 md:-mx-0 px-4 md:px-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const s = formData.get("search") as string;
            const params = new URLSearchParams(window.location.search);
            if (s) params.set("search", s); else params.delete("search");
            if (type) params.set("type", type); else params.delete("type");
            router.replace(`${window.location.pathname}?${params.toString()}`);
          }}
          className="w-full"
        >
          <div className="flex flex-col md:flex-row items-center bg-white dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 rounded-[12px] shadow-sm focus-within:ring-2 focus-within:ring-[#EA6C00]/10 focus-within:border-[#EA6C00] transition-all p-1.5 min-h-[56px] md:h-14 w-full">
            {/* Search Input Section */}
            <div className="flex flex-1 items-center px-3 gap-3 w-full h-full min-h-[44px]">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 text-gray-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                type="text"
                name="search"
                defaultValue={search}
                placeholder="Cari kode atau nama akun..."
                className="w-full bg-transparent border-none focus:ring-0 outline-none text-sm py-2 text-gray-900 dark:text-gray-100 placeholder-gray-400 font-medium"
              />
            </div>

            <div className="h-6 w-[1px] bg-gray-100 dark:bg-slate-700 mx-1 hidden md:block" />

            {/* Type Dropdown */}
            <div className="relative w-full md:w-auto" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full md:w-auto gap-2 px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors whitespace-nowrap"
              >
                <span>{type ? TYPE_LABELS[type] : "Semua Tipe"}</span>
                <svg xmlns="http://www.w3.org/2000/svg" className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>

              {isOpen && (
                <div className="absolute z-50 right-0 mt-3 w-52 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden flex flex-col p-1.5 font-medium transition-all">
                  <button
                    type="button"
                    onClick={() => {
                      const params = new URLSearchParams(window.location.search);
                      params.delete("type");
                      router.replace(`${window.location.pathname}?${params.toString()}`);
                      setIsOpen(false);
                    }}
                    className={`text-left px-3 py-2 text-sm font-semibold rounded-md transition-colors ${!type ? "bg-[#EA6C00] text-white" : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-[#EA6C00]"}`}
                  >
                    Semua Tipe
                  </button>
                  {Object.entries(TYPE_LABELS).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        const params = new URLSearchParams(window.location.search);
                        params.set("type", key);
                        router.replace(`${window.location.pathname}?${params.toString()}`);
                        setIsOpen(false);
                      }}
                      className={`text-left px-3 py-2 text-sm font-semibold rounded-md transition-colors ${type === key ? "bg-[#EA6C00] text-white" : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-[#EA6C00]"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Circular Search Button */}
            <button
              type="submit"
              className="ml-2 w-11 h-11 bg-[#EA6C00] hover:bg-[#C25500] text-white rounded-full transition-all shadow-md shadow-orange-500/20 flex items-center justify-center group flex-shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </button>
          </div>
        </form>
      </div>

      {/* Delete error toast */}
      {deleteError && (
        <div className="mb-4 mx-4 md:mx-0 p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-100 dark:border-red-800">
          {deleteError}
        </div>
      )}

      {/* Empty state */}
      {totalCount === 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center border border-gray-200 dark:border-slate-700 mx-4 md:mx-0">
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Belum ada akun terdaftar.</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Klik tombol &quot;Tambah Akun&quot; untuk memulai.
          </p>
        </div>
      )}

      {/* Account Groups */}
      <div className="space-y-6 px-4 md:px-0 mb-10">
        {typeOrder.map((typeKey) => {
          const accounts = grouped[typeKey];
          if (!accounts || accounts.length === 0) return null;

          return (
            <div key={typeKey} className="bg-white dark:bg-slate-800 rounded-[14px] border-[0.5px] border-[#E5E7EB] dark:border-slate-700 shadow-sm overflow-hidden">
              {/* Group Header */}
              <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 dark:border-slate-700">
                <span className={`px-3 py-1 font-bold text-xs rounded-full ${TYPE_COLORS[typeKey]}`}>
                  {TYPE_LABELS[typeKey]}
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500 font-medium tracking-tight">
                  {accounts.length} akun
                </span>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead className="bg-[#F9FAFB] dark:bg-slate-800/80 border-b border-gray-100 dark:border-slate-700">
                    <tr>
                      <th className="px-6 py-4 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-[0.15em] w-[120px]">KODE</th>
                      <th className="px-6 py-4 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-[0.15em] w-[200px]">NAMA AKUN</th>
                      <th className="px-6 py-4 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-[0.15em] w-[140px]">SALDO NORMAL</th>
                      <th className="px-6 py-4 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-[0.15em]">KETERANGAN</th>
                      <th className="px-6 py-4 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-[0.15em] w-[100px]">STATUS</th>
                      <th className="px-6 py-4 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-[0.15em] w-[100px]">AKSI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
                    {accounts.map((akun) => (
                      <tr key={akun.id} className="hover:bg-[#FFF0E6]/30 dark:hover:bg-slate-700/40 transition-all duration-150 group">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-800 dark:text-slate-200">
                          {akun.code}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900 dark:text-gray-100">
                          {akun.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-md inline-flex items-center tracking-wide ${BALANCE_COLORS[akun.normalBalance]}`}>
                            {akun.normalBalance === "DEBIT" ? "DEBIT" : "KREDIT"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {akun.description || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => setEditingAccount(akun)}
                              className="text-gray-400 hover:text-[#EA6C00] transition-colors"
                              title="Edit"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L5.32 18.67l1.47-3.32a4.5 4.5 0 011.13-1.897l8.94-8.94zM16.862 4.487L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(akun.id)}
                              disabled={deletingId === akun.id}
                              className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                              title="Hapus"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                              </svg>
                            </button>
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

      {/* Add Modal */}
      {showAddModal && <AddAkunModal />}

      {/* Edit Modal */}
      {editingAccount && (
        <EditAkunModal
          account={editingAccount}
          onClose={() => setEditingAccount(null)}
        />
      )}
    </div>
  );
}
