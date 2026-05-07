"use client";

import React, { useState, useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Calendar as BigCalendar,
  dateFnsLocalizer,
  Views,
} from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import CategoryBadge from "@/components/ui/CategoryBadge";
import AIInsightCard from "@/components/AIInsightCard";
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
  if (num >= 1000000000) return (num / 1000000000).toFixed(0) + " M";
  if (num >= 1000000) return (num / 1000000).toFixed(0) + " jt";
  if (num >= 1000) return (num / 1000).toFixed(0) + " rb";
  return num.toString();
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${d.getDate().toString().padStart(2, "0")} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

const dashboardActionClass =
  "text-xs font-semibold text-[#EA6C00] hover:text-[#C25500] dark:text-[#F97316] dark:hover:text-[#FFF0E6] transition-colors border border-[#EA6C00] dark:border-[#F97316] px-3 py-1.5 rounded-md hover:bg-[#FFF0E6] dark:hover:bg-[#431407]";

function CashFlowTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 shadow-md px-4 py-3 text-sm">
      <p className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
        {label}
      </p>

      {payload.map((item, index) => {
        const seriesName = item.name || "";
        const isNetLine = seriesName.toLowerCase().includes("arus bersih");
        const textColor = isNetLine ? "#1e293b" : item.color || "#475569";

        return (
          <p
            key={`${seriesName}-${index}`}
            style={{ color: textColor }}
            className={`my-1 ${isNetLine ? "font-semibold mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/50" : "font-medium"}`}
          >
            {seriesName}: {formatRupiah(Number(item.value || 0))}
          </p>
        );
      })}
    </div>
  );
}

// ─── Chart Components ─────────────────────────────────────
const subscribeToClientMount = (onStoreChange: () => void) => {
  onStoreChange();
  return () => {};
};
const getClientMountedSnapshot = () => true;
const getServerMountedSnapshot = () => false;

function useClientMounted() {
  return useSyncExternalStore(
    subscribeToClientMount,
    getClientMountedSnapshot,
    getServerMountedSnapshot,
  );
}

