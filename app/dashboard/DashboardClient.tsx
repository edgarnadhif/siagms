"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from "recharts";
import { Calendar as BigCalendar, dateFnsLocalizer, Views } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import CategoryBadge from "@/components/ui/CategoryBadge";
import { TransactionCategory } from "@prisma/client";

const rbcLocalizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales: { id: idLocale },
});

// ─── Helpers ────────────────────────────────────────────────────
function formatRupiah(num: number | undefined | null) {
  return "Rp " + (num || 0).toLocaleString("id-ID");
}

function formatCompact(num: number) {
  if (num >= 1000000000) return (num / 1000000000).toFixed(0) + ' M';
  if (num >= 1000000) return (num / 1000000).toFixed(0) + ' jt';
  if (num >= 1000) return (num / 1000).toFixed(0) + ' rb';
  return num.toString();
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

const dashboardActionClass =
  "text-xs font-semibold text-[#EA6C00] hover:text-[#C25500] dark:text-[#F97316] dark:hover:text-[#FFF0E6] transition-colors border border-[#EA6C00] dark:border-[#F97316] px-3 py-1.5 rounded-md hover:bg-[#FFF0E6] dark:hover:bg-[#431407]";



// ─── Chart Components ─────────────────────────────────────
function DonutChart({
  data,
  size = 160,
  valueFormatter = (value) => formatRupiah(Number(Array.isArray(value) ? value[0] : value)),
}: {
  data: { label: string; value: number; color: string }[];
  size?: number;
  valueFormatter?: (value: number | string | readonly (string | number)[] | undefined) => string;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const chartData = total > 0 ? data : [{ label: 'Belum Ada', value: 1, color: '#FFF0E6' }];

  return (
    <div style={{ width: size, height: size }} className="relative drop-shadow-sm">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius="70%"
            outerRadius="100%"
            paddingAngle={2}
            dataKey="value"
            stroke="none"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          {total > 0 && (
            <Tooltip 
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const rawValue = payload[0]?.value;
                return (
                  <div
                    style={{
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      fontSize: '12px',
                      backgroundColor: '#fff',
                      padding: '10px 12px',
                    }}
                  >
                    {valueFormatter(rawValue)}
                  </div>
                );
              }}
            />
          )}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Custom Project Filter Dropdown ────────────────────────────────
function ProjectFilterDropdown({
  projects,
  selectedProject,
  onSelect,
}: {
  projects: any[];
  selectedProject: string;
  onSelect: (val: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedItem =
    selectedProject === "all"
      ? { id: "all", label: "Semua Proyek (Global)" }
      : { id: selectedProject, label: projects.find((p) => p.id === selectedProject)?.name || "Unknown Project" };

  return (
    <div className="relative w-full md:w-64" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#EA6C00]/20 focus:border-[#EA6C00] text-gray-700 dark:text-gray-200 transition-colors shadow-sm"
        style={{ borderRadius: "12px" }}
      >
        <span className="truncate pr-2">{selectedItem.label}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
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

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden flex flex-col max-h-60 overflow-y-auto custom-scrollbar">
          <button
            onClick={() => {
              onSelect("all");
              setIsOpen(false);
            }}
            className={`text-left px-[14px] py-[10px] text-sm font-medium transition-colors ${
              selectedProject === "all"
                ? "bg-[#EA6C00] text-white"
                : "text-gray-700 dark:text-gray-200 hover:bg-[#FFF0E6] hover:text-[#EA6C00] dark:hover:bg-slate-700 dark:hover:text-gray-100"
            }`}
          >
            Semua Proyek (Global)
          </button>
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                onSelect(p.id);
                setIsOpen(false);
              }}
              className={`text-left px-[14px] py-[10px] text-sm font-medium transition-colors ${
                selectedProject === p.id
                  ? "bg-[#EA6C00] text-white"
                  : "text-gray-700 dark:text-gray-200 hover:bg-[#FFF0E6] hover:text-[#EA6C00] dark:hover:bg-slate-700 dark:hover:text-gray-100"
              }`}
            >
              {p.code} — {p.name}
            </button>
          ))}
        </div>
      )}
    </div>
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
        ? "bg-[#18202f] text-white"
        : "bg-white dark:bg-slate-800 border-[0.5px] border-[#E5E7EB] dark:border-slate-700 text-gray-900 dark:text-gray-100"
    )}>
      <div className="flex items-center justify-between mb-3">
        <span className={cn("card-label", accent ? "text-slate-100" : "text-gray-500 dark:text-gray-400")}>
          {title}
        </span>
        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", accent ? "bg-[#273549] text-[#EA6C00] dark:text-[#F97316]" : "bg-[#FFF0E6] dark:bg-[#431407] text-[#EA6C00] dark:text-[#F97316]")}>
          {icon}
        </div>
      </div>
      <div>
        <p className={cn("card-value", accent ? "text-white" : "text-gray-900 dark:text-gray-100")}>{value}</p>
        <p className={cn("card-subtitle mt-1 line-clamp-1 opacity-50 ", accent ? "text-slate-300" : "text-gray-400 dark:text-gray-500")}>{subtitle}</p>
      </div>
    </div>
  );
}

