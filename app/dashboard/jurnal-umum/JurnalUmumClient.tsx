"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteJournalEntriesByReference } from "@/app/actions";
import AddJurnalModal from "./AddJurnalModal";

interface JournalGroup {
  reference: string;
  date: string;
  description: string | null;
  entries: { id: string; accountCode: string; accountName: string; debit: number; credit: number }[];
  totalDebit: number;
  totalCredit: number;
}

interface Account {
  id: string;
  code: string;
  name: string;
}

function formatRupiah(num: number) {
  return "Rp " + num.toLocaleString("id-ID");
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${d.getDate().toString().padStart(2, "0")} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export default function JurnalUmumClient({
  journals,
  accounts,
  search,
  showAddModal,
}: {
  journals: JournalGroup[];
  accounts: Account[];
  search: string;
  showAddModal: boolean;
}) {
  const router = useRouter();
  const [deletingRef, setDeletingRef] = useState<string | null>(null);

  const handleDelete = async (reference: string) => {
    if (!confirm(`Yakin ingin menghapus jurnal ${reference}?`)) return;
    setDeletingRef(reference);
    await deleteJournalEntriesByReference(reference);
    setDeletingRef(null);
    router.refresh();
  };

  return (
    <div className="border-2 shadow-xl border-gray-200 dark:border-gray-800 rounded-2xl bg-gray-100 dark:bg-[#0f172a] text-gray-600 dark:text-gray-300 p-6 md:p-8 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-gray-100">
            Jurnal Umum
          </h1>
          <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
            Pencatatan debit dan kredit
          </p>
        </div>
        <Link
          href="?add=true"
          className="flex items-center gap-2 px-4 py-2 bg-[#0f172a] hover:bg-slate-800 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Tambah Jurnal
        </Link>
      </div>

      {/* Search */}
      <form className="relative w-full md:w-[400px] mb-6">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        </div>
        <input
          type="text"
          name="search"
          defaultValue={search}
          placeholder="Cari jurnal..."
          className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-slate-800 dark:text-white placeholder-slate-400 transition-colors bg-white"
        />
      </form>

      {/* List */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-700/80">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {journals.length} entri jurnal
          </p>
        </div>

        {journals.length === 0 ? (
          <div className="p-12 text-center text-gray-400 dark:text-gray-500">
            <p className="font-medium">Belum ada jurnal.</p>
            <p className="text-sm mt-1">Klik &quot;Tambah Jurnal&quot; untuk memulai.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-slate-700/80">
            {journals.map((journal) => (
              <div key={journal.reference} className="p-5 hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors">
                {/* Journal Header */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{journal.reference}</span>
                      <span className="text-sm text-slate-400 dark:text-slate-500">{formatDate(journal.date)}</span>
                    </div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{journal.description || "-"}</p>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-[#0f172a] dark:text-white">{formatRupiah(journal.totalDebit)}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDelete(journal.reference)}
                        disabled={deletingRef === journal.reference}
                        className="text-red-400 hover:text-red-600 transition-colors p-1 disabled:opacity-50"
                        title="Hapus"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sub Table */}
                <div className="w-full">
                  <div className="flex px-4 md:px-8 text-xs font-semibold text-[#64748b] dark:text-slate-400 mb-2 mt-4">
                    <div className="flex-1 text-left">Akun</div>
                    <div className="w-[120px] md:w-[200px] text-right">Debit</div>
                    <div className="w-[120px] md:w-[200px] text-right">Kredit</div>
                  </div>

                  <div className="space-y-1">
                    {journal.entries.map((entry) => (
                      <div key={entry.id} className="flex px-4 md:px-8 text-xs text-[#475569] dark:text-slate-400 py-1">
                        <div className="flex-1">{entry.accountCode} — {entry.accountName}</div>
                        <div className="w-[120px] md:w-[200px] text-right">
                          {entry.debit > 0 ? formatRupiah(entry.debit) : ""}
                        </div>
                        <div className="w-[120px] md:w-[200px] text-right">
                          {entry.credit > 0 ? formatRupiah(entry.credit) : ""}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && <AddJurnalModal accounts={accounts} />}
    </div>
  );
}
