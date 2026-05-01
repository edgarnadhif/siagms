"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ProjectFilters({
  initialSearch,
  initialStatus,
}: {
  initialSearch: string;
  initialStatus: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(initialSearch);
  const [status, setStatus] = useState(initialStatus);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const statusOptions = [
    { id: "", label: "Semua Status" },
    { id: "AKTIF", label: "Aktif" },
    { id: "SELESAI", label: "Selesai" },
    { id: "BATAL", label: "Batal" },
  ];

  const currentStatusLabel =
    statusOptions.find((opt) => opt.id === status)?.label || "Status";

  useEffect(() => {
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

  // Instant Search with Debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (search) params.set("search", search);
      else params.delete("search");

      if (status) params.set("status", status);
      else params.delete("status");

      router.replace(`/dashboard/projek?${params.toString()}`);
    }, 400); // 400ms debounce

    return () => clearTimeout(timeoutId);
  }, [search, status, router, searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (search) params.set("search", search);
    else params.delete("search");

    if (status) params.set("status", status);
    else params.delete("status");

    router.replace(`/dashboard/projek?${params.toString()}`);
  };

  const selectStatus = (id: string) => {
    setStatus(id);
    setIsOpen(false);

    const params = new URLSearchParams(searchParams.toString());
    if (search) params.set("search", search);
    else params.delete("search");

    if (id) params.set("status", id);
    else params.delete("status");

    router.replace(`/dashboard/projek?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSearch} className="flex flex-col md:flex-row items-center gap-3 w-full">
      {/* Search Input Section */}
      <div className="relative w-full md:flex-1">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama / kode proyek..."
          className="w-full h-11 pl-10 pr-10 rounded-xl border-[0.5px] border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-200 placeholder:font-normal placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 dark:focus:border-slate-500 dark:focus:ring-slate-800 transition-all"
        />
        {search && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              router.replace("/dashboard/projek");
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Status Dropdown Section */}
      <div className="relative w-full md:w-auto" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full md:w-[160px] h-11 flex items-center justify-between px-4 rounded-xl border-[0.5px] border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors"
        >
          <span className="truncate">{currentStatusLabel}</span>
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
          <div className="absolute z-50 right-0 left-0 md:left-auto mt-2 w-full md:w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden flex flex-col p-1.5">
            {statusOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => selectStatus(opt.id)}
                className={`text-left px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  status === opt.id
                    ? "bg-slate-100 dark:bg-slate-700/50 text-slate-900 dark:text-white"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </form>
  );
}
