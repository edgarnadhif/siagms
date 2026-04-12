import React from "react";

export type StatusVariant = "UNIT" | "PROJECT" | "PELANGGAN" | "JOURNAL" | "METODE_PEMBAYARAN";

interface StatusBadgeProps {
  status: string;
  variant: StatusVariant;
  size?: "sm" | "md";
  className?: string;
}

const getStatusConfig = (status: string, variant: StatusVariant) => {
  const s = status.toUpperCase();
  
  if (variant === "UNIT") {
    switch (s) {
      case "TERSEDIA":
        return { bg: "#F0FDF4", text: "#15803D", border: "#BBF7D0", label: "Tersedia" };
      case "BOOKING":
        return { bg: "#EFF6FF", text: "#1D4ED8", border: "#BFDBFE", label: "Booking" };
      case "INDENT":
        return { bg: "#FFFBEB", text: "#B45309", border: "#FDE68A", label: "Indent" };
      case "AKAD":
        return { bg: "#FFF7ED", text: "#C2410C", border: "#FED7AA", label: "Akad" };
      case "LUNAS":
        return { bg: "#F5F3FF", text: "#6D28D9", border: "#DDD6FE", label: "Lunas" };
      case "SERAH_TERIMA":
        return { bg: "#F8FAFC", text: "#475569", border: "#E2E8F0", label: "Serah Terima" };
    }
  }

  if (variant === "PROJECT" || variant === "PELANGGAN") {
    switch (s) {
      case "AKTIF":
        return { bg: "#F0FDF4", text: "#15803D", border: "#BBF7D0", label: "Aktif" };
      case "NONAKTIF":
      case "NON_AKTIF":
        return { bg: "#F8FAFC", text: "#9CA3AF", border: "#E5E7EB", label: "Nonaktif" };
      case "SELESAI":
        return { bg: "#EFF6FF", text: "#1D4ED8", border: "#BFDBFE", label: "Selesai" };
      case "BATAL":
        return { bg: "#FEF2F2", text: "#DC2626", border: "#FECACA", label: "Batal" };
      case "TERJUAL":
        return { bg: "#FFF7ED", text: "#C2410C", border: "#FED7AA", label: "Terjual" };
    }
  }

  if (variant === "METODE_PEMBAYARAN") {
    switch (s) {
      case "KPR":
        return { bg: "#EFF6FF", text: "#1D4ED8", border: "#BFDBFE", label: "KPR" };
      case "CASH":
      case "CASH_KERAS":
      case "CASH_BERTAHAP":
        return { bg: "#F0FDF4", text: "#15803D", border: "#BBF7D0", label: s.replace("_", " ") };
    }
  }

  if (variant === "JOURNAL") {
    switch (s) {
      case "AUTO":
        return { bg: "#EFF6FF", text: "#1D4ED8", border: "#BFDBFE", label: "Auto" };
      case "MANUAL":
        return { bg: "#FFF7ED", text: "#C2410C", border: "#FED7AA", label: "Manual" };
    }
  }

  // Fallback
  return { bg: "#F8FAFC", text: "#475569", border: "#E2E8F0", label: status };
};

export default function StatusBadge({ status, variant, size = "md", className = "" }: StatusBadgeProps) {
  const config = getStatusConfig(status, variant);

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
