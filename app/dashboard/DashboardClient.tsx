"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from "recharts";
import { Calendar as BigCalendar, dateFnsLocalizer, ToolbarProps, Views } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";

const rbcLocalizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales: { id: idLocale },
});

// ─── Helpers ────────────────────────────────────────────────────
function formatRupiah(num: number) {
  return "Rp " + num.toLocaleString("id-ID");
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
              formatter={(value: number) => formatRupiah(value)}
              contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
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
      "rounded-2xl p-5 flex  flex-col justify-between relative overflow-hidden transition-all duration-300 group shadow-sm",
      accent
        ? "bg-[#18202f] text-white"
        : "bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-gray-100"
    )}>
      <div className="flex items-center justify-between mb-3">
        <span className={cn("text-xs font-semibold uppercase tracking-widest", accent ? "text-slate-100" : "text-gray-500 dark:text-gray-400")}>
          {title}
        </span>
        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", accent ? "bg-[#273549] text-[#EA6C00] dark:text-[#F97316]" : "bg-[#FFF0E6] dark:bg-[#431407] text-[#EA6C00] dark:text-[#F97316]")}>
          {icon}
        </div>
      </div>
      <div>
        <p className={cn("text-2xl font-bold leading-tight", accent ? "text-white" : "text-gray-900 dark:text-gray-100")}>{value}</p>
        <p className={cn("text-xs mt-1 line-clamp-1 opacity-50 ", accent ? "text-slate-300" : "text-gray-400 dark:text-gray-500")}>{subtitle}</p>
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

// ─── Mini Calendar Toolbar ────────────────────────────────────────
function MiniToolbar({ label, onNavigate }: ToolbarProps) {
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
        className={`relative flex items-center justify-center mx-auto transition-all text-xs font-semibold hover:shadow-xs w-7 h-7 rounded-lg ${
          isSelected 
            ? "bg-[#EA6C00] text-white!" 
            : isToday 
              ? "bg-[rgba(234,108,0,0.1)] dark:bg-[rgba(234,108,0,0.2)] text-[#EA6C00]! outline outline-[1.5px] outline-[#EA6C00] outline-offset-1" 
              : bg 
                ? "bg-[#FFF0E6] dark:bg-[rgba(234,108,0,0.15)] text-gray-800 dark:text-[#E5E7EB]!" 
                : "text-gray-800 dark:text-[#E5E7EB]!"
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
        onNavigate={(date) => onNavigate(date)}
        selectable
        onSelectSlot={({ start }) => onSelectDate(start)}
        dayPropGetter={dayPropGetter}
        eventPropGetter={eventPropGetter}
        components={{ 
          toolbar: MiniToolbar,
          month: {
            dateHeader: CustomDateHeader
          }
        }}
        popup={false}
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
  projectFilter,
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
  projectFilter: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

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

  // Filter events for the selected date
  const selectedDateEvents = calendarEvents.filter(evt => {
    const evtDate = new Date(evt.date);
    return evtDate.getFullYear() === selectedDate.getFullYear()
      && evtDate.getMonth() === selectedDate.getMonth()
      && evtDate.getDate() === selectedDate.getDate();
  });

  // Switch project filter
  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    // Kept for backward compatibility if used anywhere else in the file, otherwise can safely be omitted.
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
    <div className="border-2 shadow-xl border-gray-200 dark:border-gray-800 rounded-2xl bg-gray-100 dark:bg-[#0f172a] text-gray-600 dark:text-gray-300 pt-4 md:p-5 md:pt-5 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
          <p className="text-sm text-gray-400 dark:text-gray-400 mt-3">Ringkasan kinerja keuangan dan monitoring proyek</p>
        </div>
        <ProjectFilterDropdown 
          projects={projects}
          selectedProject={projectFilter}
          onSelect={(val) => {
            const params = new URLSearchParams(searchParams.toString());
            if (val === "all") {
              params.delete("project");
            } else {
              params.set("project", val);
            }
            router.replace(`${pathname}?${params.toString()}`);
          }}
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-3 mb-4 lg:mb-3">
        <SummaryCard title="Total Pendapatan" value={formatRupiah(totalRevenue)} subtitle="Saldo normal Kredit" accent
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" /></svg>}
        />
        <SummaryCard title="Total Beban/Biaya" value={formatRupiah(totalExpenses)} subtitle="Saldo normal Debit"
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" /></svg>}
        />
        <SummaryCard title="Laba Bersih" value={formatRupiah(labaBersih)} subtitle="Pendapatan - Beban"
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
        />
        <SummaryCard title="Total Transaksi" value={totalTransaksi.toLocaleString("id-ID")} subtitle="Transaksi Kas Terdaftar"
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
        />
      </div>
      <div className=" grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-3 mb-4 lg:mb-3">
        {/* Breakdown Biaya */}
        <Card title="Breakdown Biaya">
          <div className="flex flex-col items-center gap-6 mt-2">
            <div className="flex-shrink-0">
              <DonutChart data={breakdownData} size={200} />
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

        {/* Kalender Widget */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-sm h-[520px] flex flex-col overflow-hidden">
            {/* Card Header */}
            <div className="flex items-center justify-between mb-4 border-b border-gray-100 dark:border-slate-700 pb-3 flex-shrink-0">
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">Kalender</h3>
              <Link href="/dashboard/calendar" className="text-xs font-semibold text-[#EA6C00] hover:text-[#C25500] dark:text-[#F97316] dark:hover:text-[#FFF0E6] transition-colors border border-[#EA6C00] dark:border-[#F97316] px-3 py-1.5 rounded-md hover:bg-[#FFF0E6] dark:hover:bg-[#431407]">
                Lihat semua
              </Link>
            </div>
            {/* Calendar grid — fixed, no shrink */}
            <div className="flex-shrink-0">
              <MiniCalendar
                events={calendarEvents}
                selectedDate={selectedDate}
                onSelectDate={(date) => setSelectedDate(date)}
                onNavigate={(date) => {
                  setSelectedDate(date);
                  fetchCalendarEvents(date);
                }}
              />
            </div>
            {/* Agenda for selected date */}
            <div className="mt-4 flex-1 flex flex-col min-h-0">
              <h4 className="text-xs font-bold text-gray-500 dark:text-[#6B7280] uppercase tracking-wider mb-2 flex-shrink-0">Agenda Hari Ini</h4>
              {selectedDateEvents.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center text-sm text-gray-400 italic">Tidak ada agenda untuk tanggal ini.</div>
                </div>
              ) : (
                <div className="flex flex-col" style={{ gap: '10px' }}>
                  {selectedDateEvents.slice(0, 2).map((evt, i) => {
                    const startStr = new Date(evt.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
                    const endStr = evt.endDate ? new Date(evt.endDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : null;
                    const timeRange = endStr ? `${startStr} - ${endStr}` : startStr;
                    
                    const dotColor = evt.type === 'AUTO' || evt.isLocked ? '#E24B4A' : evt.status === 'DONE' ? '#639922' : '#EA6C00';
                    return (
                      <div key={i} className="flex items-center justify-between">
                        {/* Left: dot + name + date */}
                        <div className="flex items-start gap-2 min-w-0">
                          <span
                            className="flex-shrink-0 rounded-full mt-1.5"
                            style={{ width: '6px', height: '6px', background: dotColor }}
                          />
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-medium text-gray-800 dark:text-[#E5E7EB] truncate">{evt.title}</span>
                          </div>
                        </div>
                        {/* Right: time range */}
                        <span className="text-[10px] font-medium text-gray-400 dark:text-[#6B7280] flex-shrink-0 ml-2">{timeRange}</span>
                      </div>
                    );
                  })}
                  {selectedDateEvents.length > 2 && (
                    <Link
                      href={`/dashboard/calendar?date=${format(selectedDate, 'yyyy-MM-dd')}`}
                      className="text-xs font-semibold text-[#EA6C00] dark:text-[#F97316] mt-2 hover:underline text-center block w-full"
                    >
                      Selengkapnya ({selectedDateEvents.length - 2})
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Project List */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-sm h-[520px] flex flex-col overflow-hidden">
            {/* Card Header */}
            <div className="flex items-center justify-between mb-4 border-b border-gray-100 dark:border-slate-700 pb-3 flex-shrink-0">
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">Status Proyek Aktif</h3>
              <Link href="/dashboard/projek" className="text-xs font-semibold text-[#EA6C00] hover:text-[#C25500] dark:text-[#F97316] dark:hover:text-[#FFF0E6] transition-colors border border-[#EA6C00] dark:border-[#F97316] px-3 py-1.5 rounded-md hover:bg-[#FFF0E6] dark:hover:bg-[#431407]">
                Kelola Proyek
              </Link>
            </div>
            {/* List with fixed height to fit into flex-col card */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex flex-col gap-2 overflow-y-auto custom-scrollbar pr-1">
                {projects.length === 0 ? (
                  <div className="text-center text-sm text-gray-500 py-10 italic">Belum ada proyek.</div>
                ) : projects.slice(0, 5).map((p, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 hover:border-[#EA6C00] dark:hover:border-[#F97316] transition-all shadow-sm group">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#FFF0E6] dark:bg-[#431407] flex items-center justify-center font-bold text-[#EA6C00] dark:text-[#F97316] text-xs border border-orange-100 dark:border-[#EA6C00]/40">
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
              
              {projects.length > 5 && (
                <div className="mt-4 pt-3 text-center border-t border-gray-50 dark:border-slate-700/50">
                  <Link
                    href="/dashboard/projek"
                    className="text-xs font-semibold text-[#EA6C00] dark:text-[#F97316] hover:underline"
                  >
                    Selengkapnya ({projects.length - 5})
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-3 mb-4 lg:mb-3">
        {/* Budget vs Realisasi */}
        <Card title="Budget vs Realisasi">
          <div className="flex flex-col gap-5 mt-4">
            {/* Budget Bar */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-gray-500 dark:text-gray-400">
                <span>Budget</span>
                <span className="text-gray-700 dark:text-gray-200 font-bold">{formatCompact(totalBudget)}</span>
              </div>
              <div className="relative h-8 w-full bg-gray-100 dark:bg-slate-700/50 rounded-full overflow-hidden" style={{ opacity: 0.95 }}>
                <div
                  className="absolute left-0 top-0 h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${Math.max(totalBudget, totalExpenses) > 0 ? (totalBudget / Math.max(totalBudget, totalExpenses)) * 100 : 0}%`,
                    background: '#EA6C00',
                    boxShadow: '0 2px 8px rgba(234,108,0,0.25)'
                  }}
                />
              </div>
            </div>

            {/* Realisasi Bar */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-gray-500 dark:text-gray-400">
                <span>Realisasi</span>
                <span className="text-gray-700 dark:text-gray-200 font-bold">{formatCompact(totalExpenses)}</span>
              </div>
              <div className="relative h-8 w-full bg-gray-100 dark:bg-slate-700/50 rounded-full overflow-hidden" style={{ opacity: 0.95 }}>
                <div
                  className="absolute left-0 top-0 h-full rounded-full border-2 border-[#EA6C00] transition-all duration-1000"
                  style={{
                    width: `${Math.max(totalBudget, totalExpenses) > 0 ? (totalExpenses / Math.max(totalBudget, totalExpenses)) * 100 : 0}%`,
                    background: '#FFF0E6',
                  }}
                />
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-8 mt-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ background: '#EA6C00' }}></span>
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Budget</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full border-2 border-[#EA6C00]" style={{ background: '#FFF0E6' }}></span>
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Realisasi</span>
              </div>
            </div>

            {/* Summary */}
            <div className="mt-1 flex items-center justify-between px-1">
              <span className="text-xs text-gray-400">
                {totalExpenses > totalBudget
                  ? <span className="text-red-500 font-semibold">Melebihi budget sebesar {formatCompact(totalExpenses - totalBudget)}</span>
                  : <span className="text-[#EA6C00] font-semibold">Sisa budget: {formatCompact(totalBudget - totalExpenses)}</span>
                }
              </span>
              <span className="text-xs font-bold text-gray-500">
                {Math.max(totalBudget, totalExpenses) > 0
                  ? `${Math.round((totalExpenses / totalBudget) * 100)}%`
                  : '0%'} terpakai
              </span>
            </div>
          </div>
        </Card>

        {/* Ringkasan Penerimaan */}
        <Card title="Ringkasan Transaksi Masuk">
          <div className="flex flex-col gap-1 mt-2">
            <div className="flex items-center justify-between p-[10px_12px] hover:bg-[#FFF0E6] dark:hover:bg-[#431407] rounded-lg transition-all group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#FFF0E6] dark:bg-[#431407] flex items-center justify-center">
                  <svg className="w-4 h-4 text-[#EA6C00] dark:text-[#F97316]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>
                </div>
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Total Booking Fee</span>
              </div>
              <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{formatRupiah(totalBookingFee)}</span>
            </div>
            <div className="flex items-center justify-between p-[10px_12px] hover:bg-[#FFF0E6] dark:hover:bg-[#431407] rounded-lg transition-all group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#FFF0E6] dark:bg-[#431407] flex items-center justify-center">
                  <svg className="w-4 h-4 text-[#EA6C00] dark:text-[#F97316]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                </div>
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Total Down Payment</span>
              </div>
              <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{formatRupiah(totalDownPayment)}</span>
            </div>
            
            <div className="mt-4 bg-[#0f172a] dark:bg-slate-900 rounded-xl p-4 flex items-center justify-between shadow-sm">
              <span className="text-sm font-bold text-slate-300">Total Kas Masuk (BF+DP)</span>
              <span className="text-lg font-bold text-white">{formatRupiah(totalBookingFee + totalDownPayment)}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Arus Kas Chart */}
      <div className="mb-4 lg:mb-3">
        <Card title="Arus Kas (6 Bulan Terakhir)">
          <div className="h-[320px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={cashFlowData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={true} stroke="#e2e8f0" className="dark:stroke-slate-700/50" />
                <XAxis dataKey="month" tick={{fontSize: 11, fill: '#64748b'}} tickMargin={10} axisLine={{stroke: '#cbd5e1'}} tickLine={false} />
                <YAxis tickFormatter={(val) => formatCompact(val)} tick={{fontSize: 11, fill: '#64748b'}} axisLine={false} tickLine={false} />
                <Tooltip 
                   formatter={(value: number) => formatRupiah(value)}
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
            <Link href="/dashboard/transaksi" className="text-xs font-semibold text-[#EA6C00] hover:text-[#C25500] dark:text-[#F97316] dark:hover:text-[#FFF0E6] transition-colors border border-[#EA6C00] dark:border-[#F97316] px-3 py-1.5 rounded-md hover:bg-[#FFF0E6] dark:hover:bg-[#431407]">
              Lihat Semua Transaksi
            </Link>
          }>
            {recentTransactions.length === 0 ? (
              <div className="text-center text-sm text-gray-500 py-10 italic">Belum ada transaksi dicatat.</div>
            ) : (
              <div className="overflow-x-auto -mx-5 px-5 mt-2">
                <table className="w-full min-w-[700px]">
                  <thead className="bg-[#F9FAFB] dark:bg-slate-800/60 border-y border-[#F3F4F6] dark:border-slate-700">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-widest text-gray-400">Tanggal</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-widest text-gray-400">Referensi</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-widest text-gray-400">Keterangan</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-widest text-gray-400">Kategori</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-widest text-gray-400">Jumlah</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F3F4F6] dark:divide-slate-700/50">
                    {recentTransactions.map((trx) => (
                      <tr key={trx.id} className="hover:bg-[#FFF0E6] dark:hover:bg-[#431407] transition-all duration-150 group">
                        <td className="px-5 py-4 whitespace-nowrap text-xs font-medium text-slate-600 dark:text-slate-400">{formatDate(trx.date)}</td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm font-bold text-slate-800 dark:text-slate-200">{trx.reference}</td>
                        <td className="px-5 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">{trx.description}</td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${CATEGORY_COLORS[trx.category] || "bg-gray-100 text-gray-700"}`}>
                            {CATEGORY_LABELS[trx.category] || trx.category}
                          </span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm font-semibold text-[#EA6C00] dark:text-[#F97316] text-right">
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


      </div>
    </div>
  );
}