function DonutChart({
  data,
  size = 160,
  valueFormatter = (value) =>
    formatRupiah(Number(Array.isArray(value) ? value[0] : value)),
}: {
  data: { label: string; value: number; color: string }[];
  size?: number;
  valueFormatter?: (
    value: number | string | readonly (string | number)[] | undefined,
  ) => string;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const chartData =
    total > 0 ? data : [{ label: "Belum Ada", value: 1, color: "#FFF0E6" }];

  const mounted = useClientMounted();

  if (!mounted) {
    return <div style={{ width: size, height: size }} />;
  }

  return (
    <div
      style={{ width: size, height: size }}
      className="relative drop-shadow-sm"
    >
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
                  <div className="rounded-xl border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 shadow-md px-3 py-2.5 text-xs font-semibold text-slate-900 dark:text-slate-100 animate-in fade-in zoom-in-95 duration-150">
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
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedItem =
    selectedProject === "all"
      ? { id: "all", label: "Semua Proyek (Global)" }
      : {
          id: selectedProject,
          label:
            projects.find((p) => p.id === selectedProject)?.name ||
            "Unknown Project",
        };

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative w-full md:min-w-[280px] md:w-auto" ref={dropdownRef}>
      <div
        onClick={() => {
          setIsOpen(true);
          setTimeout(() => inputRef.current?.focus(), 10);
        }}
        className={cn(
          "w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-800 border dark:border-slate-700 transition-all duration-200 shadow-sm outline-none rounded-xl cursor-pointer",
          isOpen 
            ? "border-slate-400 dark:border-slate-500 ring-4 ring-slate-50 dark:ring-slate-800/50" 
            : "border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600"
        )}
      >
        {isOpen ? (
          <input
            ref={inputRef}
            type="text"
            placeholder="Cari proyek..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-none outline-none text-[15px] font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 p-0"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="text-[15px] font-semibold text-slate-900 dark:text-slate-100 truncate pr-2">
            {selectedItem.label}
          </span>
        )}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={cn(
            "w-4 h-4 text-gray-400 transition-transform duration-300 ml-2 flex-shrink-0",
            isOpen ? "rotate-180" : ""
          )}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>

      {isOpen && (
        <div 
          className="absolute left-0 z-50 min-w-full w-full mt-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-xl p-1 flex flex-col gap-0.5 max-h-[300px] overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-200 origin-top rounded-xl"
        >
          {searchQuery === "" && (
            <DropdownItem 
              label="Semua Proyek (Global)" 
              isSelected={selectedProject === "all"} 
              onClick={() => {
                onSelect("all");
                setIsOpen(false);
                setSearchQuery("");
              }} 
            />
          )}
          
          {filteredProjects.length > 0 ? (
            filteredProjects.map((p) => (
              <DropdownItem 
                key={p.id}
                label={p.name} 
                isSelected={selectedProject === p.id} 
                onClick={() => {
                  onSelect(p.id);
                  setIsOpen(false);
                  setSearchQuery("");
                }} 
              />
            ))
          ) : (
            <div className="px-4 py-3 text-sm text-slate-400 italic">
              Proyek tidak ditemukan
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DropdownItem({ label, isSelected, onClick }: { label: string; isSelected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center justify-between px-3 py-2.5 text-left transition-colors duration-150 rounded-lg cursor-pointer gap-3",
        isSelected 
          ? "bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-slate-100 font-bold" 
          : "text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-100"
      )}
    >
      <div className="min-w-0">
        <span className="text-sm leading-snug line-clamp-2">
          {label}
        </span>
      </div>
    </button>
  );
}

// ─── Component Wrappers ───────────────────────────────────────
function SummaryCard({
  title,
  value,
  subtitle,
  icon,
  accent = false,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden transition-all duration-300 group shadow-sm",
        accent
          ? "bg-[#EA6C00] text-white shadow-lg shadow-orange-500/20"
          : "bg-white dark:bg-slate-800 border-[0.5px] border-[#E5E7EB] dark:border-slate-700 text-gray-900 dark:text-gray-100",
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <span
          className={cn(
            "card-label",
            accent ? "!text-white" : "text-gray-500 dark:text-gray-400",
          )}
        >
          {title}
        </span>
        <div
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center transition-transform group-hover:scale-110",
            accent
              ? "bg-white/20 text-white"
              : "bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-white",
          )}
        >
          {icon}
        </div>
      </div>
      <div>
        <p
          className={cn(
            "card-value",
            accent ? "!text-white" : "text-gray-900 dark:text-gray-100",
          )}
        >
          {value}
        </p>
        <p
          className={cn(
            "card-subtitle mt-1 line-clamp-1",
            accent ? "!text-white" : "text-gray-400 dark:text-gray-500 opacity-50",
          )}
        >
          {subtitle}
        </p>
      </div>
    </div>
  );
}

function Card({
  children,
  className = "",
  title,
  action,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "bg-white dark:bg-slate-800 rounded-[14px] border-[0.5px] border-[#E5E7EB] dark:border-slate-700 p-5 shadow-sm",
        className,
      )}
    >
      {(title || action) && (
        <div className="flex items-center justify-between mb-4 border-b border-gray-100 dark:border-slate-700 pb-3">
          {title && (
            <h3 className="section-title dark:text-gray-100">{title}</h3>
          )}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

// ─── Mini Calendar Toolbar ────────────────────────────────────────
function MiniToolbar({
  label,
  onNavigate,
}: {
  label: string;
  onNavigate: (action: string) => void;
}) {
  const monthNames = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];
  return (
    <div className="flex items-center justify-between mb-3">
      <button
        onClick={() => onNavigate("PREV")}
        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
      >
        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <span className="text-base font-semibold text-slate-900 dark:text-[#F9FAFB]">
        {label}
      </span>
      <button
        onClick={() => onNavigate("NEXT")}
        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
      >
        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}

// ─── Mini Calendar (react-big-calendar) ───────────────────────────
function MiniCalendar({
  events,
  selectedDate,
  onSelectDate,
  onNavigate,
}: {
  events: any[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onNavigate: (date: Date) => void;
}) {
  const todayDay = new Date().getDate();

  const handleMonthNavigate = useCallback(
    (nextDate: Date) => {
      const year = nextDate.getFullYear();
      const month = nextDate.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const targetDay = Math.min(todayDay, daysInMonth);
      onNavigate(new Date(year, month, targetDay));
    },
    [onNavigate, todayDay],
  );

  // Build a map of dates that have events for dayPropGetter
  const eventDateMap = React.useMemo(() => {
    const map = new Map<string, string>(); // dateKey -> priority color
    for (const evt of events) {
      const d = new Date(evt.date);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const existing = map.get(key);
      // Priority: AUTO > MANUAL > DONE
      if (evt.status === "DONE" && !existing) {
        map.set(key, "#EAF3DE");
      } else if (evt.type === "MANUAL" && existing !== "#FCEBEB") {
        map.set(key, "#E6F1FB");
      } else if (evt.type === "AUTO" || evt.isLocked) {
        map.set(key, "#FCEBEB");
      }
    }
    return map;
  }, [events]);

  const dayPropGetter = useCallback((date: Date) => {
    return {
      style: {
        backgroundColor: "transparent",
        border: "none",
      },
    };
  }, []);

  // Custom header to make rounded squares
  const CustomDateHeader = useCallback(
    ({ date, label }: any) => {
      const todayObj = new Date();
      const isToday =
        date.getFullYear() === todayObj.getFullYear() &&
        date.getMonth() === todayObj.getMonth() &&
        date.getDate() === todayObj.getDate();

      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      const selKey = `${selectedDate.getFullYear()}-${selectedDate.getMonth()}-${selectedDate.getDate()}`;
      const bg = eventDateMap.get(key);
      const isSelected = key === selKey;

      const isOffRange = date.getMonth() !== selectedDate.getMonth();

      return (
        <button
          type="button"
          onClick={() => onSelectDate(date)}
          className={`relative flex items-center justify-center mx-auto transition-all w-9 h-9 rounded-xl ${
            isSelected
              ? "mini-cal-selected-day bg-orange-500 text-white font-semibold shadow-sm"
              : isToday
                ? "bg-orange-50 text-orange-600 font-semibold dark:bg-orange-500/20"
                : isOffRange
                  ? "text-sm font-medium text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
                  : "text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          }`}
          style={isSelected ? { color: "#ffffff" } : undefined}
        >
          {date.getDate()}
          {bg && (
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-orange-500"></span>
          )}
        </button>
      );
    },
    [eventDateMap, onSelectDate, selectedDate],
  );

  // Hide event chips on the grid
  const eventPropGetter = useCallback(
    () => ({
      style: { display: "none" as const },
    }),
    [],
  );

  const calEvents = events.map((e) => ({
    ...e,
    start: new Date(e.date),
    end: e.endDate
      ? new Date(e.endDate)
      : new Date(new Date(e.date).getTime() + 3600000),
  }));

  const mounted = useClientMounted();

  if (!mounted) {
    return (
      <div className="mini-calendar-widget" style={{ height: 300 }}>
        <div className="w-full h-full rounded-2xl bg-slate-50 dark:bg-slate-800/50 animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="mini-calendar-widget">
      <BigCalendar
        localizer={rbcLocalizer}
        culture="id"
        events={[]}
        view={Views.MONTH}
        views={[Views.MONTH]}
        date={selectedDate}
        onNavigate={(nextDate: any) => handleMonthNavigate(nextDate)}
        onDrillDown={(nextDate: any) => onSelectDate(nextDate)}
        selectable
        onSelectSlot={({ start }: { start: Date }) => onSelectDate(start)}
        dayPropGetter={dayPropGetter}
        eventPropGetter={() => ({ style: { display: "none" } })}
        components={{
          toolbar: (props: any) => (
            <MiniToolbar label={props.label} onNavigate={props.onNavigate} />
          ),
          month: { 
            dateHeader: CustomDateHeader,
            header: ({ label }: any) => (
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 py-1.5">
                {label.slice(0, 3)}
              </div>
            )
          },
        }}
        style={{ height: 300 }}
      />
      <style jsx global>{`
        .mini-calendar-widget .rbc-month-row {
          padding-bottom: 0px;
        }
        .mini-calendar-widget .rbc-row-content {
          z-index: 1;
        }
        .mini-calendar-widget .rbc-month-view {
          border: none;
        }
        .mini-calendar-widget .rbc-header {
          border: none;
        }
        .mini-calendar-widget .rbc-day-bg {
          border: none;
        }
        .mini-calendar-widget .rbc-row {
          column-gap: 4px;
        }
        .mini-calendar-widget .rbc-row-segment {
          margin-bottom: 8px;
        }
        .mini-cal-selected-day {
          color: white !important;
        }
      `}</style>
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
  bebanKonstruksi,
  bebanMarketing,
  bebanGaji,
  bebanOperasional,
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
  cashFlowData: {
    month: string;
    masuk: number;
    keluar: number;
    bersih: number;
  }[];
  breakdownData: { label: string; value: number; color: string }[];
  projects: any[];
  recentTransactions: any[];
  totalBookingFee: number;
  totalDownPayment: number;
  totalPelunasan: number;
  projectFilter: string;
  kasDiterima: number;
  pendapatanDiakui: number;
  bebanKonstruksi: number;
  bebanMarketing: number;
  bebanGaji: number;
  bebanOperasional: number;
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
      if (
        itemsPerPageRef.current &&
        !itemsPerPageRef.current.contains(event.target as Node)
      ) {
        setItemsPerPageOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const chartsMounted = useClientMounted();

  const totalPages = Math.ceil(recentTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = recentTransactions.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(
          1,
          "...",
          totalPages - 3,
          totalPages - 2,
          totalPages - 1,
          totalPages,
        );
      } else {
        pages.push(
          1,
          "...",
          currentPage - 1,
          currentPage,
          currentPage + 1,
          "...",
          totalPages,
        );
      }
    }
    return pages;
  };

  const fetchCalendarEvents = useCallback((date: Date) => {
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    fetch(`/api/calendar?month=${month}&year=${year}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setCalendarEvents(data.data);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetchCalendarEvents(selectedDate);
  }, [fetchCalendarEvents, selectedDate]);

  const selectedDateEvents = calendarEvents.filter((evt) => {
    const evtDate = new Date(evt.date);
    return (
      evtDate.getFullYear() === selectedDate.getFullYear() &&
      evtDate.getMonth() === selectedDate.getMonth() &&
      evtDate.getDate() === selectedDate.getDate()
    );
  });
  const selectedProject = projects.find((project) => project.id === projectFilter);
  const neracaBalanced =
    (totalAset || 0) === (totalKewajiban || 0) + (totalEkuitas || 0);
  const financialData = {
    projectName: selectedProject?.name ?? "Semua Proyek",
    kasDiterima: Number(kasDiterima ?? 0),
    pendapatanDiakui: Number(pendapatanDiakui ?? 0),
    totalBeban: Number(totalExpenses ?? 0),
    labaBersih: Number(labaBersih ?? 0),
    bebanKonstruksi: Number(bebanKonstruksi ?? 0),
    bebanMarketing: Number(bebanMarketing ?? 0),
    bebanGaji: Number(bebanGaji ?? 0),
    bebanOperasional: Number(bebanOperasional ?? 0),
    unitTersedia: Number(unitStats.TERSEDIA ?? 0),
    unitTerjual: Number(
      (unitStats.BOOKING ?? 0) +
        (unitStats.INDENT ?? 0) +
        (unitStats.AKAD ?? 0) +
        (unitStats.LUNAS ?? 0) +
        (unitStats.SERAH_TERIMA ?? 0),
    ),
    unitSerahTerima: Number(unitStats.SERAH_TERIMA ?? 0),
    piutangKPR: Number(piutangKPR ?? 0),
    totalAset: Number(totalAset ?? 0),
    neracaStatus: neracaBalanced ? "BALANCED" : "TIDAK BALANCED",
  };

  return (
    <div
      suppressHydrationWarning
      className="text-gray-600 dark:text-gray-300 w-full h-full"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
        <div>
          <h1 className="page-title dark:text-gray-100">
            Dashboard
          </h1>
          <p className="card-subtitle text-slate-500 dark:text-slate-400 mt-2">
            Ringkasan kinerja keuangan dan monitoring proyek
          </p>
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
        <SummaryCard
          title="Kas Diterima"
          value={formatRupiah(kasDiterima)}
          subtitle="DP + Booking + KPR Cair"
          accent
          icon={
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          }
        />
        <SummaryCard
          title="Pendapatan Diakui"
          value={formatRupiah(pendapatanDiakui)}
          subtitle="Nilai unit Lunas / Serah Terima"
          icon={<img src="/attach_money.svg" alt="" className="w-5 h-5 object-contain dark:invert dark:brightness-200" />}
          /* old_icon={
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
              />
            </svg>
          }*/
        />
        <SummaryCard
          title="Total Beban/Biaya"
          value={formatRupiah(totalExpenses)}
          subtitle="HPP + Operasional"
          icon={<img src="/shopping_cart.svg" alt="" className="w-5 h-5 object-contain dark:invert dark:brightness-200" />}
          /* old_icon={
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"
              />
            </svg>
          }*/
        />
        <SummaryCard
          title="Piutang KPR"
          value={formatRupiah(piutangKPR)}
          subtitle="Tagihan KPR yang belum cair"
          icon={
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
              />
            </svg>
          }
        />
      </div>

      <div className="mb-4 lg:mb-3">
        <AIInsightCard financialData={financialData} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-3 mb-4 lg:mb-3">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 dark:bg-slate-800 dark:border-slate-700 h-full flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Ringkasan Laba Rugi</h3>
            <Link 
              href="/dashboard/laporan" 
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors group dark:text-slate-400 dark:hover:text-slate-200"
            >
              Lihat detail
              <svg 
                className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 text-slate-400 group-hover:text-slate-600" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          
          <div className="bg-slate-100 dark:bg-slate-800/80 rounded-2xl px-5 py-4 flex flex-col flex-1">
            <div className="flex-1 flex flex-col justify-start">
              <div className="flex items-center justify-between py-3">
                <span className="text-[15px] font-medium text-slate-600 dark:text-slate-400">
                  Pendapatan Diakui
                </span>
                <span className="text-[15px] font-semibold text-slate-900 dark:text-slate-200 tabular-nums">
                  {formatRupiah(pendapatanDiakui)}
                </span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-[15px] font-medium text-slate-600 dark:text-slate-400">
                  Total Beban
                </span>
                <span className="text-[15px] font-semibold text-slate-900 dark:text-slate-200 tabular-nums">
                  ({formatRupiah(Math.abs(totalExpenses))})
                </span>
              </div>
            </div>
            
            <div className="border-t border-slate-200 dark:border-slate-700/50 my-3"></div>
            
            <div className="flex items-center justify-between py-2">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Laba Bersih
              </span>
              <span className={cn("text-2xl font-bold tabular-nums", labaBersih >= 0 ? "text-emerald-600" : "text-red-500")}>
                {formatRupiah(labaBersih)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 dark:bg-slate-800 dark:border-slate-700 h-full flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Neraca Singkat</h3>
            <Link 
              href="/dashboard/laporan?tab=neraca" 
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors group dark:text-slate-400 dark:hover:text-slate-200"
            >
              Lihat detail
              <svg 
                className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 text-slate-400 group-hover:text-slate-600" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          
          <div className="bg-slate-100 dark:bg-slate-800/80 rounded-2xl px-5 py-4 flex flex-col flex-1">
            <div className="flex items-center justify-between py-3">
              <span className="text-[15px] font-medium text-slate-600 dark:text-slate-400">
                Total Aset
              </span>
              <span className="text-[15px] font-semibold text-slate-900 dark:text-slate-200 tabular-nums">
                {formatRupiah(totalAset || 0)}
              </span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-[15px] font-medium text-slate-600 dark:text-slate-400">
                Total Kewajiban
              </span>
              <span className="text-[15px] font-semibold text-slate-900 dark:text-slate-200 tabular-nums">
                {formatRupiah(totalKewajiban || 0)}
              </span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-[15px] font-medium text-slate-600 dark:text-slate-400">
                Total Ekuitas
              </span>
              <span className="text-[15px] font-semibold text-slate-900 dark:text-slate-200 tabular-nums">
                {formatRupiah(totalEkuitas || 0)}
              </span>
            </div>
            <div className="border-t border-slate-200 dark:border-slate-700/50 my-3"></div>
            
            <div className="flex items-center justify-between py-1">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Status
              </span>
              <span
                className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase",
                  (totalAset || 0) === (totalKewajiban || 0) + (totalEkuitas || 0)
                    ? "bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/30"
                    : "bg-red-50 text-red-600 border border-red-100 dark:bg-red-950/20 dark:border-red-900/30",
                )}
              >
                {(totalAset || 0) === (totalKewajiban || 0) + (totalEkuitas || 0)
                  ? "BALANCE"
                  : "UNBALANCED"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-3 mb-4 lg:mb-3">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 dark:bg-slate-800 dark:border-slate-700 h-full flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Proporsi Pengeluaran</h3>
            <Link 
              href={`/dashboard/laporan?tab=laba_rugi${projectFilter !== "all" ? `&project=${projectFilter}` : ""}`}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors group dark:text-slate-400 dark:hover:text-slate-200"
            >
              Detail Biaya
              <svg 
                className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 text-slate-400 group-hover:text-slate-600" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          <div className="flex flex-col items-center gap-6 py-2 flex-1">
            <DonutChart data={breakdownData} />
            <div className="flex-1 w-full bg-slate-100 dark:bg-slate-800/80 rounded-2xl px-5 py-4 flex flex-col space-y-3">
              {breakdownData.map((d, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: d.color }}
                    ></div>
                    <span className="text-[15px] font-medium text-slate-600 dark:text-slate-400">
                      {d.label}
                    </span>
                  </div>
                  <span className="text-[15px] font-semibold text-slate-900 dark:text-slate-200 tabular-nums">
                    {formatRupiah(d.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 dark:bg-slate-800 dark:border-slate-700 h-full flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Status Stok Unit</h3>
            <Link 
              href="/dashboard/unit" 
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors group dark:text-slate-400 dark:hover:text-slate-200"
            >
              Master Unit
              <svg 
                className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 text-slate-400 group-hover:text-slate-600" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          <div className="flex flex-col items-center gap-6 py-2 flex-1">
            <DonutChart
              data={[
                {
                  label: "Tersedia",
                  value: unitStats.TERSEDIA,
                  color: "#10b981",
                },
                {
                  label: "Booking",
                  value: unitStats.BOOKING,
                  color: "#3b82f6",
                },
                {
                  label: "Proses Akad",
                  value: unitStats.AKAD,
                  color: "#f59e0b",
                },
                { label: "Lunas", value: unitStats.LUNAS, color: "#a855f7" },
                {
                  label: "Serah Terima",
                  value: unitStats.SERAH_TERIMA,
                  color: "#64748b",
                },
              ]}
              valueFormatter={(value) => `${value} Unit`}
            />
            <div className="flex-1 w-full bg-slate-100 dark:bg-slate-800/80 rounded-2xl px-5 py-4 flex flex-col space-y-3">
              {[
                {
                  label: "Tersedia",
                  value: unitStats.TERSEDIA,
                  color: "#10b981",
                },
                {
                  label: "Booking/Indent",
                  value: unitStats.BOOKING + unitStats.INDENT,
                  color: "#3b82f6",
                },
                { label: "Akad", value: unitStats.AKAD, color: "#f59e0b" },
                { label: "Lunas", value: unitStats.LUNAS, color: "#a855f7" },
                {
                  label: "Terjual (ST)",
                  value: unitStats.SERAH_TERIMA,
                  color: "#64748b",
                },
              ].map((d, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: d.color }}
                    ></div>
                    <span className="text-[15px] font-medium text-slate-600 dark:text-slate-400">
                      {d.label}
                    </span>
                  </div>
                  <span className="text-[15px] font-semibold text-slate-900 dark:text-slate-200 tabular-nums">
                    {d.value} Unit
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 dark:bg-slate-800 dark:border-slate-700 h-full flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Agenda Proyek</h3>
            <Link
              href={`/dashboard/calendar?date=${format(selectedDate, "yyyy-MM-dd")}`}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors group dark:text-slate-400 dark:hover:text-slate-200"
            >
              Full Agenda
              <svg 
                className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          <div className="py-2 flex-1 flex flex-col">
            <div className="bg-slate-100 dark:bg-slate-800/80 rounded-2xl px-5 py-4 flex-1">
              <MiniCalendar
                events={calendarEvents}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                onNavigate={setSelectedDate}
              />
            </div>
            <div className="mt-5">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center text-orange-600 dark:text-orange-500 shrink-0 font-semibold text-sm">
                  {selectedDate.getDate()}
                </div>
                <div className="flex-1 pt-0.5">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-200">
                    {format(selectedDate, "eeee, dd MMM yyyy", {
                      locale: idLocale,
                    })}
                  </p>
                  <div className="mt-2.5 space-y-2">
                    {selectedDateEvents.length > 0 ? (
                      selectedDateEvents.map((evt, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl group"
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-1.5 h-1.5 rounded-full ${evt.status === "DONE" ? "bg-emerald-500" : "bg-orange-500"}`}
                            ></div>
                            <span className="text-xs font-medium text-slate-600 dark:text-slate-400 line-clamp-1">
                              {evt.title}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 font-bold">
                            {evt.date
                              ? format(new Date(evt.date), "HH:mm")
                              : "-"}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500 mt-1">
                        Tidak ada agenda hari ini
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-4 lg:mb-3">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 dark:bg-slate-800 dark:border-slate-700 flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-[16px] font-semibold text-slate-900 dark:text-white">Arus Kas (6 Bulan Terakhir)</h3>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800/80 rounded-2xl px-4 pt-4 pb-3 flex-1">
            <div className="h-[320px] w-full">
              {chartsMounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={cashFlowData}
                    margin={{ top: 16, right: 24, left: 8, bottom: 16 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      horizontal={true}
                      stroke="#e2e8f0"
                      className="dark:stroke-slate-700/50"
                      strokeOpacity={0.6}
                    />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 12, fill: "#64748b" }}
                      tickMargin={12}
                      axisLine={{ stroke: "#e2e8f0" }}
                      tickLine={false}
                    />
                    <YAxis
                      width={52}
                      tickFormatter={(val) => {
                        if (val === 0) return "0";
                        const sign = val < 0 ? "-" : "";
                        return `${sign}${Math.abs(val) / 1000000} jt`;
                      }}
                      tick={{ fontSize: 12, fill: "#64748b" }}
                      axisLine={false}
                      tickLine={false}
                      tickMargin={6}
                    />
                    <Tooltip content={<CashFlowTooltip />} />
                    <Legend
                      iconType="circle"
                      wrapperStyle={{ fontSize: "12px", color: "#475569", paddingTop: "20px" }}
                      iconSize={8}
                    />
                    <Area
                      type="monotone"
                      dataKey="masuk"
                      name="Kas Masuk"
                      fill="url(#colorMasuk)"
                      stroke="#10b981"
                      strokeWidth={2}
                      fillOpacity={1}
                      activeDot={{ r: 4, fill: "#10b981" }}
                      dot={{ r: 3, fill: "#10b981", strokeWidth: 0 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="keluar"
                      name="Kas Keluar"
                      fill="url(#colorKeluar)"
                      stroke="#ef4444"
                      strokeWidth={2}
                      fillOpacity={1}
                      activeDot={{ r: 4, fill: "#ef4444" }}
                      dot={{ r: 3, fill: "#ef4444", strokeWidth: 0 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="bersih"
                      name="Arus Bersih (Kumulatif)"
                      stroke="#1e293b"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      className="dark:stroke-slate-300"
                      dot={{ r: 3, fill: "#1e293b", strokeWidth: 0 }}
                      activeDot={{ r: 5, fill: "#1e293b" }}
                    />

                    <defs>
                      <linearGradient id="colorMasuk" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.12} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="colorKeluar" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.10} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: 320 }} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Transaksi List Grid */}
      <div className="grid grid-cols-1 gap-4 lg:gap-3">
        <div>
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 dark:bg-slate-800 dark:border-slate-700">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[16px] font-semibold text-slate-900 dark:text-white">Transaksi Terbaru</h3>
              <Link
                href="/dashboard/transaksi"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors group dark:text-slate-400 dark:hover:text-slate-200"
              >
                Lihat detail
                <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            <div className="bg-white dark:bg-slate-900/40 rounded-2xl flex flex-col border border-slate-200 dark:border-slate-700/50 overflow-hidden shadow-sm">
              {recentTransactions.length === 0 ? (
                <div className="text-center text-sm text-slate-500 py-10 italic">
                  Belum ada transaksi dicatat.
                </div>
              ) : (
                <div className="overflow-x-auto w-full scrollbar-hide">
                  <table className="w-full border-collapse">
                    <thead className="bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700/50">
                      <tr>
                        <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 w-[120px]">
                          Tanggal
                        </th>
                        <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 w-[150px]">
                          No. Referensi
                        </th>
                        <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                          Keterangan
                        </th>
                        <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 w-[120px]">
                          Proyek
                        </th>
                        <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 w-[160px]">
                          Kategori
                        </th>
                        <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 w-[160px]">
                          Jumlah (Rp)
                        </th>
                        <th className="px-6 py-3.5 text-center text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 w-[100px]">
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                      {paginatedTransactions.map((trx) => (
                        <tr
                          key={trx.id}
                          className="bg-white dark:bg-slate-900 hover:bg-slate-50/60 dark:hover:bg-slate-800/80 transition-colors group"
                        >
                          <td className="px-6 py-3.5 whitespace-nowrap text-sm font-medium text-slate-500 dark:text-slate-400">
                            {formatDate(trx.date)}
                          </td>
                          <td className="px-6 py-3.5 whitespace-nowrap">
                            <span className="text-sm font-semibold text-slate-900 dark:text-slate-200">
                              {trx.reference}
                            </span>
                          </td>
                          <td className="px-6 py-3.5">
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-slate-900 dark:text-slate-200">
                                {trx.description}
                              </span>
                              {trx.note && (
                                <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                  {trx.note}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-3.5 whitespace-nowrap text-sm font-medium text-slate-600 dark:text-slate-400">
                            {trx.projectCode || "-"}
                          </td>
                          <td className="px-6 py-3.5 whitespace-nowrap">
                            <CategoryBadge
                              category={trx.category as TransactionCategory}
                              size="sm"
                            />
                          </td>
                          <td className="px-6 py-3.5 whitespace-nowrap text-sm font-semibold text-slate-900 dark:text-slate-100 text-right tabular-nums">
                            {formatRupiah(trx.amount)}
                          </td>
                          <td className="px-6 py-3.5 whitespace-nowrap text-center">
                            <Link
                              href={`/dashboard/transaksi?search=${encodeURIComponent(trx.reference)}`}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors dark:hover:bg-slate-700 dark:hover:text-slate-300 mx-auto"
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
                <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-700/50 flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900/40">
                  <div className="text-sm text-slate-500 dark:text-slate-400 order-2 md:order-1">
                    Total Transaksi:{" "}
                    <span className="font-semibold text-slate-900 dark:text-slate-200">
                      {recentTransactions.length}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 order-1 md:order-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg disabled:opacity-30 disabled:hover:text-slate-400 disabled:hover:bg-transparent transition-colors dark:hover:text-slate-200 dark:hover:bg-slate-700"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>

                    {getPageNumbers().map((num, idx) =>
                      num === "..." ? (
                        <span key={`dots-${idx}`} className="px-3 py-1 text-slate-400">
                          ...
                        </span>
                      ) : (
                        <button
                          key={`page-${num}`}
                          onClick={() => setCurrentPage(num as number)}
                          className={`w-8 h-8 rounded-lg text-sm transition-all ${
                            currentPage === num
                              ? "bg-orange-50 text-orange-600 border border-orange-500 font-semibold dark:bg-orange-500/20 dark:border-orange-500/50"
                              : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 font-medium"
                          }`}
                        >
                          {num}
                        </button>
                      ),
                    )}

                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg disabled:opacity-30 disabled:hover:text-slate-400 disabled:hover:bg-transparent transition-colors dark:hover:text-slate-200 dark:hover:bg-slate-700"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>

                  <div className="flex items-center gap-3 order-3">
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                      Show:
                    </span>
                    <div className="relative" ref={itemsPerPageRef}>
                      <button
                      type="button"
                      onClick={() => setItemsPerPageOpen(!itemsPerPageOpen)}
                      className="flex items-center gap-2 px-2.5 py-1 min-w-[55px] justify-between border border-slate-200 hover:bg-slate-50 rounded-lg text-sm font-medium text-slate-700 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 transition-colors"
                    >
                      <span>{itemsPerPage}</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${itemsPerPageOpen ? "rotate-180" : ""}`}
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>

                    {itemsPerPageOpen && (
                      <div className="absolute z-50 bottom-full left-0 mb-2 w-full min-w-[60px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg overflow-hidden flex flex-col p-1 animate-in slide-in-from-bottom-2 duration-200">
                        {[5, 10, 20].map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => {
                              setItemsPerPage(val);
                              setCurrentPage(1);
                              setItemsPerPageOpen(false);
                            }}
                            className={`text-center py-1.5 text-sm font-medium rounded-md transition-colors ${
                              itemsPerPage === val
                                ? "bg-slate-100 text-slate-900 dark:bg-slate-700 dark:text-white"
                                : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
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
            </div>
          </div>
        </div>
        <br />
      </div>
    </div>
  );
}
