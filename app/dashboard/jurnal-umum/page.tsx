"use client";

import React, { useState } from "react";
import AddJurnalModal from "./AddJurnalModal";

export default function JurnalUmumPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState("");

  const dummyJournals = [
    {
      id: 1,
      reference: "jule-001",
      date: "09 Mar 2026",
      description: "amdkjasd",
      total: "Rp 30.000",
      entries: [
        { id: 11, account: "1-1000 — Kas", debit: "Rp 10.000", credit: "Rp 10.000" },
        { id: 12, account: "2-1000 — Utang Usaha", debit: "Rp 20.000", credit: "Rp 20.000" },
      ]
    }
  ];

  return (
    <div className="p-6 md:p-8 bg-[#f8fafc] dark:bg-gray-900 min-h-screen">
      {/* Header Container */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-gray-100">
            Jurnal Umum
          </h1>
          <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
            Pencatatan debit dan kredit
          </p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#0f172a] hover:bg-slate-800 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Tambah Jurnal
        </button>
      </div>

      {/* Main Container */}
      <div>
        {/* Search */}
        <div className="relative w-full md:w-[400px] mb-6">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Cari jurnal..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-slate-800 dark:text-white placeholder-slate-400 transition-colors bg-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* List Content */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden mb-6">
          {/* Header count */}
          <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-700/80">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {dummyJournals.length} entri jurnal
            </p>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-slate-700/80">
            {dummyJournals.map(journal => (
              <div key={journal.id} className="p-5 hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors">
                
                {/* Journal Entry Header */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{journal.reference}</span>
                      <span className="text-sm text-slate-400 dark:text-slate-500">{journal.date}</span>
                    </div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{journal.description}</p>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-[#0f172a] dark:text-white">{journal.total}</span>
                    <div className="flex items-center gap-2">
                      <button className="text-slate-400 hover:text-blue-600 transition-colors p-1" title="Edit">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L5.32 18.67l1.47-3.32a4.5 4.5 0 011.13-1.897l8.94-8.94zM16.862 4.487L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                        </svg>
                      </button>
                      <button className="text-red-400 hover:text-red-600 transition-colors p-1" title="Hapus">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sub Table Container */}
                <div className="w-full">
                  {/* Table headers */}
                  <div className="flex px-4 md:px-8 text-xs font-semibold text-[#64748b] dark:text-slate-400 mb-2 mt-4">
                    <div className="flex-1 text-left">Akun</div>
                    <div className="w-[120px] md:w-[200px] text-right">Debit</div>
                    <div className="w-[120px] md:w-[200px] text-right">Kredit</div>
                  </div>
                  
                  {/* Table Rows */}
                  <div className="space-y-1">
                    {journal.entries.map((entry) => (
                      <div key={entry.id} className="flex px-4 md:px-8 text-xs text-[#475569] dark:text-slate-400 py-1">
                        <div className="flex-1">{entry.account}</div>
                        <div className="w-[120px] md:w-[200px] text-right">
                          {entry.debit}
                        </div>
                        <div className="w-[120px] md:w-[200px] text-right">
                          {entry.credit}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>
      </div>

      {showAddModal && <AddJurnalModal onClose={() => setShowAddModal(false)} />}
    </div>
  );
}
