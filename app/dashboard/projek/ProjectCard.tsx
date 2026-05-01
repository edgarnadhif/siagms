"use client";
import { differenceInDays } from "date-fns";
import { useState } from "react";
import { deleteProject } from "@/app/actions";
import { useRouter } from "next/navigation";
import EditProjectModal from "./EditProjectModal";
import StatusBadge from "@/components/ui/StatusBadge";

interface ProjectCardProps {
  project: ProjectCardProject;
  transactionCount?: number;
  totalIncome?: number;
  totalExpense?: number;
}

export interface ProjectCardProject {
  id: string;
  code: string;
  name: string;
  description: string | null;
  location: string | null;
  startDate: Date | string | null;
  endDate: Date | string | null;
  status: string;
  budget: number | { toString(): string } | null;
  units?: Array<{ id: string; unitCode: string; status: string }>;
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
  const router = useRouter();

  const profit = totalIncome - totalExpense;
  const units = project.units || [];
  const totalUnits = units.length;
  const soldUnits = units.filter((unit) => unit.status !== "TERSEDIA").length;
  const progressPct = totalUnits > 0 ? Math.round((soldUnits / totalUnits) * 100) : 0;

  const budget = Number(project.budget || 0);
  const usedBudget = totalExpense;
  const remainingBudget = Math.max(0, budget - usedBudget);
  const budgetUsedPct = budget > 0 ? Math.min(100, Number(((usedBudget / budget) * 100).toFixed(1))) : 0;
  const isBudgetWarning = budget > 0 && remainingBudget < budget * 0.1;

  const targetDate = project.endDate ? new Date(project.endDate) : null;
  const remainingDays = targetDate ? differenceInDays(targetDate, new Date()) : null;



  const getBudgetBarColor = () => {
    if (budgetUsedPct > 90) return "from-red-500 to-red-600";
    if (budgetUsedPct >= 70) return "from-amber-400 to-amber-500";
    return "from-emerald-400 to-emerald-500";
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);

  const formatDate = (date: Date | string | null) => {
    if (!date) return "-";
    const d = new Date(date);
    return `${d.getDate().toString().padStart(2, "0")}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d
      .getFullYear()
      .toString()
      .slice(-2)}`;
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
        router.push("/dashboard/projek?toast=delete_success");
        router.refresh();
      }
    } catch {
      setDeleteError("Terjadi kesalahan sistem");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="bg-white border-[0.5px] border-[#E5E7EB] dark:border-slate-700 dark:bg-slate-800 rounded-2xl p-5 shadow-sm flex flex-col relative transition-all duration-150 hover:shadow-md h-full">
        
        {/* Header Card */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <div className="flex flex-col">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white leading-tight line-clamp-1">{project.name}</h3>
              <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
                {project.code}
              </div>
            </div>
          </div>
          <div className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap ${
            project.status === 'AKTIF' 
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' 
              : project.status === 'SELESAI'
              ? 'bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400'
              : project.status === 'BATAL'
              ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'
              : 'bg-slate-50 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
          }`}>
            {project.status}
          </div>
        </div>

        {/* Main Info (Description only) */}
        <div className="mb-4">
          <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
            {project.description && project.description.trim() !== "" ? project.description : "Tidak ada deskripsi"}
          </p>
        </div>

        {/* Meta Info */}
        <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl px-5 py-4 mb-4 space-y-3">
          {/* Location - Full Width */}
          <div className="flex items-center gap-2.5">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-sm text-slate-600 dark:text-slate-400 truncate">{project.location || "-"}</span>
          </div>
          
          {/* Dates and Remaining Days */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {formatDate(project.startDate)} <span className="mx-1 text-slate-400">-</span> {formatDate(project.endDate)}
              </span>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-lg bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-600 dark:bg-orange-500/10 dark:text-orange-400 whitespace-nowrap">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {remainingDays === null ? "Tanpa target" : `Sisa ${remainingDays} Hari`}
            </div>
          </div>
        </div>

        <div className="mt-auto bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-5 space-y-6">
          {/* Budget Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-900 dark:text-white">Budget</span>
              <span className="text-sm font-semibold text-slate-900 dark:text-white tabular-nums">{formatCurrency(budget)}</span>
            </div>
            <div className="h-2 w-full bg-slate-200/70 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-orange-500 rounded-full transition-all duration-500" style={{ width: `${budgetUsedPct}%` }} />
            </div>
            <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
              <span>Terpakai {budgetUsedPct}%</span>
              <span>Sisa {formatCurrency(remainingBudget)}</span>
            </div>
          </div>



          {/* Unit Terjual Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-900 dark:text-white">Progress Unit</span>
              <span className="text-sm font-semibold text-slate-900 dark:text-white">{soldUnits} / {totalUnits} Unit</span>
            </div>
            <div className="h-2 w-full bg-slate-200/70 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">Total Transaksi</span>
              <span className="font-semibold text-slate-900 dark:text-white tabular-nums">{transactionCount} Transaksi</span>
            </div>
          </div>
        </div>

        {/* Action Row */}
        <div className="pt-4 mt-5 flex items-center justify-end gap-5">
          <button onClick={() => setShowEditModal(true)} className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Edit
          </button>
          <button onClick={() => setShowDeleteConfirm(true)} className="inline-flex items-center gap-2 text-sm font-medium text-rose-600 hover:text-rose-700 dark:hover:text-rose-400 transition-colors">
             <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1v3M4 7h16" />
             </svg>
            Hapus
          </button>
        </div>
      </div>

      {showEditModal && <EditProjectModal project={project} onClose={() => setShowEditModal(false)} />}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200 text-center border border-gray-100 dark:border-slate-700">
            <div className="flex items-center justify-center w-20 h-20 rounded-full bg-red-50 dark:bg-red-900/20 mx-auto mb-6 shadow-inner">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-10 h-10 text-red-500"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                />
              </svg>
            </div>
            
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Hapus Proyek?</h3>
            
            <div className="text-center space-y-2 mb-7">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Proyek <span className="font-bold text-slate-900 dark:text-white">{project.name}</span> akan dihapus permanen.
              </p>
            </div>

            {deleteError && (
              <div className="text-red-500 text-xs font-medium p-3 bg-red-50 dark:bg-red-900/30 rounded-xl border border-red-100 dark:border-red-800 mb-5">
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
                className="flex-1 h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 h-12 px-4 rounded-xl bg-red-500 text-sm font-semibold text-white hover:bg-red-600 shadow-sm shadow-red-500/20 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {isDeleting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Menghapus...</span>
                  </div>
                ) : (
                  "Ya, Hapus"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
