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
  ASET: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
  KEWAJIBAN: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400",
  EKUITAS: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
  PENDAPATAN: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
  BEBAN: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
};

const BALANCE_COLORS: Record<string, string> = {
  DEBIT: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/10",
  KREDIT: "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/10",
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

  const typeOrder = ["ASET", "KEWAJIBAN", "EKUITAS", "PENDAPATAN", "BEBAN"];

  const handleDelete = async (id: string) => {
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
    <div className="border-2 shadow-xl border-gray-200 dark:border-gray-800 rounded-2xl bg-gray-100 dark:bg-[#0f172a] text-gray-600 dark:text-gray-300 p-6 md:p-8 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-gray-100">
            Daftar Akun
          </h1>
          <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
            Chart of Accounts — {totalCount} akun terdaftar
          </p>
        </div>
        <Link
          href="?add=true"
          className="flex items-center gap-2 px-4 py-2 bg-[#0f172a] hover:bg-slate-800 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Tambah Akun
        </Link>
      </div>

      {/* Filters */}
      <form className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
        <div className="relative w-full md:w-[400px]">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
          <input
            type="text"
            name="search"
            defaultValue={search}
            placeholder="Cari kode atau nama akun..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-slate-800 dark:text-white placeholder-slate-400 transition-colors bg-white"
          />
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <select
            name="type"
            defaultValue={type}
            className="w-full md:w-48 px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none cursor-pointer transition-colors pr-10"
            style={{
              backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2364748B%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E")`,
              backgroundSize: "16px 16px",
              backgroundPosition: "right 12px center",
              backgroundRepeat: "no-repeat",
            }}
          >
            <option value="">Semua Tipe</option>
            <option value="ASET">Aset</option>
            <option value="KEWAJIBAN">Kewajiban</option>
            <option value="EKUITAS">Ekuitas</option>
            <option value="PENDAPATAN">Pendapatan</option>
            <option value="BEBAN">Beban</option>
          </select>
          <button
            type="submit"
            className="px-4 py-2 bg-gray-900 dark:bg-slate-700 hover:bg-gray-800 dark:hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Cari
          </button>
        </div>
      </form>

      {/* Stats info */}
      {(search || type) && (
        <div className="flex items-center gap-4 mb-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            <span className="font-bold text-gray-800 dark:text-gray-200">{totalCount}</span>{" "}akun ditemukan
            {search && <span> untuk &quot;<span className="font-medium">{search}</span>&quot;</span>}
            {type && <span> · Tipe: <span className="font-medium">{TYPE_LABELS[type] || type}</span></span>}
          </p>
          <Link href="/dashboard/daftar-akun" className="text-xs text-red-500 hover:text-red-600 font-medium transition-colors">
            Reset filter
          </Link>
        </div>
      )}

      {/* Delete error toast */}
      {deleteError && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-100 dark:border-red-800">
          {deleteError}
        </div>
      )}

      {/* Empty state */}
      {totalCount === 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center border border-gray-200 dark:border-slate-700">
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
      <div className="space-y-6">
        {typeOrder.map((typeKey) => {
          const accounts = grouped[typeKey];
          if (!accounts || accounts.length === 0) return null;

          return (
            <div key={typeKey} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
              {/* Group Header */}
              <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-200 dark:border-slate-700">
                <span className={`px-3 py-1 font-bold text-sm rounded-full ${TYPE_COLORS[typeKey]}`}>
                  {TYPE_LABELS[typeKey]}
                </span>
                <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                  {accounts.length} akun
                </span>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead className="bg-[#f8fafc] dark:bg-slate-800/80 border-b border-gray-200 dark:border-slate-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider w-[120px]">KODE</th>
                      <th className="px-6 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider w-[200px]">NAMA AKUN</th>
                      <th className="px-6 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider w-[150px]">SALDO NORMAL</th>
                      <th className="px-6 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">KETERANGAN</th>
                      <th className="px-6 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider w-[100px]">STATUS</th>
                      <th className="px-6 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider w-[100px]">AKSI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-700/50">
                    {accounts.map((akun) => (
                      <tr key={akun.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-800 dark:text-slate-200">
                          {akun.code}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-800 dark:text-slate-200">
                          {akun.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm font-medium px-2.5 py-1 rounded inline-flex items-center ${BALANCE_COLORS[akun.normalBalance]}`}>
                            {akun.normalBalance === "DEBIT" ? "Debit" : "Kredit"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                          {akun.description || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {akun.isActive ? (
                            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Aktif
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500 font-medium">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                              </svg>
                              Nonaktif
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          <div className="flex items-center gap-3 opacity-70 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => setEditingAccount(akun)}
                              className="text-slate-400 hover:text-blue-600 transition-colors"
                              title="Edit"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L5.32 18.67l1.47-3.32a4.5 4.5 0 011.13-1.897l8.94-8.94zM16.862 4.487L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(akun.id)}
                              disabled={deletingId === akun.id}
                              className="text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
                              title="Hapus"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
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
