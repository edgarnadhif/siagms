import React from "react";
import { TransactionCategory } from "@prisma/client";

interface CategoryBadgeProps {
  category: TransactionCategory;
  size?: "sm" | "md";
  className?: string;
}

const categoryConfig: Record<TransactionCategory, { label: string; bg: string; text: string; border: string }> = {
  BOOKING_FEE: {
    label: "Booking Fee",
    bg: "#FFF7ED",
    text: "#C2410C",
    border: "#FED7AA",
  },
  DOWN_PAYMENT: {
    label: "Down Payment",
    bg: "#FFF7ED",
    text: "#C2410C",
    border: "#FED7AA",
  },
  ANGSURAN_KPR: {
    label: "Angsuran KPR",
    bg: "#F0FDF4",
    text: "#15803D",
    border: "#BBF7D0",
  },
  PELUNASAN_CASH: {
    label: "Pelunasan Cash",
    bg: "#FFF7ED",
    text: "#C2410C",
    border: "#FED7AA",
  },
  PENCAIRAN_KPR: {
    label: "Pencairan KPR",
    bg: "#F0FDF4",
    text: "#15803D",
    border: "#BBF7D0",
  },
  BIAYA_KONSTRUKSI: {
    label: "Biaya Konstruksi",
    bg: "#F8FAFC",
    text: "#475569",
    border: "#E2E8F0",
  },
  BIAYA_MARKETING: {
    label: "Biaya Marketing",
    bg: "#F8FAFC",
    text: "#475569",
    border: "#E2E8F0",
  },
  BIAYA_GAJI: {
    label: "Biaya Gaji",
    bg: "#F8FAFC",
    text: "#475569",
    border: "#E2E8F0",
  },
  BIAYA_OPERASIONAL: {
    label: "Biaya Operasional",
    bg: "#F8FAFC",
    text: "#475569",
    border: "#E2E8F0",
  },
  LAIN_LAIN: {
    label: "Lain-lain",
    bg: "#F8FAFC",
    text: "#475569",
    border: "#E2E8F0",
  },
};

export default function CategoryBadge({ category, size = "md", className = "" }: CategoryBadgeProps) {
  const config = categoryConfig[category] || {
    label: category,
    bg: "#F8FAFC",
    text: "#475569",
    border: "#E2E8F0",
  };

  return (
    <span
      className={`inline-flex items-center font-semibold uppercase whitespace-nowrap rounded-[6px] ${
        size === "sm" ? "text-[10px] px-2 py-[1px]" : "text-[11px] px-2.5 py-0.5"
      } ${className}`}
      style={{
        backgroundColor: config.bg,
        color: config.text,
        border: `1px solid ${config.border}`,
        letterSpacing: "0.4px",
      }}
    >
      {config.label}
    </span>
  );
}
