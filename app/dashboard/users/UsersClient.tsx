"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { permanentlyDeleteTenantUser } from "@/app/actions";
import AddUserModal from "./AddUserModal";
import EditUserModal from "./EditUserModal";

type ToastType = "success" | "error";

type Toast = {
  id: number;
  message: string;
  type: ToastType;
};

function ToastContainer({
  toasts,
  remove,
}: {
  toasts: Toast[];
  remove: (id: number) => void;
}) {
  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center gap-3 px-6 py-3.5 rounded-full shadow-2xl text-sm font-semibold text-white min-w-[280px] animate-in slide-in-from-right-5 duration-300 ${
            toast.type === "success" ? "bg-[#00945E]" : "bg-red-600"
          }`}
        >
          {toast.type === "success" ? (
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
          <span className="flex-1">{toast.message}</span>
          <button
            onClick={() => remove(toast.id)}
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

type ManagedUser = {
  id: number;
  fullName: string | null;
  email: string;
  role: "ADMIN" | "AKUNTAN";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

const roleOptions = [
  { value: "", label: "Semua Role" },
  { value: "ADMIN", label: "ADMIN" },
  { value: "AKUNTAN", label: "AKUNTAN" },
];


export default function UsersClient({
  users,
  currentUserId,
  search,
  roleFilter,
  showAddModal,
}: {
  users: ManagedUser[];
  currentUserId: number;
  search: string;
  roleFilter: string;
  showAddModal: boolean;
}) {
  const router = useRouter();
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);

  // Filter Dropdown States
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [itemsPerPageOpen, setItemsPerPageOpen] = useState(false);
  const roleFilterRef = useRef<HTMLDivElement>(null);
  const itemsPerPageRef = useRef<HTMLDivElement>(null);

  const [deleteModal, setDeleteModal] = useState<{
    show: boolean;
    type: "single" | "bulk";
    id?: number;
  }>({ show: false, type: "single" });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        roleFilterRef.current &&
        !roleFilterRef.current.contains(event.target as Node)
      )
        setRoleDropdownOpen(false);
      if (
        itemsPerPageRef.current &&
        !itemsPerPageRef.current.contains(event.target as Node)
      )
        setItemsPerPageOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const showToast = (message: string, type: ToastType = "success") => {
    const id = ++toastId.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4000);
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const totals = useMemo(() => {
    return { total: users.length, active: users.filter((user) => user.isActive).length };
  }, [users]);

  const updateSearchParams = (nextValues: Record<string, string>) => {
    const params = new URLSearchParams(window.location.search);
    Object.entries(nextValues).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    router.replace(`${window.location.pathname}?${params.toString()}`);
  };

  const totalPages = Math.ceil(users.length / itemsPerPage);
  const safeCurrentPage = Math.min(currentPage, Math.max(totalPages, 1));
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const paginatedUsers = users.slice(startIndex, startIndex + itemsPerPage);

  const getPageNumbers = () => {
    const pages: Array<number | "..."> = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (safeCurrentPage <= 3) {
      pages.push(1, 2, 3, 4, "...", totalPages);
    } else if (safeCurrentPage >= totalPages - 2) {
      pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, "...", safeCurrentPage - 1, safeCurrentPage, safeCurrentPage + 1, "...", totalPages);
    }
    return pages;
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [search, roleFilter]);

  const allSelected = users.length > 0 && users.every((user) => selectedIds.includes(user.id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(users.map((user) => user.id));
    }
  };

  const toggleSelect = (userId: number) => {
    setSelectedIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    setError("");
    
    if (deleteModal.type === "single" && deleteModal.id) {
      const result = await permanentlyDeleteTenantUser(deleteModal.id);
      if (result?.error) {
        setError(result.error);
        showToast(result.error, "error");
      } else {
        showToast("User berhasil dihapus", "error");
        setDeleteModal({ show: false, type: "single" });
      }
    } else if (deleteModal.type === "bulk") {
      let deletedCount = 0;
      for (const userId of selectedIds) {
        const result = await permanentlyDeleteTenantUser(userId);
        if (result?.error) {
          setError(result.error);
          showToast(result.error, "error");
          setIsDeleting(false);
          return;
        }
        deletedCount += 1;
      }
      if (deletedCount > 0) {
        showToast(`${deletedCount} user berhasil dihapus`, "error");
        setSelectedIds([]);
        setDeleteModal({ show: false, type: "bulk" });
      }
    }
    
    setIsDeleting(false);
    router.refresh();
  };

  const handlePermanentDelete = (userId: number) => {
    setDeleteModal({
      show: true,
      type: "single",
      id: userId,
    });
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    setDeleteModal({
      show: true,
      type: "bulk",
    });
  };

  return (
    <div className="text-gray-600 dark:text-gray-300 w-full h-full flex flex-col pb-8">
      <ToastContainer toasts={toasts} remove={removeToast} />
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 px-4 md:px-0">
        <div>
          <h1 className="page-title dark:text-gray-100">Kelola User</h1>
          <p className="card-subtitle text-gray-400 dark:text-gray-500 mt-2">
            Kelola akun penggguna
          </p>
        </div>
        <Link
          href="?add=true"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-200 w-full md:w-auto md:ml-auto"
        >
          Tambah User
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 px-4 md:px-0">
        {[
          ["Total User", totals.total, "text-gray-900 text-black dark:text-white"],
          ["User Aktif", totals.active, "text-emerald-600 dark:text-emerald-400"],
        ].map(([label, value, color]) => (
          <div
            key={label}
            className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4"
          >
            <p className="text-xs uppercase font-semibold tracking-[0.18em] text-orange-600">
              {label}
            </p>
            <p className={`mt-2 text-3xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="sticky -top-6 z-30 pt-2 pb-3 bg-white dark:bg-[#111827] -mx-6 px-6">
        <div className="flex flex-col md:flex-row flex-wrap items-center gap-3 w-full">
          {/* Search Input */}
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
              value={search}
              placeholder="Cari nama atau email..."
              onChange={(event) => updateSearchParams({ search: event.target.value })}
              className="flex-1 bg-transparent border-none focus:ring-0 outline-none text-sm font-medium text-slate-700 dark:text-slate-200 placeholder:font-normal placeholder:text-slate-400"
            />
            {search && (
              <button
                type="button"
                onClick={() => updateSearchParams({ search: "" })}
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

          {/* Role Dropdown */}
          <div className="w-full md:w-[160px] relative" ref={roleFilterRef}>
            <button
              type="button"
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              className="w-full h-11 inline-flex items-center justify-between px-3 bg-white dark:bg-slate-800 border-[0.5px] border-[#E5E7EB] dark:border-slate-700 rounded-xl transition-colors"
            >
              <span className="text-sm font-normal text-slate-700 dark:text-slate-200 truncate">
                {roleFilter || "Semua Role"}
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${roleDropdownOpen ? "rotate-180" : ""}`}
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

            {roleDropdownOpen && (
              <div className="absolute z-50 right-0 mt-2 w-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden flex flex-col p-1 animate-in fade-in zoom-in-95 duration-200">
                {roleOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      updateSearchParams({ role: option.value });
                      setRoleDropdownOpen(false);
                    }}
                    className={`text-left px-3 py-2 text-sm rounded-md transition-colors ${roleFilter === option.value ? "bg-slate-50 text-slate-900 font-medium dark:bg-slate-700 dark:text-white" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"}`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {error}
        </div>
      )}

      {selectedIds.length > 0 && (
        <div className="mt-2 mb-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex flex-col md:flex-row items-center justify-between bg-[#FFF0E6] dark:bg-orange-500/10 border border-[#EA6C00] rounded-xl p-2 md:px-4 md:py-2 gap-3 shadow-sm">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {selectedIds.length} user dipilih
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <button
                onClick={() => setSelectedIds([])}
                className="flex-1 md:flex-none px-4 h-9 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95 shadow-sm"
              >
                Batalkan Pilihan
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={isDeleting}
                className="flex-1 md:flex-none px-4 h-9 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-lg shadow-sm shadow-red-500/20 transition-all active:scale-95 disabled:opacity-50"
              >
                Hapus Terpilih
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 border-[0.5px] border-[#E5E7EB] dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr className="border-b border-slate-100 dark:border-slate-700/50">
                <th className="px-5 py-3.5 w-[50px] text-center">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-100 dark:border-slate-600 dark:bg-slate-700 cursor-pointer"
                  />
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
                  NAMA
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
                  EMAIL
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400 w-[140px]">
                  ROLE
                </th>
                <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400 w-[180px]">
                  AKSI
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 px-16 text-center">
                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900/50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-10 h-10 opacity-40"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                        />
                      </svg>
                    </div>
                    <p className="font-bold text-slate-900 dark:text-white">
                      Belum ada data user
                    </p>
                    <p className="text-sm text-slate-400 mt-1 italic">
                      Coba ubah filter atau tambahkan user baru.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user, idx) => {
                  return (
                    <tr
                      key={user.id}
                      className={`transition-colors ${
                        selectedIds.includes(user.id)
                          ? "bg-slate-50/60 dark:bg-slate-700/30"
                          : "hover:bg-slate-50/60 dark:hover:bg-slate-700/30"
                      } ${!user.isActive ? "opacity-60" : ""} ${idx === paginatedUsers.length - 1 ? "border-b-0" : "border-b border-slate-100 dark:border-slate-700/50"}`}
                    >
                      <td className="px-5 py-3.5 whitespace-nowrap text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(user.id)}
                          onChange={() => toggleSelect(user.id)}
                          className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-100 dark:border-slate-600 dark:bg-slate-700 cursor-pointer"
                        />
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-900 dark:text-white">
                            {user.fullName || "-"}
                          </span>
                          {user.id === currentUserId && (
                            <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-bold text-orange-600">
                              Anda
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-sm font-medium text-slate-500 dark:text-slate-400">
                        {user.email}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className="inline-flex rounded-full border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-600 dark:border-slate-700 dark:text-slate-300">
                          {user.role}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => setEditingUser(user)}
                            className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            title="Edit User"
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
                                d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                              />
                            </svg>
                          </button>
                          <button
                            type="button"
                            disabled={isDeleting || user.id === currentUserId}
                            onClick={() => handlePermanentDelete(user.id)}
                            className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors disabled:opacity-50"
                            title="Hapus"
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
                                d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                              />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {users.length > 0 && (
          <div className="px-5 py-3.5 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700/50 flex flex-col md:flex-row items-center justify-between gap-4 rounded-b-2xl">
            <div className="text-sm text-slate-500 dark:text-slate-400 order-2 md:order-1">
              Total User: <span className="font-semibold text-slate-900 dark:text-white">{users.length}</span>
            </div>

            <div className="flex items-center gap-1 order-1 md:order-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={safeCurrentPage === 1}
                className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:text-slate-400 disabled:hover:bg-transparent transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>

              {getPageNumbers().map((page, idx) => (
                <button
                  key={idx}
                  onClick={() => typeof page === "number" && setCurrentPage(page)}
                  disabled={page === "..."}
                  className={`min-w-[36px] h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-all ${
                    safeCurrentPage === page
                      ? "bg-orange-50 text-orange-600 border border-orange-200 dark:bg-orange-500/10 dark:border-orange-500/20"
                      : page === "..."
                        ? "text-slate-400 cursor-default"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={safeCurrentPage === totalPages || totalPages === 0}
                className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:text-slate-400 disabled:hover:bg-transparent transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
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
                  className="flex items-center gap-2 px-3 h-9 min-w-[60px] justify-between border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 transition-all hover:bg-slate-50 dark:hover:bg-slate-700 focus:ring-2 focus:ring-orange-100 dark:focus:ring-orange-900/30 active:scale-95"
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

      {showAddModal && <AddUserModal />}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          isSelf={editingUser.id === currentUserId}
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
              {deleteModal.type === "bulk"
                ? `Hapus ${selectedIds.length} User?`
                : "Hapus User?"}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-center mb-8">
              {deleteModal.type === "bulk"
                ? "Semua user yang dipilih akan dihapus secara permanen."
                : "User ini akan dihapus secara permanen."}
            </p>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setDeleteModal({ show: false, type: "single" })}
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
    </div>
  );
}
