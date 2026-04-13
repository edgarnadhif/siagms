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
    <form onSubmit={handleSearch} className="w-full">
      <div className="flex items-center bg-white dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 rounded-[12px] shadow-sm focus-within:ring-2 focus-within:ring-[#EA6C00]/10 focus-within:border-[#EA6C00] transition-all p-1.5 h-14">
        {/* Search Input Section */}
        <div className="flex flex-1 items-center px-3 gap-3 h-full">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
            className="w-4 h-4 text-gray-400"
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
            placeholder="Cari nama atau kode proyek"
            className="w-full bg-transparent border-none focus:ring-0 outline-none text-sm py-2 text-gray-900 dark:text-gray-100 placeholder-gray-400 font-medium"
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                router.replace("/dashboard/projek");
              }}
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

        {/* Divider */}
        <div className="h-6 w-[1px] bg-gray-100 dark:bg-slate-700 mx-1" />

        {/* Status Dropdown Section */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors whitespace-nowrap"
          >
            <span>{currentStatusLabel}</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
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
            <div className="absolute z-50 right-0 mt-3 w-48 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden flex flex-col p-1.5">
              {statusOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => selectStatus(opt.id)}
                  className={`text-left px-3 py-2 text-sm font-semibold rounded-md transition-colors ${
                    status === opt.id
                      ? "bg-[#EA6C00] text-white"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700/50"
                  }`}
                >
                  {opt.label}
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
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5 group-hover:scale-110 transition-transform"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
        </button>
      </div>
    </form>
  );
}
