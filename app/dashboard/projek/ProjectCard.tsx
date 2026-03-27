import { Project } from "@prisma/client";

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
  const profit = totalIncome - totalExpense;

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "AKTIF":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "SELESAI":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "BATAL":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "AKTIF": return "Aktif";
      case "SELESAI": return "Selesai";
      case "BATAL": return "Batal";
      default: return status;
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

  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-3xl p-5 shadow-sm flex flex-col relative overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-slate-700 shrink-0"></div>
          <h2 className="font-bold text-gray-900 dark:text-white">{project.code}</h2>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusStyle(
            project.status,
          )}`}
        >
          {getStatusLabel(project.status)}
        </span>
      </div>

      {/* Title & Desc */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 leading-tight">
          {project.name}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
          {project.description || "Deskripsi"}
        </p>
      </div>

      {/* Location & Date */}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-4 px-1">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-full bg-gray-300 dark:bg-slate-600"></div>
          <span>{project.location || "Lokasi tidak diketahui"}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-full bg-gray-300 dark:bg-slate-600"></div>
          <span>{formatDate(project.startDate)}</span>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="bg-gray-200 dark:bg-slate-700/50 rounded-xl p-3 flex justify-between items-center text-center mb-4">
        <div className="flex-1 border-r border-gray-300 dark:border-slate-600/50 px-1">
          <p className="text-[10px] uppercase font-semibold text-gray-600 dark:text-gray-400 mb-1">
            Pendapatan
          </p>
          <p className="text-xs font-medium text-gray-800 dark:text-gray-200">
            Rp {formatCurrency(totalIncome).replace("Rp", "").trim()}
          </p>
        </div>
        <div className="flex-1 border-r border-gray-300 dark:border-slate-600/50 px-1">
          <p className="text-[10px] uppercase font-semibold text-gray-600 dark:text-gray-400 mb-1">
            Pengeluaran
          </p>
          <p className="text-xs font-medium text-gray-800 dark:text-gray-200">
            Rp {formatCurrency(totalExpense).replace("Rp", "").trim()}
          </p>
        </div>
        <div className="flex-1 px-1">
          <p className="text-[10px] uppercase font-semibold text-gray-600 dark:text-gray-400 mb-1">
            Profit
          </p>
          <p className="text-xs font-medium text-gray-800 dark:text-gray-200">
            Rp {formatCurrency(profit).replace("Rp", "").trim()}
          </p>
        </div>
      </div>

      {/* Transaksi & Budget */}
      <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 mb-4 px-1">
        <span>Transaksi : {transactionCount}</span>
        <span>Budget : Rp {formatCurrency(Number(project.budget)).replace("Rp", "").trim()}</span>
      </div>
      
      {/* Divider */}
      <div className="h-px bg-gray-200 dark:bg-slate-700 -mx-5 mb-4"></div>

      {/* Actions */}
      <div className="flex justify-end gap-3 px-1 mt-auto">
        <button className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
          <div className="w-3.5 h-3.5 rounded bg-gray-300 dark:bg-slate-600"></div> Edit
        </button>
        <button className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors">
          <div className="w-3.5 h-3.5 rounded bg-gray-300 dark:bg-slate-600"></div> Hapus
        </button>
      </div>
    </div>
  );
}