function Card({ children, className = "", title, action }: { children: React.ReactNode; className?: string; title?: string; action?: React.ReactNode; }) {
  return (
    <div className={cn("bg-white dark:bg-slate-800 rounded-[14px] border-[0.5px] border-[#E5E7EB] dark:border-slate-700 p-5 shadow-sm", className)}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-4 border-b border-gray-100 dark:border-slate-700 pb-3">
          {title && <h3 className="section-title dark:text-gray-100">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

// ─── Mini Calendar Toolbar ────────────────────────────────────────
function MiniToolbar({ label, onNavigate }: { label: string; onNavigate: (action: string) => void }) {
  const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  return (
    <div className="flex items-center justify-between mb-2">
      <button onClick={() => onNavigate('PREV')} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-gray-400 dark:text-gray-400 hover:text-[#EA6C00] dark:hover:text-[#EA6C00]">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
      </button>
      <span className="text-sm font-semibold text-gray-800 dark:text-[#F9FAFB]">{label}</span>
      <button onClick={() => onNavigate('NEXT')} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-gray-400 dark:text-gray-400 hover:text-[#EA6C00] dark:hover:text-[#EA6C00]">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
      </button>
    </div>
  );
}

// ─── Mini Calendar (react-big-calendar) ───────────────────────────
function MiniCalendar({ events, selectedDate, onSelectDate, onNavigate }: {
  events: any[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onNavigate: (date: Date) => void;
}) {
  // Build a map of dates that have events for dayPropGetter
  const eventDateMap = React.useMemo(() => {
    const map = new Map<string, string>(); // dateKey -> priority color
    for (const evt of events) {
      const d = new Date(evt.date);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const existing = map.get(key);
      // Priority: AUTO > MANUAL > DONE
      if (evt.status === 'DONE' && !existing) {
        map.set(key, '#EAF3DE');
      } else if (evt.type === 'MANUAL' && existing !== '#FCEBEB') {
        map.set(key, '#E6F1FB');
      } else if (evt.type === 'AUTO' || evt.isLocked) {
        map.set(key, '#FCEBEB');
      }
    }
    return map;
  }, [events]);

  const dayPropGetter = useCallback((date: Date) => {
    return {
      style: {
        backgroundColor: 'transparent',
        border: 'none',
      },
    };
  }, []);

  // Custom header to make rounded squares
  const CustomDateHeader = useCallback(({ date, label }: any) => {
    const todayObj = new Date();
    const isToday = date.getFullYear() === todayObj.getFullYear() && date.getMonth() === todayObj.getMonth() && date.getDate() === todayObj.getDate();

    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    const selKey = `${selectedDate.getFullYear()}-${selectedDate.getMonth()}-${selectedDate.getDate()}`;
    const bg = eventDateMap.get(key);
    const isSelected = key === selKey;
    
    return (
      <button 
        type="button"
        className={`relative flex items-center justify-center mx-auto transition-all text-xs font-semibold hover:shadow-xs w-7 h-7 ${
          isSelected 
            ? "bg-[#EA6C00] text-white rounded-lg" 
            : isToday 
              ? "bg-[#FFF0E6] border-2 border-[#EA6C00] text-[#EA6C00] rounded-[8px]" 
              : bg 
                ? "bg-[#FFF0E6] dark:bg-[rgba(234,108,0,0.15)] text-gray-800 dark:text-[#E5E7EB]! rounded-lg" 
                : "text-gray-800 dark:text-[#E5E7EB]! rounded-lg"
        }`}
      >
        {label}
        {bg && (
          <span className="absolute top-[3px] right-[3px] w-1 h-1 rounded-full bg-[#EA6C00]"></span>
        )}
      </button>
    );
  }, [eventDateMap, selectedDate]);

  // Hide event chips on the grid
  const eventPropGetter = useCallback(() => ({
    style: { display: 'none' as const },
  }), []);

  const calEvents = events.map(e => ({
    ...e,
    start: new Date(e.date),
    end: e.endDate ? new Date(e.endDate) : new Date(new Date(e.date).getTime() + 3600000),
  }));

  return (
    <div className="mini-calendar-widget">
      <BigCalendar
        localizer={rbcLocalizer}
        culture="id"
        events={[]}
        view={Views.MONTH}
        views={[Views.MONTH]}
        date={selectedDate}
        onNavigate={(date: any) => onNavigate(date)}
        selectable
        dayPropGetter={dayPropGetter}
        eventPropGetter={() => ({ style: { display: 'none' } })}
        components={{ 
          toolbar: (props: any) => <MiniToolbar label={props.label} onNavigate={props.onNavigate} />,
          month: { dateHeader: CustomDateHeader }
        }}
        style={{ height: 280 }}
      />
    </div>
  );
}

// ─── Main Client Page ─────────────────────────────────────────────
export default function DashboardClient({
  totalRevenue,
  totalExpenses,
  totalBudget,
  labaBersih,
  totalTransaksi,
  cashFlowData,
  breakdownData,
  projects,
  recentTransactions,
  totalBookingFee,
  totalDownPayment,
  totalPelunasan,
  projectFilter,
  kasDiterima,
  pendapatanDiakui,
  unitStats,
  piutangKPR,
  totalAset,
  totalKewajiban,
  totalEkuitas,
}: {
  totalRevenue: number;
  totalExpenses: number;
  totalBudget: number;
  labaBersih: number;
  totalTransaksi: number;
  cashFlowData: { month: string; masuk: number; keluar: number; bersih: number }[];
  breakdownData: { label: string; value: number; color: string }[];
  projects: any[];
  recentTransactions: any[];
  totalBookingFee: number;
  totalDownPayment: number;
  totalPelunasan: number;
  projectFilter: string;
  kasDiterima: number;
  pendapatanDiakui: number;
  unitStats: {
    TERSEDIA: number;
    BOOKING: number;
    INDENT: number;
    AKAD: number;
    LUNAS: number;
    SERAH_TERIMA: number;
  };
  piutangKPR: number;
  totalAset?: number;
  totalKewajiban?: number;
  totalEkuitas?: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [itemsPerPageOpen, setItemsPerPageOpen] = useState(false);
  const itemsPerPageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (itemsPerPageRef.current && !itemsPerPageRef.current.contains(event.target as Node)) {
        setItemsPerPageOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const totalPages = Math.ceil(recentTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = recentTransactions.slice(startIndex, startIndex + itemsPerPage);

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
      }
    }
    return pages;
  };

  const fetchCalendarEvents = useCallback((date: Date) => {
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    fetch(`/api/calendar?month=${month}&year=${year}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setCalendarEvents(data.data);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetchCalendarEvents(selectedDate);
  }, [fetchCalendarEvents, selectedDate]);

  const selectedDateEvents = calendarEvents.filter(evt => {
    const evtDate = new Date(evt.date);
    return evtDate.getFullYear() === selectedDate.getFullYear()
      && evtDate.getMonth() === selectedDate.getMonth()
      && evtDate.getDate() === selectedDate.getDate();
  });

  return (
    <div className="text-gray-600 dark:text-gray-300 w-full h-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="page-title dark:text-gray-100">Dashboard</h1>
          <p className="card-subtitle text-gray-400 dark:text-gray-400 mt-3">Ringkasan kinerja keuangan dan monitoring proyek</p>
        </div>
        <ProjectFilterDropdown 
          projects={projects}
          selectedProject={projectFilter}
          onSelect={(val) => {
            const params = new URLSearchParams(searchParams.toString());
            if (val === "all") params.delete("project");
            else params.set("project", val);
            router.replace(`${pathname}?${params.toString()}`);
          }}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-3 mb-4 lg:mb-3">
        <SummaryCard title="Kas Diterima" value={formatRupiah(kasDiterima)} subtitle="DP + Booking + KPR Cair" accent
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
        />
        <SummaryCard title="Pendapatan Diakui" value={formatRupiah(pendapatanDiakui)} subtitle="Nilai unit Lunas / Serah Terima"
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" /></svg>}
        />
        <SummaryCard title="Total Beban/Biaya" value={formatRupiah(totalExpenses)} subtitle="HPP + Operasional"
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" /></svg>}
        />
        <SummaryCard title="Piutang KPR" value={formatRupiah(piutangKPR)} subtitle="Tagihan KPR yang belum cair"
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-3 mb-4 lg:mb-3">
        <Card title="Ringkasan Laba Rugi" action={<Link href="/dashboard/laporan" className={dashboardActionClass}>Lihat Lengkap</Link>}>
          <div className="flex flex-col gap-3 py-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 font-medium">Pendapatan Diakui</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{formatRupiah(pendapatanDiakui)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 font-medium">Total Beban</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">({formatRupiah(totalExpenses)})</span>
            </div>
            <div className="flex justify-between items-center text-base pt-3 border-t border-slate-100 dark:border-slate-700">
              <span className="font-bold text-slate-800 dark:text-white uppercase tracking-wider text-xs">Laba Bersih</span>
              <span className={`font-black ${labaBersih >= 0 ? "text-emerald-600" : "text-red-500"}`}>{formatRupiah(labaBersih)}</span>
            </div>
          </div>
        </Card>

        <Card title="Neraca Singkat" action={<Link href="/dashboard/laporan?tab=neraca" className={dashboardActionClass}>Lihat Detail</Link>}>
          <div className="flex flex-col gap-3 py-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 font-medium">Total Aset</span>
              <span className="font-bold text-blue-600 dark:text-blue-500">{formatRupiah(totalAset || 0)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 font-medium">Total Kewajiban</span>
              <span className="font-bold text-orange-600 dark:text-orange-500">{formatRupiah(totalKewajiban || 0)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 font-medium">Total Ekuitas</span>
              <span className="font-bold text-purple-600 dark:text-purple-500">{formatRupiah(totalEkuitas || 0)}</span>
            </div>
            {((totalAset || 0) === ((totalKewajiban || 0) + (totalEkuitas || 0))) ? (
              <div className="mt-2 text-[11px] font-bold bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded uppercase tracking-wider inline-flex w-fit">Balanced</div>
            ) : (
              <div className="mt-2 text-[11px] font-bold bg-red-50 text-red-600 px-3 py-1.5 rounded uppercase tracking-wider inline-flex w-fit">Tidak Balanced</div>
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-3 mb-4 lg:mb-3">
        <Card title="Proporsi Pengeluaran" action={<button className={dashboardActionClass}>Detail Biaya</button>}>
          <div className="flex flex-col items-center gap-6 py-2">
            <DonutChart data={breakdownData} />
            <div className="flex-1 w-full space-y-2.5">
              {breakdownData.map((d, i) => (
                <div key={i} className="flex items-center justify-between group">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full ring-2 ring-white dark:ring-slate-800" style={{ backgroundColor: d.color }}></div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{d.label}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{formatRupiah(d.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card title="Status Stok Unit" action={<Link href="/dashboard/unit" className={dashboardActionClass}>Master Unit</Link>}>
          <div className="flex flex-col items-center gap-6 py-2">
            <DonutChart data={[
              { label: "Tersedia", value: unitStats.TERSEDIA, color: "#10b981" },
              { label: "Booking", value: unitStats.BOOKING, color: "#3b82f6" },
              { label: "Proses Akad", value: unitStats.AKAD, color: "#f59e0b" },
              { label: "Lunas", value: unitStats.LUNAS, color: "#a855f7" },
              { label: "Serah Terima", value: unitStats.SERAH_TERIMA, color: "#64748b" },
            ]} valueFormatter={(value) => `${value} Unit`} />
            <div className="flex-1 w-full space-y-2.5">
              {[
                { label: "Tersedia", value: unitStats.TERSEDIA, color: "#10b981" },
                { label: "Booking/Indent", value: unitStats.BOOKING + unitStats.INDENT, color: "#3b82f6" },
                { label: "Akad", value: unitStats.AKAD, color: "#f59e0b" },
                { label: "Lunas", value: unitStats.LUNAS, color: "#a855f7" },
                { label: "Terjual (ST)", value: unitStats.SERAH_TERIMA, color: "#64748b" },
              ].map((d, i) => (
                <div key={i} className="flex items-center justify-between group">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full ring-2 ring-white dark:ring-slate-800" style={{ backgroundColor: d.color }}></div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{d.label}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{d.value} Unit</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card title="Agenda Proyek" action={<Link href="/dashboard/calendar" className={dashboardActionClass}>Full Agenda</Link>}>
          <div className="py-2">
             <MiniCalendar 
               events={calendarEvents} 
               selectedDate={selectedDate} 
               onSelectDate={setSelectedDate}
               onNavigate={setSelectedDate}
             />
             <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700">
                <div className="flex items-start gap-3">
                   <div className="w-8 h-8 rounded-lg bg-[#EA6C00]/10 flex items-center justify-center text-[#EA6C00] shrink-0 font-bold text-xs">
                      {selectedDate.getDate()}
                   </div>
                   <div className="flex-1">
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">{format(selectedDate, 'eeee, dd MMM yyyy', { locale: idLocale })}</p>
                      <div className="mt-2 space-y-2">
                        {selectedDateEvents.length > 0 ? (
                          selectedDateEvents.map((evt, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg group">
                               <div className="flex items-center gap-2">
                                  <div className={`w-1.5 h-1.5 rounded-full ${evt.status === 'DONE' ? 'bg-emerald-500' : 'bg-[#EA6C00]'}`}></div>
                                  <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 line-clamp-1">{evt.title}</span>
                               </div>
                               <span className="text-[10px] text-slate-400 font-bold">{evt.time}</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-[10px] text-slate-400 italic">Tidak ada agenda hari ini</p>
                        )}
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </Card>
      </div>

      <div className="mb-4 lg:mb-3">
        <Card title="Arus Kas (6 Bulan Terakhir)">
          <div className="h-[320px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={cashFlowData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={true} stroke="#e2e8f0" className="dark:stroke-slate-700/50" />
                <XAxis dataKey="month" tick={{fontSize: 11, fill: '#64748b'}} tickMargin={10} axisLine={{stroke: '#cbd5e1'}} tickLine={false} />
                <YAxis tickFormatter={(val) => formatCompact(val)} tick={{fontSize: 11, fill: '#64748b'}} axisLine={false} tickLine={false} />
                <Tooltip 
                   formatter={(value: any) => formatRupiah(Number(value))}
                   contentStyle={{ borderRadius: '12px', border: '1px solid #EA6C00', background: '#1a2332', boxShadow: '0 4px 16px rgba(0,0,0,0.3)', fontSize: '12px', color: '#fff' }}
                   labelStyle={{ fontWeight: 'bold', color: '#EA6C00', marginBottom: '8px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="masuk" name="Kas Masuk" fill="url(#colorMasuk)" stroke="#22c55e" strokeWidth={2} fillOpacity={0.2} />
                <Area type="monotone" dataKey="keluar" name="Kas Keluar" fill="url(#colorKeluar)" stroke="#ef4444" strokeWidth={2} fillOpacity={0.2} />
                <Line type="monotone" dataKey="bersih" name="Arus Bersih (Kumulatif)" stroke="#1e293b" strokeWidth={2.5} strokeDasharray="5 5" className="dark:stroke-slate-300" dot={false} activeDot={{ r: 6 }} />
                
                <defs>
                  <linearGradient id="colorMasuk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorKeluar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Transaksi List Grid */}
      <div className="grid grid-cols-1 gap-4 lg:gap-3">
        <div>
          <Card title="Transaksi Terbaru" action={
            <Link href="/dashboard/transaksi" className={dashboardActionClass}>
              Lihat Semua Transaksi
            </Link>
          }>
            {recentTransactions.length === 0 ? (
              <div className="text-center text-sm text-gray-500 py-10 italic">Belum ada transaksi dicatat.</div>
            ) : (
              <div className="overflow-x-auto -mx-5 px-5 mt-2">
                <table className="w-full min-w-[900px] border-collapse">
                  <thead className="bg-[#F9FAFB] dark:bg-slate-700/40">
                    <tr>
                      <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-widest text-gray-400 w-[120px]">TANGGAL</th>
                      <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-widest text-gray-400 w-[150px]">NO. REFERENSI</th>
                      <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-widest text-gray-400">KETERANGAN</th>
                      <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-widest text-gray-400 w-[120px]">PROYEK</th>
                      <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-widest text-gray-400 w-[160px]">KATEGORI</th>
                      <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-widest text-gray-400 w-[160px]">JUMLAH (RP)</th>
                      <th className="px-5 py-4 text-center text-xs font-bold uppercase tracking-widest text-gray-400 w-[100px]">AKSI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F3F4F6] dark:divide-white/[0.05]">
                    {paginatedTransactions.map((trx) => (
                      <tr key={trx.id} className="hover:bg-[#FFF0E6] dark:hover:bg-orange-500/10 transition-all duration-150 group">
                        <td className="px-5 py-4 whitespace-nowrap text-xs font-medium text-gray-500 dark:text-gray-400">
                          {formatDate(trx.date)}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{trx.reference}</span>
                            {trx.hasJournal && (
                              <div title="Jurnal Otomatis Terbuat" className="text-green-500 bg-green-50 dark:bg-green-900/30 p-1 rounded-full cursor-help">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3.5 h-3.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                </svg>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{trx.description}</span>
                            {trx.note && <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 italic">{trx.note}</span>}
                          </div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm font-semibold text-gray-600 dark:text-gray-400">
                          {trx.projectCode || "-"}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <CategoryBadge category={trx.category as TransactionCategory} size="sm" />
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm font-bold text-[#EA6C00] dark:text-[#F97316] text-right">
                          {formatRupiah(trx.amount)}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-center text-gray-400">
                          <Link
                            href={`/dashboard/transaksi?search=${encodeURIComponent(trx.reference)}`}
                            className="inline-flex items-center justify-center p-1.5 hover:text-[#EA6C00] transition-colors rounded-lg hover:bg-white dark:hover:bg-slate-800"
                            title="Lihat di halaman transaksi"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 21 3m0 0h-3.75M21 3v3.75M21 3 10.5 13.5" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5v4.125A1.875 1.875 0 0 1 17.625 19.5H6.375A1.875 1.875 0 0 1 4.5 17.625V6.375A1.875 1.875 0 0 1 6.375 4.5H10.5" />
                            </svg>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination UI */}
            {recentTransactions.length > 0 && (
              <div className="mt-4 pt-4 border-t border-[#F3F4F6] dark:border-slate-700/50 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-500 dark:text-gray-400 order-2 md:order-1">
                  Total Transaksi: <span className="font-bold text-gray-900 dark:text-white">{recentTransactions.length}</span>
                </div>
                
                <div className="flex items-center gap-1 order-1 md:order-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 text-gray-400 hover:text-[#EA6C00] disabled:opacity-30 disabled:hover:text-gray-400 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  
                  {getPageNumbers().map((num, idx) => (
                    num === "..." ? (
                      <span key={`dots-${idx}`} className="px-3 py-1 text-gray-400">...</span>
                    ) : (
                      <button
                        key={`page-${num}`}
                        onClick={() => setCurrentPage(num as number)}
                        className={`w-8 h-8 rounded-lg text-sm font-bold transition-all ${
                          currentPage === num
                            ? "bg-[#FFF0E6] text-[#EA6C00] border border-[#EA6C00]"
                            : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700"
                        }`}
                      >
                        {num}
                      </button>
                    )
                  ))}

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 text-gray-400 hover:text-[#EA6C00] disabled:opacity-30 disabled:hover:text-gray-400 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                <div className="flex items-center gap-3 order-3">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Show:</span>
                  <div className="relative" ref={itemsPerPageRef}>
                    <button
                      type="button"
                      onClick={() => setItemsPerPageOpen(!itemsPerPageOpen)}
                      className="flex items-center gap-2 px-2 py-1 min-w-[50px] justify-between border border-[#EA6C00] rounded-lg text-xs font-bold text-[#EA6C00] bg-white dark:bg-slate-800 transition-all active:scale-95"
                    >
                      <span>{itemsPerPage}</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={`w-3 h-3 transition-transform duration-200 ${itemsPerPageOpen ? "rotate-180" : ""}`}
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>

                    {itemsPerPageOpen && (
                      <div className="absolute z-50 bottom-full left-0 mb-2 w-[60px] bg-white dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 rounded-[10px] shadow-lg overflow-hidden flex flex-col p-1 animate-in slide-in-from-bottom-2 duration-200">
                        {[5, 10, 20].map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => {
                              setItemsPerPage(val);
                              setCurrentPage(1);
                              setItemsPerPageOpen(false);
                            }}
                            className={`text-center py-1.5 text-xs font-bold rounded-md transition-all ${
                              itemsPerPage === val
                                ? "bg-[#EA6C00] text-white"
                                : "text-[#374151] dark:text-gray-300 hover:bg-[#FFF0E6] dark:hover:bg-orange-900/30 hover:text-[#EA6C00]"
                            }`}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>


      </div>
    </div>
  );
}
