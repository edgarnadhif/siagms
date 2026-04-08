"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deactivateTenantUser } from "@/app/actions";
import AddUserModal from "./AddUserModal";
import EditUserModal from "./EditUserModal";

type ManagedUser = {
  id: number;
  fullName: string | null;
  email: string;
  role: "SUPER_ADMIN" | "AKUNTAN" | "MARKETING";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

const ROLE_STYLE: Record<ManagedUser["role"], string> = {
  SUPER_ADMIN: "bg-[#FFF0E6] text-[#EA6C00] dark:bg-orange-900/40 dark:text-orange-300",
  AKUNTAN: "bg-[#E6F1FB] text-[#185FA5] dark:bg-blue-900/40 dark:text-blue-300",
  MARKETING: "bg-[#DCFCE7] text-[#15803D] dark:bg-emerald-900/40 dark:text-emerald-300",
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

  function updateSearchParams(nextValues: Record<string, string>) {
    const params = new URLSearchParams(window.location.search);

    Object.entries(nextValues).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });

    router.replace(`${window.location.pathname}?${params.toString()}`);
  }

  return (
    <div className="border-2 shadow-xl border-gray-200 dark:border-gray-800 rounded-2xl bg-gray-100 dark:bg-[#0f172a] text-gray-600 dark:text-gray-300 pt-4 md:p-5 md:pt-5 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 px-4 md:px-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
            Kelola User
          </h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-3">
            Kelola akun karyawan dalam tenant ini dengan kontrol role server-side.
          </p>
        </div>
        <Link
          href="?add=true"
          className="flex items-center gap-2 px-5 h-11 bg-[#EA6C00] hover:bg-[#C25500] text-white text-sm font-bold rounded-[10px] shadow-lg shadow-orange-500/20 transition-all active:scale-95 ml-auto w-full md:w-auto justify-center md:justify-start"
        >
          Tambah User
          <span className="text-xl leading-none font-light">+</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 px-4 md:px-0">
        <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-gray-400">Total User</p>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{totals.total}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-gray-400">User Aktif</p>
          <p className="mt-2 text-3xl font-bold text-emerald-600 dark:text-emerald-400">{totals.active}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-gray-400">User Nonaktif</p>
          <p className="mt-2 text-3xl font-bold text-slate-500 dark:text-slate-300">{totals.inactive}</p>
        </div>
      </div>

      <div className="sticky top-0 z-30 pt-2 pb-4 bg-gray-100 dark:bg-[#0f172a] -mx-4 md:-mx-0 px-4 md:px-0">
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
          className="grid grid-cols-1 lg:grid-cols-[1fr_180px_180px_56px] gap-3"
        >
          <input
            type="text"
            name="search"
            defaultValue={search}
            placeholder="Cari nama atau email user..."
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#EA6C00]/20"
          />

          <select
            value={roleFilter}
            onChange={(event) =>
              updateSearchParams({
                search,
                role: event.target.value,
                status: statusFilter,
              })
            }
            className="px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-white outline-none"
          >
            <option value="">Semua Role</option>
            <option value="SUPER_ADMIN">SUPER_ADMIN</option>
            <option value="AKUNTAN">AKUNTAN</option>
            <option value="MARKETING">MARKETING</option>
          </select>

          <select
            value={statusFilter}
            onChange={(event) =>
              updateSearchParams({
                search,
                role: roleFilter,
                status: event.target.value,
              })
            }
            className="px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-white outline-none"
          >
            <option value="">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>

          <button
            type="submit"
            className="w-14 h-14 rounded-full bg-[#EA6C00] hover:bg-[#C25500] text-white flex items-center justify-center shadow-md shadow-orange-500/20"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m1.85-5.65a7.5 7.5 0 11-15 0 7.5 7.5 0 0115 0z" />
            </svg>
          </button>
        </form>
      </div>

      {deleteError && (
        <div className="mb-4 mx-4 md:mx-0 p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-100 dark:border-red-800">
          {deleteError}
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-[14px] border-[0.5px] border-[#E5E7EB] dark:border-slate-700 shadow-sm overflow-hidden mx-4 md:mx-0 mb-10">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[940px]">
            <thead className="bg-[#F9FAFB] dark:bg-slate-800/80 border-b border-gray-100 dark:border-slate-700">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-[0.15em]">Nama</th>
                <th className="px-6 py-4 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-[0.15em]">Email</th>
                <th className="px-6 py-4 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-[0.15em]">Role</th>
                <th className="px-6 py-4 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-[0.15em]">Status</th>
                <th className="px-6 py-4 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-[0.15em]">Dibuat</th>
                <th className="px-6 py-4 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-[0.15em]">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
              {users.map((user) => {
                const isSelf = user.id === currentUserId;

                return (
                  <tr key={user.id} className="hover:bg-[#FFF0E6]/30 dark:hover:bg-slate-700/40 transition-all duration-150 group">
                    <td className="px-6 py-4 text-sm">
                      <div className="font-semibold text-slate-900 dark:text-gray-100">
                        {user.fullName || user.email.split("@")[0]}
                      </div>
                      {isSelf && <div className="text-xs text-[#EA6C00] font-semibold mt-1">Akun Anda</div>}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 font-bold text-xs rounded-full ${ROLE_STYLE[user.role]}`}>
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
                      <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setEditingUser(user)}
                          className="text-gray-400 hover:text-[#EA6C00] transition-colors"
                          title="Edit user"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L5.32 18.67l1.47-3.32a4.5 4.5 0 011.13-1.897l8.94-8.94zM16.862 4.487L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          disabled={deletingId === user.id || isSelf || !user.isActive}
                          className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-40"
                          title={isSelf ? "Tidak bisa menghapus akun sendiri" : "Nonaktifkan user"}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {users.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400 font-medium">Belum ada user yang cocok dengan filter ini.</p>
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
