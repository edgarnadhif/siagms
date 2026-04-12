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
      <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl p-4 shadow-sm flex flex-col relative overflow-hidden transition-all duration-150 hover:shadow-md h-full">
        <div className="flex items-start justify-between gap-4 mb-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-gray-50 dark:bg-slate-700 flex items-center justify-center border border-gray-100 dark:border-slate-600">
              <img 
                src="/house.svg" 
                alt="Project" 
                className="w-7 h-7 object-contain"
                style={{ filter: 'invert(48%) sepia(96%) saturate(2059%) hue-rotate(1deg) brightness(101%) contrast(105%)' }}
              />
            </div>
            <div className="text-[14px] font-black text-black dark:text-white tracking-[0.05em] uppercase">
              {project.code}
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase border ${
            project.status === 'AKTIF' 
              ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' 
              : project.status === 'SELESAI'
              ? 'bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20'
              : project.status === 'BATAL'
              ? 'bg-red-50 text-red-600 border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'
              : 'bg-gray-50 text-gray-900 border-gray-100 dark:bg-slate-700 dark:text-gray-100 dark:border-slate-600'
          }`}>
            {project.status}
          </div>
        </div>

        <div className="mb-4">
          <h3 className="text-xl font-bold text-black dark:text-white leading-tight">{project.name}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed">{project.description || "Deskripsi proyek."}</p>
        </div>

        <div className="grid grid-cols-[1.4fr_1fr] gap-x-2 gap-y-3 text-[13px] text-gray-700 dark:text-gray-400 mb-6 font-medium">
          <div className="flex items-center gap-2.5">
            <img src="/location_on.svg" alt="Location" className="w-5 h-5 flex-shrink-0" />
            <span className="truncate">{project.location || "-"}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <img src="/calendar_month.svg" alt="Start" className="w-5 h-5 flex-shrink-0" />
            <span>Mulai : {formatDate(project.startDate)}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <img src="/calendar_clock.svg" alt="Done" className="w-5 h-5 flex-shrink-0" />
            <span>Selesai : {formatDate(project.endDate)}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <img src="/target.svg" alt="Target" className="w-5 h-5 flex-shrink-0" />
            <span>{remainingDays === null ? "Tanpa target" : `Sisa : ${remainingDays} Hari`}</span>
          </div>
        </div>

        <div className="bg-gray-50/50 dark:bg-white/[0.02] rounded-3xl border border-gray-100 dark:border-white/5 p-4 mb-3">
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Pendapatan</p>
              <p className="text-sm font-black text-black dark:text-white mt-2 uppercase">{formatCurrency(totalIncome)}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Pengeluaran</p>
              <p className="text-sm font-black text-black dark:text-white mt-2 uppercase">{formatCurrency(totalExpense)}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Profit</p>
              <p className="text-sm font-black text-black dark:text-white mt-2 uppercase">{formatCurrency(profit)}</p>
            </div>
          </div>
        </div>
        <div className="mb-3 rounded-[20px] border border-gray-100 dark:border-slate-700/60 p-4 bg-white dark:bg-slate-900/30">
          <p className="text-sm font-bold text-black dark:text-white mb-4">Budget</p>
          <div className="space-y-3 text-[13px] text-gray-600 dark:text-gray-400 mb-5 font-medium">
            <div className="flex justify-between"><span>Budget</span><span className="text-black dark:text-white font-semibold">{formatCurrency(budget)}</span></div>
            <div className="flex justify-between"><span>Terpakai</span><span className="text-black dark:text-white font-semibold">{formatCurrency(usedBudget)}</span></div>
            <div className="flex justify-between"><span>Sisa Budget</span><span className="text-black dark:text-white font-semibold">{formatCurrency(remainingBudget)}</span></div>
          </div>
          <div className="h-2.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-[#EA6C00] dark:bg-[#F97316] rounded-full transition-all duration-500" style={{ width: `${budgetUsedPct}%` }} />
          </div>
          <p className="text-[11px] text-right mt-3 font-bold text-gray-800 dark:text-gray-300">{budgetUsedPct}% Terpakai</p>
        </div>

        <div className="mb-3 rounded-[20px] border border-gray-100 dark:border-slate-700/60 p-4 bg-white dark:bg-slate-900/30">
          <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300 mb-2 font-bold">
            <span className="">Unit Terjual</span>
            <span className="">
              {soldUnits} / {totalUnits} Unit
            </span>
          </div>
          <div className="h-3 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden mb-3">
            <div className="h-full bg-[#EA6C00] dark:bg-[#F97316] rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="flex items-center justify-between text-sm text-gray-700 dark:text-gray-400 font-bold">
            <span>Transaksi : {transactionCount}</span>
            <span>{progressPct}%</span>
          </div>
        </div>

        <div className="mt-auto pt-4 flex justify-end gap-6">
          <button onClick={() => setShowDeleteConfirm(true)} className="flex items-center gap-2.5 text-xs font-bold text-gray-600 hover:text-red-600 transition-colors">
            <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1v3M4 7h16" />
               </svg>
            </div>
            Hapus
          </button>
          <button onClick={() => setShowEditModal(true)} className="flex items-center gap-2.5 text-xs font-bold text-gray-600 hover:text-black transition-colors">
            <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            Edit
          </button>
        </div>

      </div>

      {showEditModal && <EditProjectModal project={project} onClose={() => setShowEditModal(false)} />}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-sm shadow-xl p-6 border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 mx-auto mb-4">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-center text-gray-900 dark:text-white mb-2">Hapus Proyek?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-1">
              Proyek <span className="font-semibold text-gray-700 dark:text-gray-200">{project.name}</span> akan dihapus permanen.
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center mb-5">Pastikan tidak ada transaksi terkait sebelum menghapus.</p>

            {deleteError && <div className="text-red-500 text-xs font-medium p-2.5 bg-red-50 dark:bg-red-900/30 rounded-lg border border-red-100 dark:border-red-800 mb-4">{deleteError}</div>}

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
