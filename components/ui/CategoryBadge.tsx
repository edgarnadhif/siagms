import React from "react";
import { TransactionCategory } from "@prisma/client";

interface CategoryBadgeProps {
  category: TransactionCategory;
  size?: "sm" | "md";
  className?: string;
}

const categoryConfig: Record<TransactionCategory, { label: string; twClasses: string }> = {
  BOOKING_FEE: {
    label: "Booking Fee",
    twClasses: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20",
  },
  DOWN_PAYMENT: {
    label: "Down Payment",
    twClasses: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20",
  },
  ANGSURAN_KPR: {
    label: "Angsuran KPR",
    twClasses: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
  },
  PELUNASAN_CASH: {
    label: "Pelunasan Cash",
    twClasses: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20",
  },
  PENCAIRAN_KPR: {
    label: "Pencairan KPR",
    twClasses: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
  },
  BIAYA_KONSTRUKSI: {
    label: "Biaya Konstruksi",
    twClasses: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
  },
  BIAYA_MARKETING: {
    label: "Biaya Marketing",
    twClasses: "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  },
  BIAYA_GAJI: {
    label: "Biaya Gaji",
    twClasses: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/20",
  },
  BIAYA_OPERASIONAL: {
    label: "Biaya Operasional",
    twClasses: "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  },
  LAIN_LAIN: {
    label: "Lain-lain",
    twClasses: "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  },
};

export default function CategoryBadge({ category, size = "md", className = "" }: CategoryBadgeProps) {
  const config = categoryConfig[category] || {
    label: category,
    twClasses: "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  };

  return (
    <span
      className={`inline-flex items-center rounded-md border font-medium ${
        size === "sm" ? "px-2.5 py-1 text-[11px]" : "px-2.5 py-1 text-xs"
      } ${config.twClasses} ${className}`}
    >
      {config.label}
    </span>
  );
}
