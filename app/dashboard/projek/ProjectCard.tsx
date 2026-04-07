"use client";

import { Project } from "@prisma/client";
import { useState } from "react";
import { deleteProject, markProjectTerjual } from "@/app/actions";
import { useRouter } from "next/navigation";
import EditProjectModal from "./EditProjectModal";

interface ProjectCardProps {
  project: Project;
  transactionCount?: number;
  totalIncome?: number;
  totalExpense?: number;
}

export default function ProjectCard({
  project,
  transactionCount = 0,
  totalIncome = 0,
  totalExpense = 0,
}: ProjectCardProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isHandover, setIsHandover] = useState(false);
  const router = useRouter();

  const profit = totalIncome - totalExpense;

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "AKTIF":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "SELESAI":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "BATAL":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      case "TERJUAL":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "AKTIF":
        return "Aktif";
      case "SELESAI":
        return "Selesai";
      case "BATAL":
        return "Batal";
      case "TERJUAL":
        return "Terjual / Diserahterimakan";
      default:
        return status;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "-";
    const d = new Date(date);
    return `${d.getDate().toString().padStart(2, "0")}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getFullYear().toString().slice(-2)}`;
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setDeleteError("");
    try {
      const result = await deleteProject(project.id);
      if (result?.error) {
        setDeleteError(result.error);
      } else {
        setShowDeleteConfirm(false);
        router.refresh();
      }
    } catch {
      setDeleteError("Terjadi kesalahan sistem");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSerahTerima = async () => {
    if (!confirm("Tandai proyek/unit ini telah diserahterimakan? Ini akan mengakui seluruh pembayaran sebagai Pendapatan di Jurnal dan Laba Rugi.")) return;
    setIsHandover(true);
    try {
      const result = await markProjectTerjual(project.id);
      if (result?.error) {
        alert(result.error);
      } else {
        router.refresh();
      }
    } catch {
      alert("Terjadi kesalahan sistem");
    } finally {
      setIsHandover(false);
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-slate-800 border-[0.5px] border-[#F3F4F6] dark:border-slate-700/50 rounded-2xl p-5 shadow-sm flex flex-col relative overflow-hidden transition-all duration-150 ease-in-out hover:shadow-lg hover:border-[1.5px] hover:border-[#EA6C00] group">
        {/* Header */}
        <div className="flex justify-between items-start mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#FFF0E6] dark:bg-[#431407] flex items-center justify-center shrink-0 border border-orange-100 dark:border-orange-900/20">
              <svg
                className="w-4 h-4 text-[#EA6C00] dark:text-[#F97316]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                />
              </svg>
            </div>
            <h2 className="font-bold text-gray-900 dark:text-white tracking-tight">
              {project.code}
            </h2>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              project.status === 'AKTIF' ? 'bg-[#DCFCE7] text-[#16A34A]' :
              project.status === 'TERJUAL' ? 'bg-emerald-100 text-emerald-700' :
              'bg-[#F3F4F6] text-[#6B7280]'
            }`}
          >
            {getStatusLabel(project.status)}
          </span>
        </div>

        {/* Title & Desc */}
        <div className="mb-1.5">
          <h3 className="text-base font-bold text-gray-800 dark:text-gray-100 leading-tight">
            {project.name}
          </h3>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 line-clamp-1">
            {project.description || "Deskripsi Proyek"}
          </p>
        </div>

        {/* Location & Date - RESTORED */}
        <div className="flex items-center justify-between text-[11px] text-gray-400 dark:text-gray-500 mb-3 px-1">
          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="truncate max-w-[120px]">{project.location || "Lokasi"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{formatDate(project.startDate)}</span>
          </div>
        </div>

        {/* Financial Summary Stat Row */}
        <div className="bg-[#F9FAFB] dark:bg-white/[0.05] rounded-[10px] p-[10px_16px] flex justify-between items-center text-center mb-3 border border-[#F3F4F6] dark:border-white/5">
          <div className="flex-1 px-1">
            <p className="text-[10px] uppercase font-semibold text-gray-400 dark:text-gray-500 mb-1 tracking-widest">
              Pendapatan
            </p>
            <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
              {formatCurrency(totalIncome).split(',')[0]}
            </p>
          </div>
          <div className="flex-1 px-1 border-x border-gray-100 dark:border-white/5">
            <p className="text-[10px] uppercase font-semibold text-gray-400 dark:text-gray-500 mb-1 tracking-widest">
              Pengeluaran
            </p>
            <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
              {formatCurrency(totalExpense).split(',')[0]}
            </p>
          </div>
          <div className="flex-1 px-1">
            <p className="text-[10px] uppercase font-semibold text-gray-400 dark:text-gray-500 mb-1 tracking-widest">
              Profit
            </p>
            <p className="text-sm font-bold text-[#EA6C00]">
              {formatCurrency(profit).split(',')[0]}
            </p>
          </div>
        </div>

        {/* Transaksi & Budget Footer */}
        <div className="flex justify-between items-center text-[11px] text-gray-400 mb-3 px-1 font-medium">
          <span>Transaksi : <span className="text-gray-600 dark:text-gray-400">{transactionCount}</span></span>
          <span>
            Budget : <span className="text-gray-600 dark:text-gray-400">{formatCurrency(Number(project.budget)).split(',')[0]}</span>
          </span>
        </div>

        {/* Divider - Made more subtle */}
        <div className="h-px bg-gray-50 dark:bg-slate-700/50 -mx-5 mb-4"></div>

        {/* Actions - No background, text + icon only */}
        <div className="flex justify-end gap-5 px-1 mt-auto">
          {project.status !== 'TERJUAL' && (
            <button
              onClick={handleSerahTerima}
              disabled={isHandover}
              className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors disabled:opacity-50"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              {isHandover ? "Memproses..." : "Serah Terima"}
            </button>
          )}
          <button
            onClick={() => setShowEditModal(true)}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-[#EA6C00] transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-red-500 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Hapus
          </button>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <EditProjectModal
          project={project}
          onClose={() => setShowEditModal(false)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-sm shadow-xl p-6 border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 mx-auto mb-4">
              <svg
                className="w-6 h-6 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-center text-gray-900 dark:text-white mb-2">
              Hapus Proyek?
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-1">
              Proyek{" "}
              <span className="font-semibold text-gray-700 dark:text-gray-200">
                {project.name}
              </span>{" "}
              akan dihapus permanen.
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center mb-5">
              Pastikan tidak ada transaksi terkait sebelum menghapus.
            </p>

            {deleteError && (
              <div className="text-red-500 text-xs font-medium p-2.5 bg-red-50 dark:bg-red-900/30 rounded-lg border border-red-100 dark:border-red-800 mb-4">
                {deleteError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteError("");
                }}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-slate-700 dark:text-gray-200 dark:border-slate-600 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {isDeleting ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
