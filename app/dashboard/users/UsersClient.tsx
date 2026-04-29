"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  activateTenantUser,
  deactivateTenantUser,
  permanentlyDeleteTenantUser,
} from "@/app/actions";
import AddUserModal from "./AddUserModal";
import EditUserModal from "./EditUserModal";

type ManagedUser = {
  id: number;
  fullName: string | null;
  email: string;
  role: "ADMIN" | "AKUNTAN";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

const ROLE_STYLE: Record<ManagedUser["role"], string> = {
  ADMIN:
    "bg-gray-50 text-slate-700 border-gray-200 dark:bg-slate-700/30 dark:text-gray-200 dark:border-slate-600",
  AKUNTAN:
    "bg-gray-50 text-slate-700 border-gray-200 dark:bg-slate-700/30 dark:text-gray-200 dark:border-slate-600",
};

export default function UsersClient({
  users,
  currentUserId,
  search,
  roleFilter,
  statusFilter,
  showAddModal,
}: {
  users: ManagedUser[];
  currentUserId: number;
  search: string;
  roleFilter: string;
  statusFilter: string;
  showAddModal: boolean;
}) {
  const router = useRouter();
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [activatingId, setActivatingId] = useState<number | null>(null);
  const [hardDeletingId, setHardDeletingId] = useState<number | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const roleDropdownRef = useRef<HTMLDivElement>(null);
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  const selectedRoleLabel =
    roleFilter === "ADMIN"
      ? "ADMIN"
      : roleFilter === "AKUNTAN"
        ? "AKUNTAN"
        : "Semua Role";

  const selectedStatusLabel =
    statusFilter === "active"
      ? "Aktif"
      : statusFilter === "inactive"
        ? "Nonaktif"
        : "Semua Status";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        roleDropdownRef.current &&
        !roleDropdownRef.current.contains(event.target as Node)
      ) {
        setRoleDropdownOpen(false);
      }

      if (
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(event.target as Node)
      ) {
        setStatusDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const totals = useMemo(() => {
    const active = users.filter((user) => user.isActive).length;
    return { total: users.length, active, inactive: users.length - active };
  }, [users]);

  async function handleDelete(userId: number) {
    if (!confirm("Yakin ingin menonaktifkan akun ini?")) return;

    setDeletingId(userId);
    setDeleteError("");
    const result = await deactivateTenantUser(userId);

    if (result?.error) {
      setDeleteError(result.error);
      setDeletingId(null);
      return;
    }

    setDeletingId(null);
    router.refresh();
  }

  async function handleActivate(userId: number) {
    setActivatingId(userId);
    setDeleteError("");

    const result = await activateTenantUser(userId);
    if (result?.error) {
      setDeleteError(result.error);
      setActivatingId(null);
      return;
    }

    setActivatingId(null);
    router.refresh();
  }

  async function handlePermanentDelete(userId: number) {
    if (
      !confirm(
        "Hapus user ini secara permanen? Data user akan hilang dan tidak bisa dikembalikan.",
      )
    ) {
      return;
    }

    setHardDeletingId(userId);
    setDeleteError("");

    const result = await permanentlyDeleteTenantUser(userId);
    if (result?.error) {
      setDeleteError(result.error);
      setHardDeletingId(null);
      return;
    }

    setHardDeletingId(null);
    router.refresh();
  }

  const displayedUsers = useMemo(
    () => users.filter((user) => (showInactive ? true : user.isActive)),
    [users, showInactive],
  );

  function updateSearchParams(nextValues: Record<string, string>) {
    const params = new URLSearchParams(window.location.search);

    Object.entries(nextValues).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });

    router.replace(`${window.location.pathname}?${params.toString()}`);
  }

  return (
    <div className="text-gray-600 dark:text-gray-300 w-full h-full pb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 px-4 md:px-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
            Kelola User
          </h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-3">
            Kelola akun karyawan
          </p>
        </div>
        <Link
          href="?add=true"
          className="flex items-center gap-2 px-5 h-11 bg-[#EA6C00] hover:bg-[#C25500] text-white text-sm font-bold rounded-[10px] shadow-lg shadow-orange-500/20 transition-all active:scale-95 ml-auto w-full md:w-auto justify-center md:justify-start"
        >
          Tambah User
          <img
            src="/add.svg"
            alt="Add"
            className="w-5 h-5 invert dark:invert-0"
          />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2.5 px-4 md:px-0">
        <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-gray-400">
            Total User
          </p>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            {totals.total}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-gray-400">
            User Aktif
          </p>
          <p className="mt-2 text-3xl font-bold text-emerald-600 dark:text-emerald-400">
            {totals.active}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-gray-400">
            User Nonaktif
          </p>
          <p className="mt-2 text-3xl font-bold text-slate-500 dark:text-slate-300">
            {totals.inactive}
          </p>
        </div>
      </div>

      <div className="sticky -top-6 z-30 pt-8 pb-4 bg-white dark:bg-[#111827] -mx-6 px-6">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            updateSearchParams({
              search: String(formData.get("search") || ""),
              role: roleFilter,
              status: statusFilter,
            });
          }}
          className="w-full"
        >
          <div className="flex flex-col md:flex-row items-center bg-white dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-[#EA6C00]/10 focus-within:border-[#EA6C00] transition-all p-1.5 min-h-14 md:h-14">
            <div className="flex flex-1 items-center px-3 gap-3 w-full h-full min-h-11">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
                className="w-4 h-4 text-gray-400 shrink-0"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                />
              </svg>
              <input
                type="text"
                name="search"
                defaultValue={search}
                placeholder="Cari nama atau email user..."
                className="flex-1 bg-transparent border-none focus:ring-0 outline-none text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 font-medium"
              />
            </div>

            <div className="hidden md:block h-6 w-px bg-gray-100 dark:bg-slate-700 mx-1" />

            <button
              type="button"
              onClick={() => setShowInactive(!showInactive)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-bold transition-colors whitespace-nowrap ${showInactive ? "text-[#EA6C00]" : "text-gray-500 dark:text-gray-400 hover:text-gray-700"}`}
            >
              <div
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${showInactive ? "bg-[#EA6C00]" : "bg-gray-200 dark:bg-slate-700"}`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transform transition-transform ${showInactive ? "translate-x-4" : "translate-x-1"}`}
                />
              </div>
              Nonaktif
            </button>

            <div className="hidden md:block h-6 w-px bg-gray-100 dark:bg-slate-700 mx-1" />

            <div className="relative w-full md:w-auto" ref={roleDropdownRef}>
              <button
                type="button"
                onClick={() => {
                  setRoleDropdownOpen(!roleDropdownOpen);
                  setStatusDropdownOpen(false);
                }}
                className="flex items-center justify-between md:justify-start gap-2 w-full md:w-auto h-11 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors whitespace-nowrap"
              >
                <span>{selectedRoleLabel}</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${roleDropdownOpen ? "rotate-180" : ""}`}
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
                <div className="absolute z-50 right-0 mt-3 w-56 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden flex flex-col p-1.5">
                  {[
                  { value: "", label: "Semua Role" },
                  { value: "ADMIN", label: "ADMIN" },
                  { value: "AKUNTAN", label: "AKUNTAN" },
                ].map((option) => (
                    <button
                      key={option.label}
                      type="button"
                      onClick={() => {
                        updateSearchParams({
                          search,
                          role: option.value,
                          status: statusFilter,
                        });
                        setRoleDropdownOpen(false);
                      }}
                      className={`text-left px-3 py-2.5 text-sm font-bold rounded-lg transition-colors ${roleFilter === option.value ? "bg-[#EA6C00] text-white" : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700/50"}`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="hidden md:block h-6 w-px bg-gray-100 dark:bg-slate-700 mx-1" />

            <div className="relative w-full md:w-auto" ref={statusDropdownRef}>
              <button
                type="button"
                onClick={() => {
                  setStatusDropdownOpen(!statusDropdownOpen);
                  setRoleDropdownOpen(false);
                }}
                className="flex items-center justify-between md:justify-start gap-2 w-full md:w-auto h-11 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors whitespace-nowrap"
              >
                <span>{selectedStatusLabel}</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${statusDropdownOpen ? "rotate-180" : ""}`}
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
              {statusDropdownOpen && (
                <div className="absolute z-50 right-0 mt-3 w-56 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden flex flex-col p-1.5">
                  {[
                    { value: "", label: "Semua Status" },
                    { value: "active", label: "Aktif" },
                    { value: "inactive", label: "Nonaktif" },
                  ].map((option) => (
                    <button
                      key={option.label}
                      type="button"
                      onClick={() => {
                        updateSearchParams({
                          search,
                          role: roleFilter,
                          status: option.value,
                        });
                        setStatusDropdownOpen(false);
                      }}
                      className={`text-left px-3 py-2.5 text-sm font-bold rounded-lg transition-colors ${statusFilter === option.value ? "bg-[#EA6C00] text-white" : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700/50"}`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              className="ml-2 w-11 h-11 bg-[#EA6C00] hover:bg-[#C25500] text-white rounded-full transition-all shadow-md shadow-orange-500/20 flex items-center justify-center group shrink-0 mt-2 md:mt-0"
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
      </div>

      {deleteError && (
        <div className="mb-4 mx-4 md:mx-0 p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-100 dark:border-red-800">
          {deleteError}
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-[14px] border-[0.5px] border-[#E5E7EB] dark:border-slate-700 shadow-sm overflow-hidden mx-4 md:mx-0 mb-10">
        <div className="overflow-x-auto overflow-y-auto max-h-130 custom-scrollbar">
          <table className="w-full min-w-[940px]">
            <thead className="bg-[#F9FAFB] dark:bg-slate-800/80 border-b border-gray-100 dark:border-slate-700 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-[0.15em]">
                  Nama
                </th>
                <th className="px-6 py-4 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-[0.15em]">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-[0.15em]">
                  Role
                </th>
                <th className="px-6 py-4 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-[0.15em]">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-[0.15em]">
                  Dibuat
                </th>
                <th className="px-6 py-4 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-[0.15em]">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
              {displayedUsers.map((user) => {
                const isSelf = user.id === currentUserId;

                return (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50/80 dark:hover:bg-slate-700/30 transition-all duration-150 group"
                  >
                    <td className="px-6 py-4 text-sm">
                      <div className="font-semibold text-slate-900 dark:text-gray-100">
                        {user.fullName || user.email.split("@")[0]}
                      </div>
                      {isSelf && (
                        <div className="text-xs text-[#EA6C00] font-semibold mt-1">
                          Akun Anda
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {user.email}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 font-semibold text-[11px] rounded-[10px] border uppercase tracking-wide ${ROLE_STYLE[user.role]}`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {user.isActive ? (
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
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(user.createdAt).toLocaleDateString("id-ID")}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-3 opacity-100 transition-opacity">
                        <button
                          onClick={() => setEditingUser(user)}
                          className="text-gray-400 hover:text-[#EA6C00] transition-colors"
                          title="Edit user"
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
                        {user.isActive ? (
                          <button
                            onClick={() => handleDelete(user.id)}
                            disabled={deletingId === user.id || isSelf}
                            className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-40"
                            title={
                              isSelf
                                ? "Tidak bisa menghapus akun sendiri"
                                : "Nonaktifkan user"
                            }
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
                        ) : (
                          <>
                            <button
                              onClick={() => handleActivate(user.id)}
                              disabled={activatingId === user.id}
                              className="text-gray-400 hover:text-emerald-600 transition-colors disabled:opacity-40"
                              title="Aktifkan user"
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
                                  d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182"
                                />
                              </svg>
                            </button>
                            <button
                              onClick={() => handlePermanentDelete(user.id)}
                              disabled={hardDeletingId === user.id || isSelf}
                              className="inline-flex items-center justify-center w-7 h-7 rounded-md text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors disabled:opacity-40 dark:bg-red-900/20 dark:border-red-900/40 dark:text-red-400 dark:hover:bg-red-900/30"
                              title={
                                isSelf
                                  ? "Tidak bisa menghapus akun sendiri"
                                  : "Hapus permanen"
                              }
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
                                  d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673A2.25 2.25 0 0 1 15.916 21.75H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0V4.877c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                                />
                              </svg>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {displayedUsers.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              Belum ada user yang cocok dengan filter ini.
            </p>
          </div>
        )}
      </div>

      {showAddModal && <AddUserModal />}

      {editingUser && (
        <EditUserModal
          user={editingUser}
          isSelf={editingUser.id === currentUserId}
          onClose={() => setEditingUser(null)}
        />
      )}
    </div>
  );
}
