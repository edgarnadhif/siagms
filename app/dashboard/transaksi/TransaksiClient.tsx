"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteTransaction } from "@/app/actions";
import AddTransaksiModal from "./AddTransaksiModal";

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
}

interface Project {
  id: string;
  code: string;
  name: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  BOOKING_FEE: "Booking Fee",
  DOWN_PAYMENT: "Down Payment",
  BIAYA_PROYEK: "Biaya Proyek",
  BIAYA_OPERASIONAL: "Biaya Operasional",
};

const CATEGORY_COLORS: Record<string, string> = {
  BOOKING_FEE: "text-blue-700 bg-blue-100 border-blue-200 dark:text-blue-400 dark:bg-blue-900/30 dark:border-blue-800",
  DOWN_PAYMENT: "text-emerald-700 bg-emerald-100 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-900/30 dark:border-emerald-800",
  BIAYA_PROYEK: "text-orange-700 bg-orange-100 border-orange-200 dark:text-orange-400 dark:bg-orange-900/30 dark:border-orange-800",
  BIAYA_OPERASIONAL: "text-red-700 bg-red-100 border-red-200 dark:text-red-400 dark:bg-red-900/30 dark:border-red-800",
};

function formatRupiah(num: number) {
  return "Rp " + num.toLocaleString("id-ID");
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${d.getDate().toString().padStart(2, "0")} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export default function TransaksiClient({
  transactions,
  projects,
  search,
  category,
  projectFilter,
  showAddModal,
}: {
  transactions: Transaction[];
  projects: Project[];
  search: string;
  category: string;
  projectFilter: string;
  showAddModal: boolean;
}) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus transaksi ini?")) return;
    setDeletingId(id);
    setDeleteError("");
    const result = await deleteTransaction(id);
    if (result?.error) {
      setDeleteError(result.error);
    }
    setDeletingId(null);
    router.refresh();
  };

  return (
    <div className="border-2 shadow-xl border-gray-200 dark:border-gray-800 rounded-2xl bg-gray-100 dark:bg-[#0f172a] text-gray-600 dark:text-gray-300 p-6 md:p-8 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-gray-100">
            Transaksi
          </h1>
          <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
            Kelola semua transaksi keuangan
          </p>
        </div>
        <Link
          href="?add=true"
          className="flex items-center gap-2 px-4 py-2 bg-[#0f172a] hover:bg-slate-800 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Tambah Transaksi
        </Link>
      </div>

      {deleteError && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-100 dark:border-red-800">
          {deleteError}
        </div>
      )}

      {/* Main Card */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
        {/* Filters */}
        <form className="p-4 border-b border-gray-200 dark:border-slate-700 flex flex-col md:flex-row gap-4 justify-between items-center">
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
              placeholder="Cari keterangan atau referensi..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-slate-800 dark:text-white placeholder-slate-400 transition-colors"
            />
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            <select
              name="category"
              defaultValue={category}
              className="w-full md:w-40 px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none cursor-pointer transition-colors pr-10"
              style={{
                backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2364748B%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E")`,
                backgroundSize: "16px 16px",
                backgroundPosition: "right 12px center",
                backgroundRepeat: "no-repeat",
              }}
            >
              <option value="">Semua Kategori</option>
              <option value="BOOKING_FEE">Booking Fee</option>
              <option value="DOWN_PAYMENT">Down Payment</option>
              <option value="BIAYA_PROYEK">Biaya Proyek</option>
              <option value="BIAYA_OPERASIONAL">Biaya Operasional</option>
            </select>

            <select
              name="project"
              defaultValue={projectFilter}
              className="w-full md:w-40 px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none cursor-pointer transition-colors pr-10"
              style={{
                backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2364748B%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E")`,
                backgroundSize: "16px 16px",
                backgroundPosition: "right 12px center",
                backgroundRepeat: "no-repeat",
              }}
            >
              <option value="">Semua Proyek</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.code} — {p.name}</option>
              ))}
            </select>

            <button
              type="submit"
              className="px-4 py-2 bg-gray-900 dark:bg-slate-700 hover:bg-gray-800 dark:hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
            >
              Cari
            </button>
          </div>
        </form>

        {/* Count */}
        <div className="px-5 py-3 border-b border-gray-100 dark:border-slate-800/50 bg-white dark:bg-slate-800">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {transactions.length} transaksi
          </p>
        </div>

        {/* Table */}
        {transactions.length === 0 ? (
          <div className="p-12 text-center text-gray-400 dark:text-gray-500">
            <p className="font-medium">Belum ada transaksi.</p>
            <p className="text-sm mt-1">Klik &quot;Tambah Transaksi&quot; untuk memulai.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-[#f8fafc] dark:bg-slate-800/80 border-b border-gray-200 dark:border-slate-700">
                <tr>
                  <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider w-[120px]">TANGGAL</th>
                  <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider w-[140px]">NO. REFERENSI</th>
                  <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">KETERANGAN</th>
                  <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider w-[100px]">PROYEK</th>
                  <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider w-[160px]">KATEGORI</th>
                  <th className="px-5 py-3 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider w-[160px]">JUMLAH (RP)</th>
                  <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider w-[80px]">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700/50 bg-white dark:bg-slate-800">
                {transactions.map((trx) => (
                  <tr key={trx.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors group">
                    <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
                      {formatDate(trx.date)}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-slate-800 dark:text-slate-200">
                      {trx.reference}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{trx.description}</span>
                        {trx.note && <span className="text-xs text-slate-500 dark:text-slate-400">{trx.note}</span>}
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      {trx.projectCode}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${CATEGORY_COLORS[trx.category] || ""}`}>
                        {CATEGORY_LABELS[trx.category] || trx.category}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-slate-800 dark:text-slate-200 text-right">
                      {formatRupiah(trx.amount)}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-slate-500">
                      <div className="flex items-center gap-3 opacity-70 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleDelete(trx.id)}
                          disabled={deletingId === trx.id}
                          className="text-slate-400 hover:text-red-600 transition-colors disabled:opacity-50"
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
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && <AddTransaksiModal projects={projects} />}
    </div>
  );
}
