"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar";
import {
  format,
  parse,
  startOfWeek,
  getDay,
  isSameDay,
  startOfDay,
} from "date-fns";
import { id } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";

const locales = {
  "id-ID": id,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

type EventType = "AUTO" | "MANUAL";
type EventStatus = "PENDING" | "DONE" | "OVERDUE";

export interface ICalendarEvent {
  id?: string;
  title: string;
  description?: string | null;
  date: string | Date; // ISO string from API
  endDate?: string | Date | null;
  type?: EventType;
  status?: EventStatus;
  isLocked?: boolean;
}

function parseInitialDate(input?: string) {
  if (!input) return new Date();
  const parsed = new Date(input);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

export default function CalendarView({
  initialDate,
}: {
  initialDate?: string;
}) {
  const [events, setEvents] = useState<ICalendarEvent[]>([]);
  const [view, setView] = useState<string>(Views.MONTH);
  const [date, setDate] = useState<Date>(parseInitialDate(initialDate));
  const [filters, setFilters] = useState({
    pending: true,
    done: true,
    overdue: true,
  });

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ICalendarEvent | null>(
    null,
  );
  const [modalMode, setModalMode] = useState<"ADD" | "EDIT" | "VIEW">("ADD");

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    endDate: "",
    status: "PENDING" as EventStatus,
  });

  const [isLoading, setIsLoading] = useState(false);

  // Parse events for Big Calendar (needs actual Date objects for start/end)
  const filteredRawEvents = events.filter((event) => {
    if (event.status === "DONE" && !filters.done) return false;
    if (event.status === "OVERDUE" && !filters.overdue) return false;

    if ((!event.status || event.status === "PENDING") && !filters.pending) {
      return false;
    }

    return true;
  });

  const calendarEvents = filteredRawEvents.map((e) => {
    const start = new Date(e.date);
    const end = e.endDate
      ? new Date(e.endDate)
      : new Date(start.getTime() + 60 * 60 * 1000); // default 1 hour if no end
    return {
      ...e,
      start,
      end,
    };
  });

  const fetchEvents = useCallback(async (currentDate: Date) => {
    try {
      // Just fetch loosely based on year/month
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();
      const res = await fetch(`/api/calendar?month=${month}&year=${year}`);
      const data = await res.json();
      if (data.success) {
        setEvents(data.data);
      }
    } catch (error) {
      console.error("Error fetching events", error);
    }
  }, []);

  useEffect(() => {
    fetchEvents(date);
  }, [date, fetchEvents]);

  useEffect(() => {
    setDate(parseInitialDate(initialDate));
  }, [initialDate]);

  const onNavigate = (newDate: Date) => setDate(newDate);
  const onView = (newView: string) => setView(newView);

  const handleSelectSlot = ({ start }: { start: Date; end: Date }) => {
    setModalMode("ADD");
    setSelectedEvent(null);
    setFormData({
      title: "",
      description: "",
      date: format(start, "yyyy-MM-dd'T'HH:mm"),
      endDate: format(start, "yyyy-MM-dd'T'HH:mm"),
      status: "PENDING",
    });
    setIsModalOpen(true);
  };

  const handleSelectEvent = (event: any) => {
    setSelectedEvent(event);
    setFormData({
      title: event.title || "",
      description: event.description || "",
      date: format(new Date(event.date), "yyyy-MM-dd'T'HH:mm"),
      endDate: event.endDate
        ? format(new Date(event.endDate), "yyyy-MM-dd'T'HH:mm")
        : "",
      status: event.status || "PENDING",
    });
    if (event.isLocked) {
      setModalMode("VIEW");
    } else {
      setModalMode("EDIT");
    }
    setIsModalOpen(true);
  };

  const eventPropGetter = (event: any) => {
    let backgroundColor = "#378ADD"; // MANUAL
    if (event.status === "DONE") {
      backgroundColor = "#639922"; // DONE green
    } else if (event.type === "AUTO" || event.isLocked) {
      backgroundColor = "#E24B4A"; // AUTO red
    }

    return {
      style: {
        backgroundColor,
        borderRadius: "6px",
        opacity: 0.9,
        color: "white",
        border: "0px",
        display: "block",
        fontSize: "12px",
        fontWeight: "500",
      },
    };
  };

  const upcomingEvents = [...calendarEvents]
    .filter((event) => new Date(event.end) >= startOfDay(new Date()))
    .sort((a, b) => +new Date(a.start) - +new Date(b.start))
    .slice(0, 6);

  const Toolbar = (toolbarProps: any) => {
    const {
      label,
      onNavigate: navigate,
      onView: changeView,
      view: currentView,
    } = toolbarProps;

    const viewButtons = [
      { key: Views.MONTH, label: "Bulan" },
      { key: Views.WEEK, label: "Minggu" },
      { key: Views.DAY, label: "Hari" },
      { key: Views.AGENDA, label: "Agenda" },
    ];

    return (
      <div className="cal-toolbar">
        <div className="cal-toolbar-left">
          <button className="cal-btn-today" onClick={() => navigate("TODAY")}>
            Hari Ini
          </button>
          <div className="cal-nav-arrows">
            <button className="cal-btn-nav" onClick={() => navigate("PREV")}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 19.5 8.25 12l7.5-7.5"
                />
              </svg>
            </button>
            <button className="cal-btn-nav" onClick={() => navigate("NEXT")}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.25 4.5 15.75 12l-7.5 7.5"
                />
              </svg>
            </button>
          </div>
          <h3 className="cal-toolbar-label">{label}</h3>
        </div>

        <div className="cal-toolbar-center">
          {viewButtons.map((button) => (
            <button
              key={button.key}
              onClick={() => changeView(button.key)}
              className={`cal-view-btn ${currentView === button.key ? "active" : ""}`}
            >
              {button.label}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const MiniDateHeader = ({
    date: dayDate,
    label,
  }: {
    date: Date;
    label: string;
  }) => (
    <button
      type="button"
      onClick={() => setDate(dayDate)}
      className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-medium transition-colors ${
        isSameDay(dayDate, date)
          ? "mini-cal-selected-day bg-[#EA6C00] text-white"
          : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-slate-700"
      }`}
    >
      {label}
    </button>
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const isEdit = modalMode === "EDIT" && selectedEvent?.id;
      const url = isEdit
        ? `/api/calendar/${selectedEvent.id}`
        : "/api/calendar";
      const method = isEdit ? "PATCH" : "POST";

      const payload = {
        title: formData.title,
        description: formData.description,
        date: formData.date
          ? new Date(formData.date).toISOString()
          : new Date().toISOString(),
        endDate: formData.endDate
          ? new Date(formData.endDate).toISOString()
          : null,
        status: formData.status,
        type: "MANUAL", // forced by backend anyway
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchEvents(date);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedEvent?.id || selectedEvent.isLocked) return;
    if (!confirm("Hapus event ini?")) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/calendar/${selectedEvent.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setIsModalOpen(false);
        fetchEvents(date);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="gcal-layout">
        <aside className="gcal-sidebar custom-scrollbar">
          <button
            className="gcal-add-btn"
            onClick={() =>
              handleSelectSlot({ start: new Date(), end: new Date() })
            }
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            Tambah Event
          </button>

          <div className="gcal-filters">
            <p className="gcal-filters-title">Status</p>

            <label className="gcal-filter-item">
              <input
                type="checkbox"
                checked={filters.pending}
                onChange={() =>
                  setFilters((prev) => ({ ...prev, pending: !prev.pending }))
                }
                className="gcal-filter-checkbox"
              />
              <span className="gcal-filter-dot bg-amber-500" />
              <span className="gcal-filter-label">Pending</span>
            </label>

            <label className="gcal-filter-item">
              <input
                type="checkbox"
                checked={filters.done}
                onChange={() =>
                  setFilters((prev) => ({ ...prev, done: !prev.done }))
                }
                className="gcal-filter-checkbox"
              />
              <span className="gcal-filter-dot bg-[#639922]" />
              <span className="gcal-filter-label">Done</span>
            </label>

            <label className="gcal-filter-item">
              <input
                type="checkbox"
                checked={filters.overdue}
                onChange={() =>
                  setFilters((prev) => ({ ...prev, overdue: !prev.overdue }))
                }
                className="gcal-filter-checkbox"
              />
              <span className="gcal-filter-dot bg-rose-500" />
              <span className="gcal-filter-label">Overdue</span>
            </label>
          </div>

          <div className="sidebar-mini-cal">
            <div className="mini-cal-header">
              <span className="mini-cal-title">
                {format(date, "MMMM yyyy", { locale: id })}
              </span>
            </div>
            <div className="mini-calendar-widget gcal-mini-calendar-widget">
              <Calendar
                culture="id-ID"
                localizer={localizer}
                events={[]}
                date={date}
                view={Views.MONTH}
                views={[Views.MONTH]}
                onNavigate={(nextDate) => setDate(nextDate)}
                selectable
                onSelectSlot={({ start }) => setDate(start)}
                onDrillDown={(nextDate) => setDate(nextDate)}
                components={{ month: { dateHeader: MiniDateHeader } }}
                toolbar={false}
                style={{ height: 230 }}
              />
            </div>
          </div>

          <div className="gcal-filters">
            <p className="gcal-filters-title">Agenda Berikutnya</p>
            <div className="space-y-2">
              {upcomingEvents.length === 0 && (
                <p className="text-xs text-gray-400">
                  Tidak ada agenda terdekat.
                </p>
              )}
              {upcomingEvents.map((event) => (
                <button
                  key={event.id || `${event.title}-${event.start}`}
                  onClick={() => handleSelectEvent(event)}
                  className="w-full text-left rounded-lg border border-gray-100 dark:border-slate-700 px-3 py-2 hover:bg-gray-50 dark:hover:bg-slate-700/40 transition-colors"
                >
                  <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">
                    {event.title}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {format(new Date(event.start), "dd MMM yyyy, HH:mm", {
                      locale: id,
                    })}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </aside>

        <main className="gcal-main">
          <div className="gcal-calendar-wrapper calendar-override">
            <Calendar
              culture="id-ID"
              localizer={localizer}
              events={calendarEvents}
              startAccessor="start"
              endAccessor="end"
              view={view}
              views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
              date={date}
              onView={onView}
              onNavigate={onNavigate}
              selectable
              onSelectSlot={handleSelectSlot}
              onSelectEvent={handleSelectEvent}
              eventPropGetter={eventPropGetter}
              popup
              components={{ toolbar: Toolbar }}
              messages={{
                today: "Hari Ini",
                previous: "Sebelumnya",
                next: "Berikutnya",
                month: "Bulan",
                week: "Minggu",
                day: "Hari",
                agenda: "Agenda",
                date: "Tanggal",
                time: "Waktu",
                event: "Event",
                noEventsInRange: "Tidak ada event pada rentang ini.",
                showMore: (total) => `+${total} lainnya`,
              }}
              dayPropGetter={(currentDate) =>
                isSameDay(currentDate, new Date())
                  ? { className: "cal-today-cell" }
                  : {}
              }
            />
          </div>
        </main>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-xl border border-gray-100 dark:border-slate-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {modalMode === "ADD"
                ? "Tambah Event"
                : modalMode === "EDIT"
                  ? "Edit Event"
                  : "Detail Event"}
            </h3>

            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 block">
                  Judul Event *
                </label>
                <input
                  type="text"
                  required
                  disabled={modalMode === "VIEW"}
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 disabled:opacity-75 outline-none"
                  placeholder="Meeting dengan klien..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 block">
                    Mulai *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    disabled={modalMode === "VIEW"}
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 disabled:opacity-75 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 block">
                    Selesai
                  </label>
                  <input
                    type="datetime-local"
                    disabled={modalMode === "VIEW"}
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 disabled:opacity-75 outline-none"
                  />
                </div>
              </div>

              {modalMode !== "ADD" && (
                <div>
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 block">
                    Status
                  </label>
                  <select
                    disabled={modalMode === "VIEW"}
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as EventStatus,
                      })
                    }
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 disabled:opacity-75 outline-none"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="DONE">Done</option>
                    <option value="OVERDUE">Overdue</option>
                  </select>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 block">
                  Deskripsi
                </label>
                <textarea
                  rows={3}
                  disabled={modalMode === "VIEW"}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 disabled:opacity-75 outline-none custom-scrollbar"
                  placeholder="Catatan tambahan (opsional)..."
                />
              </div>

              <div className="flex gap-3 justify-end mt-2">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 font-semibold text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700 rounded-lg transition-colors text-sm"
                >
                  {modalMode === "VIEW" ? "Tutup" : "Batal"}
                </button>
                {modalMode === "EDIT" && (
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={handleDelete}
                    className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 rounded-lg font-semibold transition-colors text-sm"
                  >
                    Hapus
                  </button>
                )}
                {modalMode !== "VIEW" && (
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 bg-[#EA6C00] text-white hover:bg-[#C25500] rounded-lg font-bold shadow-sm transition-colors text-sm disabled:opacity-70 flex items-center gap-2"
                  >
                    {isLoading && (
                      <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
                    )}
                    Simpan
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
