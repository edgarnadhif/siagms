"use client";

import React, { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";

// ─── Helpers ────────────────────────────────────────────────────
function formatRupiah(num: number) {
  return "Rp " + num.toLocaleString("id-ID");
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${d.getDate().toString().padStart(2, "0")} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

const CATEGORY_LABELS: Record<string, string> = {
  BOOKING_FEE: "Booking Fee",
  DOWN_PAYMENT: "Down Payment",
  BIAYA_PROYEK: "Biaya Proyek",
  BIAYA_OPERASIONAL: "Biaya Operasional",
};

const CATEGORY_COLORS: Record<string, string> = {
  BOOKING_FEE: "text-blue-700 bg-blue-100 border-blue-200 dark:text-blue-400 dark:bg-blue-900/30 dark:border-blue-800",
  DOWN_PAYMENT: "text-emerald-700 bg-emerald-100 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-900/30 dark:border-emerald-800",
  BIAYA_PROYEK: "text-orange-700 bg-orange-100 border-orange-200 dark:text-orange-400 dark:bg-orange-900/30 dark:border-orange-800",
  BIAYA_OPERASIONAL: "text-red-700 bg-red-100 border-red-200 dark:text-red-400 dark:bg-red-900/30 dark:border-red-800",
};

// ─── Chart Components ─────────────────────────────────────
function DonutChart({
  data,
  size = 160,
}: {
  data: { label: string; value: number; color: string }[];
  size?: number;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const radius = (size - 20) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const strokeWidth = 28;
  const circumference = 2 * Math.PI * radius;

  let accumulatedOffset = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={strokeWidth} className="dark:stroke-slate-700" />
      {total > 0 && data.map((d, i) => {
        const pct = d.value / total;
        const dashArray = pct * circumference;
        const dashOffset = -accumulatedOffset;
        accumulatedOffset += dashArray;
        return (
          <circle key={i} cx={cx} cy={cy} r={radius} fill="none"
            stroke={d.color} strokeWidth={strokeWidth}
            strokeDasharray={`${dashArray} ${circumference - dashArray}`}
            strokeDashoffset={dashOffset}
            transform={`rotate(-90 ${cx} ${cy})`} className="transition-all duration-500"
          />
        );
      })}
    </svg>
  );
}

// ─── Component Wrappers ───────────────────────────────────────
function SummaryCard({
  title, value, subtitle, icon, accent = false,
}: { title: string; value: string; subtitle: string; icon: React.ReactNode; accent?: boolean; }) {
  return (
    <div className={cn(
      "rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden transition-all duration-300 group shadow-sm",
      accent
        ? "bg-gradient-to-br from-[#0f172a] to-slate-800 text-white"
        : "bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-gray-100"
    )}>
      <div className="flex items-center justify-between mb-3">
        <span className={cn("text-xs font-semibold uppercase tracking-wider", accent ? "text-slate-200" : "text-gray-500 dark:text-gray-400")}>
          {title}
        </span>
        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", accent ? "bg-white/10" : "bg-red-50 dark:bg-red-900/20 text-red-500")}>
          {icon}
        </div>
      </div>
      <div>
        <p className={cn("text-xl font-bold leading-tight", accent ? "text-white" : "text-gray-900 dark:text-gray-100")}>{value}</p>
        <p className={cn("text-[11px] mt-1 line-clamp-1", accent ? "text-slate-300" : "text-gray-400 dark:text-gray-500")}>{subtitle}</p>
      </div>
    </div>
  );
}

function Card({ children, className = "", title, action }: { children: React.ReactNode; className?: string; title?: string; action?: React.ReactNode; }) {
  return (
    <div className={cn("bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-sm", className)}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-4 border-b border-gray-100 dark:border-slate-700 pb-3">
          {title && <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

// ─── Main Client Page ─────────────────────────────────────────────
export default function DashboardClient({
  totalRevenue,
  totalExpenses,
  labaBersih,
  totalTransaksi,
  breakdownData,
  projects,
  recentTransactions,
  totalBookingFee,
  totalDownPayment,
  projectFilter,
}: {
  totalRevenue: number;
  totalExpenses: number;
  labaBersih: number;
  totalTransaksi: number;
  breakdownData: { label: string; value: number; color: string }[];
  projects: any[];
  recentTransactions: any[];
  totalBookingFee: number;
  totalDownPayment: number;
  projectFilter: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Switch project filter
  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    const val = e.target.value;
    if (val === "all") {
      params.delete("project");
    } else {
      params.set("project", val);
    }
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="border-2 shadow-xl border-gray-200 dark:border-gray-800 rounded-2xl bg-gray-100 dark:bg-[#0f172a] text-gray-600 dark:text-gray-300 p-6 md:p-8 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-gray-200 dark:border-slate-700 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Ringkasan kinerja keuangan dan monitoring proyek</p>
        </div>
        <div className="relative w-full md:w-64">
          <select
            value={projectFilter}
            onChange={handleProjectChange}
            className="w-full appearance-none pl-4 pr-10 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-700 dark:text-gray-200 transition-colors shadow-sm"
            style={{
              backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2364748B%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E")`,
              backgroundSize: "16px 16px",
              backgroundPosition: "right 14px center",
              backgroundRepeat: "no-repeat",
            }}
          >
            <option value="all">Semua Proyek (Global)</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.code} — {p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        <SummaryCard title="Total Pendapatan" value={formatRupiah(totalRevenue)} subtitle="Saldo normal Kredit" accent
          icon={<svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" /></svg>}
        />
        <SummaryCard title="Total Beban/Biaya" value={formatRupiah(totalExpenses)} subtitle="Saldo normal Debit"
          icon={<svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" /></svg>}
        />
        <SummaryCard title="Laba Bersih" value={formatRupiah(labaBersih)} subtitle="Pendapatan - Beban"
          icon={<svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
        />
        <SummaryCard title="Total Transaksi" value={totalTransaksi.toLocaleString("id-ID")} subtitle="Transaksi Kas Terdaftar"
          icon={<svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Breakdown Biaya */}
        <Card title="Breakdown Biaya">
          <div className="flex flex-col md:flex-row items-center gap-6 mt-2">
            <div className="flex-shrink-0">
              <DonutChart data={breakdownData} size={140} />
            </div>
            <div className="flex flex-col gap-3 w-full">
              {breakdownData.map((d, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50 dark:border-slate-700/50 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors px-2 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm" style={{ backgroundColor: d.color }} />
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{d.label}</span>
                  </div>
                  <p className="text-xs font-bold text-gray-900 dark:text-gray-100">{formatRupiah(d.value)}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Ringkasan Penerimaan */}
        <Card title="Ringkasan Transaksi Masuk">
          <div className="flex flex-col gap-0 mt-2">
            <div className="flex items-center justify-between py-4 border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800/50 px-3 rounded-lg transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>
                </div>
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Total Booking Fee</span>
              </div>
              <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{formatRupiah(totalBookingFee)}</span>
            </div>
            <div className="flex items-center justify-between py-4 border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800/50 px-3 rounded-lg transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                </div>
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Total Down Payment</span>
              </div>
              <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{formatRupiah(totalDownPayment)}</span>
            </div>
            
            <div className="mt-4 bg-[#0f172a] dark:bg-slate-900 rounded-xl p-4 flex items-center justify-between shadow-sm">
              <span className="text-sm font-bold text-slate-300">Total Kas Masuk (BF+DP)</span>
              <span className="text-lg font-bold text-emerald-400">{formatRupiah(totalBookingFee + totalDownPayment)}</span>
            </div>
          </div>
        </Card>

        {/* Project List */}
        <Card title="Status Proyek Aktif" action={
          <Link href="/dashboard/projek" className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-md">
            Kelola Proyek
          </Link>
        }>
          <div className="flex flex-col gap-2 h-52 overflow-y-auto custom-scrollbar pr-2 mt-2">
            {projects.length === 0 ? (
              <div className="text-center text-sm text-gray-500 py-10 italic">Belum ada proyek.</div>
            ) : projects.map((p, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 hover:border-blue-200 dark:hover:border-slate-500 transition-all shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-slate-700 flex items-center justify-center font-bold text-blue-600 dark:text-blue-400 text-xs border border-blue-100 dark:border-slate-600">
                    {p.code.substring(0,2)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-100 leading-tight">{p.name}</p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">Mulai: {formatDate(p.startDate)}</p>
                  </div>
                </div>
                <div className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                  p.status === 'AKTIF' ? 'bg-green-50 text-green-600 border-green-200 dark:bg-green-900/20 dark:border-green-800' :
                  p.status === 'SELESAI' ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' :
                  'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                }`}>
                  {p.status}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Transaksi Terbaru */}
      <Card title="Transaksi Terbaru" action={
        <Link href="/dashboard/transaksi" className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">
          Lihat Semua Transaksi &rarr;
        </Link>
      }>
        {recentTransactions.length === 0 ? (
          <div className="text-center text-sm text-gray-500 py-10 italic">Belum ada transaksi dicatat.</div>
        ) : (
          <div className="overflow-x-auto -mx-5 px-5 mt-2">
            <table className="w-full min-w-[700px]">
              <thead className="bg-[#f8fafc] dark:bg-slate-800/60 border-y border-gray-200 dark:border-slate-700">
                <tr>
                  <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tanggal</th>
                  <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Referensi</th>
                  <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Keterangan</th>
                  <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Kategori</th>
                  <th className="px-5 py-3 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider">Jumlah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700/50">
                {recentTransactions.map((trx) => (
                  <tr key={trx.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-5 py-4 whitespace-nowrap text-xs font-medium text-slate-600 dark:text-slate-400">{formatDate(trx.date)}</td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm font-bold text-slate-800 dark:text-slate-200">{trx.reference}</td>
                    <td className="px-5 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">{trx.description}</td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${CATEGORY_COLORS[trx.category] || "bg-gray-100 text-gray-700"}`}>
                        {CATEGORY_LABELS[trx.category] || trx.category}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm font-bold text-slate-900 dark:text-slate-100 text-right">
                      {formatRupiah(trx.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
