"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import {
  format,
  parse,
  startOfWeek,
  endOfWeek,
  getDay,
  isSameDay,
  startOfDay,
  addMonths,
  subMonths,
  addDays,
  endOfDay,
} from "date-fns";
import { id } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";

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

const DnDCalendar = withDragAndDrop(Calendar);

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
  isDraggable?: boolean;
  isResizable?: boolean;
}

type CalendarDisplayEvent = ICalendarEvent & {
  start: Date;
  end: Date;
};

type CalendarMoveArgs = {
  event: CalendarDisplayEvent;
  start: Date | string;
  end: Date | string;
};

type CalendarEventComponentProps = {
  event: CalendarDisplayEvent;
  title: string;
};

type DateCellWrapperProps = {
  value: Date;
  children: React.ReactNode;
};

type CalendarToolbarProps = {
  label: string;
  onNavigate: (action: "PREV" | "NEXT" | "TODAY" | "DATE") => void;
  onView: (view: string) => void;
  view: string;
};

const formatRangeLabel = (start: Date, end: Date) =>
  `${format(start, "dd MMMM", { locale: id })} - ${format(end, "dd MMMM", {
    locale: id,
  })}`;

const toTitleCase = (value: string) =>
  value.replace(/\S+/g, (word) => word.charAt(0).toUpperCase() + word.slice(1));

const formatToolbarLabel = (currentDate: Date, currentView: string) => {
  if (currentView === Views.DAY) {
    return format(currentDate, "EEEE dd MMMM", { locale: id });
  }

  if (currentView === Views.WEEK) {
    return formatRangeLabel(
      startOfWeek(currentDate, { locale: id }),
      endOfWeek(currentDate, { locale: id }),
    );
  }

  if (currentView === Views.AGENDA) {
    return formatRangeLabel(
      startOfWeek(currentDate, { locale: id }),
      endOfWeek(currentDate, { locale: id }),
    );
  }

  return format(currentDate, "MMMM yyyy", { locale: id });
};

const calendarFormats = {
  monthHeaderFormat: (currentDate: Date) =>
    format(currentDate, "MMMM yyyy", { locale: id }),
  dayHeaderFormat: (currentDate: Date) =>
    format(currentDate, "EEEE dd MMMM", { locale: id }),
  dayRangeHeaderFormat: ({ start, end }: { start: Date; end: Date }) =>
    formatRangeLabel(start, end),
  agendaHeaderFormat: ({ start, end }: { start: Date; end: Date }) =>
    formatRangeLabel(start, end),
  agendaDateFormat: (currentDate: Date) =>
    format(currentDate, "EEEE dd MMMM", { locale: id }),
  agendaTimeFormat: (currentDate: Date) =>
    format(currentDate, "HH:mm", { locale: id }),
  agendaTimeRangeFormat: ({ start, end }: { start: Date; end: Date }) =>
    `${format(start, "HH:mm", { locale: id })} - ${format(end, "HH:mm", {
      locale: id,
    })}`,
};

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
  const [upcomingEventsState, setUpcomingEventsState] = useState<
    ICalendarEvent[]
  >([]);
  const [view, setView] = useState<string>(Views.MONTH);
  const [date, setDate] = useState<Date>(parseInitialDate(initialDate));
  const [filters, setFilters] = useState({
    pending: true,
    done: true,
    overdue: true,
  });

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] =
    useState<CalendarDisplayEvent | null>(null);
  const [modalMode, setModalMode] = useState<"ADD" | "EDIT" | "VIEW">("ADD");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    endDate: "",
    status: "PENDING" as EventStatus,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [toasts, setToasts] = useState<{ id: number; message: string; type: "success" | "error" }[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: "success" | "error") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 5000);
  }, [removeToast]);

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
    const canMove = e.type !== "AUTO" && !e.isLocked;

    return {
      ...e,
      start,
      end,
      isDraggable: canMove,
      isResizable: canMove,
    };
  });

  const fetchEvents = useCallback(async (currentDate: Date) => {
    try {
      // Fetch events for current month
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();
      const res = await fetch(`/api/calendar?month=${month}&year=${year}`);
      const data = await res.json();
      if (data.success) {
        setEvents(data.data);
      }

      // Fetch upcoming events for next 3 days (cross-month)
      const start = startOfDay(new Date()).toISOString();
      const end = endOfDay(addDays(new Date(), 3)).toISOString();
      const resUpcoming = await fetch(
        `/api/calendar?start=${start}&end=${end}`,
      );
      const dataUpcoming = await resUpcoming.json();
      if (dataUpcoming.success) {
        setUpcomingEventsState(dataUpcoming.data);
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
    setShowDeleteConfirm(false);
    setFormData({
      title: "",
      description: "",
      date: format(start, "yyyy-MM-dd'T'HH:mm"),
      endDate: format(start, "yyyy-MM-dd'T'HH:mm"),
      status: "PENDING",
    });
    setIsModalOpen(true);
  };

  const handleSelectEvent = (event: CalendarDisplayEvent) => {
    setSelectedEvent(event);
    setShowDeleteConfirm(false);
    setFormData({
      title: event.title || "",
      description: event.description || "",
      date: format(new Date(event.date), "yyyy-MM-dd'T'HH:mm"),
      endDate: event.endDate
        ? format(new Date(event.endDate), "yyyy-MM-dd'T'HH:mm")
        : "",
      status: event.status || "PENDING",
    });
    setModalMode("VIEW");
    setIsModalOpen(true);
  };

  const getStatusLabel = (status?: EventStatus) => {
    if (status === "DONE") return "Done";
    if (status === "OVERDUE") return "Overdue";
    return "Pending";
  };

  const getStatusDotClass = (status?: EventStatus) => {
    if (status === "DONE") return "bg-[#639922]";
    if (status === "OVERDUE") return "bg-rose-500";
    return "bg-amber-500";
  };

  const eventPropGetter = (event: ICalendarEvent) => {
    let backgroundColor = "#fffbeb";
    let color = "#d97706";
    let borderColor = "#fde68a";

    if (event.status === "DONE") {
      backgroundColor = "#f0fdf4"; // DONE (light green)
      color = "#16a34a";
      borderColor = "#bbf7d0";
    } else if (event.status === "OVERDUE") {
      backgroundColor = "#fef2f2"; // OVERDUE (light red)
      color = "#dc2626";
      borderColor = "#fecaca";
    } else if (event.type === "AUTO" || event.isLocked) {
      backgroundColor = "#fef2f2"; // AUTO (light red)
      color = "#dc2626";
      borderColor = "#fecaca";
    }

    return {
      style: {
        backgroundColor,
        color,
        border: `1px solid ${borderColor}`,
        borderRadius: "6px",
        display: "block",
        fontSize: "12px",
        fontWeight: "600",
        boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
      },
    };
  };

  // Parse upcoming events state (all for the next 3 days)
  const upcomingEvents = upcomingEventsState.map((e) => ({
    ...e,
    start: new Date(e.date),
    end: e.endDate
      ? new Date(e.endDate)
      : new Date(new Date(e.date).getTime() + 60 * 60 * 1000),
  }));

  const Toolbar = (toolbarProps: CalendarToolbarProps) => {
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
          <h3 className="cal-toolbar-label">
            {formatToolbarLabel(date, currentView) || label}
          </h3>
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
      onClick={() => {
        setDate(dayDate);
        setView(Views.DAY);
      }}
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
        showToast(isEdit ? "Event berhasil diperbarui" : "Event berhasil ditambahkan", "success");
        fetchEvents(date);
      } else {
        const data = await res.json();
        showToast(data.message || "Gagal menyimpan event", "error");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedEvent?.id || selectedEvent.isLocked) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/calendar/${selectedEvent.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setShowDeleteConfirm(false);
        setIsModalOpen(false);
        showToast("Event berhasil dihapus", "error");
        fetchEvents(date);
      } else {
        const data = await res.json();
        showToast(data.message || "Gagal menghapus event", "error");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMoveEvent = async ({ event, start, end }: CalendarMoveArgs) => {
    if (!event.id || event.isLocked) return;

    const nextStart = new Date(start);
    const nextEnd = new Date(end);
    const previousEvents = events;

    setEvents((currentEvents) =>
      currentEvents.map((item) =>
        item.id === event.id
          ? {
              ...item,
              date: nextStart.toISOString(),
              endDate: nextEnd.toISOString(),
            }
          : item,
      ),
    );

    try {
      const res = await fetch(`/api/calendar/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: nextStart.toISOString(),
          endDate: nextEnd.toISOString(),
        }),
      });

      if (res.ok) {
        showToast("Event berhasil dipindahkan", "success");
      } else {
        setEvents(previousEvents);
        showToast("Gagal memindahkan event", "error");
      }
    } catch (error) {
      console.error(error);
      setEvents(previousEvents);
    }
  };

  const moveEventToDate = (eventId: string, targetDate: Date) => {
    const draggedEvent = calendarEvents.find((item) => item.id === eventId);
    if (!draggedEvent || !draggedEvent.isDraggable) return;

    const nextStart = new Date(draggedEvent.start);
    nextStart.setFullYear(
      targetDate.getFullYear(),
      targetDate.getMonth(),
      targetDate.getDate(),
    );

    const duration = draggedEvent.end.getTime() - draggedEvent.start.getTime();
    const nextEnd = new Date(
      nextStart.getTime() + Math.max(duration, 60 * 60 * 1000),
    );

    handleMoveEvent({
      event: draggedEvent,
      start: nextStart,
      end: nextEnd,
    });
  };

  const EventContent = ({ event, title }: CalendarEventComponentProps) => (
    <span
      className="cal-draggable-event-content"
      draggable={event.isDraggable}
      onDragStart={(dragEvent) => {
        if (!event.id || !event.isDraggable) return;
        dragEvent.dataTransfer.effectAllowed = "move";
        dragEvent.dataTransfer.setData("text/calendar-event-id", event.id);
      }}
    >
      {toTitleCase(title)}
    </span>
  );

  const DateCellWrapper = ({ value, children }: DateCellWrapperProps) => {
    if (!React.isValidElement<React.HTMLAttributes<HTMLElement>>(children)) {
      return children;
    }

    return React.cloneElement(children, {
      className: `${children.props.className || ""} cal-native-drop-cell`,
      onDragOver: (dragEvent: React.DragEvent) => {
        if (dragEvent.dataTransfer.types.includes("text/calendar-event-id")) {
          dragEvent.preventDefault();
          dragEvent.dataTransfer.dropEffect = "move";
        }
      },
      onDrop: (dragEvent: React.DragEvent) => {
        const eventId = dragEvent.dataTransfer.getData(
          "text/calendar-event-id",
        );
        if (!eventId) return;
        dragEvent.preventDefault();
        moveEventToDate(eventId, value);
      },
    });
  };

  return (
    <>
      {/* Toast Notifications */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-3 px-6 py-3.5 rounded-full shadow-2xl text-sm font-semibold text-white min-w-[280px] animate-in slide-in-from-right-5 duration-300 ${
              t.type === "success" ? "bg-[#00945E]" : "bg-red-600"
            }`}
          >
            {t.type === "success" ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            )}
            <span className="flex-1">{t.message}</span>
            <button
              onClick={() => removeToast(t.id)}
              className="text-white/70 hover:text-white ml-2 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      <div className="gcal-layout">
        <aside className="gcal-sidebar custom-scrollbar">
          <div className="gcal-add-event-sticky sticky top-0 z-50 bg-white dark:bg-[#1a2332] -mx-4 px-4">
            <button
              className="gcal-add-btn w-full"
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
          </div>

          <div className="sidebar-mini-cal">
            <div className="mini-cal-header flex items-center justify-between">
              <span className="mini-cal-title">
                {format(date, "MMMM yyyy", { locale: id })}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setDate(subMonths(date, 1))}
                  className="p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => setDate(addMonths(date, 1))}
                  className="p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <div className="mini-calendar-widget gcal-mini-calendar-widget">
              <Calendar
                culture="id-ID"
                localizer={localizer}
                events={[]}
                date={date}
                view={Views.MONTH}
                views={[Views.MONTH]}
                onNavigate={(nextDate: Date) => setDate(nextDate)}
                selectable
                onSelectSlot={({ start }: { start: Date; end: Date }) =>
                  setDate(start)
                }
                onDrillDown={(nextDate: Date) => setDate(nextDate)}
                components={{ month: { dateHeader: MiniDateHeader } }}
                toolbar={false}
                style={{ height: 200 }}
              />
            </div>
          </div>

          <div className="gcal-filters">
            <p className="gcal-filters-title">Status</p>

            <label className="gcal-filter-item gcal-filter-pending">
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

            <label className="gcal-filter-item gcal-filter-done">
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

            <label className="gcal-filter-item gcal-filter-overdue">
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

          <div className="gcal-filters border-t border-gray-100 dark:border-slate-700 pt-4 mt-2">
            <p className="gcal-filters-title">Agenda Terdekat</p>
            <div className="space-y-2 mt-2">
              {upcomingEvents.length === 0 && (
                <p className="text-[11px] text-gray-400 italic">
                  Tidak ada agenda mendatang.
                </p>
              )}
              {upcomingEvents.map((event) => (
                <button
                  key={event.id || `${event.title}-${event.start}`}
                  onClick={() => handleSelectEvent(event)}
                  className="w-full text-left rounded-xl border border-gray-100 dark:border-slate-700/50 px-3 py-2.5 hover:bg-orange-50/50 dark:hover:bg-orange-500/10 transition-all group"
                >
                  <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate group-hover:text-[#EA6C00] transition-colors">
                    {event.title}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {format(new Date(event.start), "dd MMM, HH:mm", {
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
            <DnDCalendar
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
              onEventDrop={handleMoveEvent}
              onEventResize={handleMoveEvent}
              draggableAccessor="isDraggable"
              resizableAccessor="isResizable"
              resizable
              eventPropGetter={eventPropGetter}
              formats={calendarFormats}
              popup
              components={{
                toolbar: Toolbar,
                event: EventContent,
                dateCellWrapper: DateCellWrapper,
              }}
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
                noEventsInRange: "Belum ada agenda",
                showMore: (total: number) => `+${total} lainnya`,
              }}
              dayPropGetter={(currentDate: Date) =>
                isSameDay(currentDate, new Date())
                  ? { className: "cal-today-cell" }
                  : {}
              }
            />
          </div>
        </main>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedEvent && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200 text-center border border-gray-100 dark:border-slate-700">
            <div className="flex items-center justify-center w-20 h-20 rounded-full bg-red-50 dark:bg-red-900/20 mx-auto mb-6 shadow-inner">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-10 h-10 text-red-500"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .563c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                />
              </svg>
            </div>

            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Hapus Event?
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-8">
              Event ini akan dihapus secara permanen.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={isLoading}
                className="flex-1 h-12 px-4 rounded-xl bg-red-500 text-sm font-semibold text-white hover:bg-red-600 shadow-sm shadow-red-500/20 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {isLoading ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-white/20 dark:border-slate-700 max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
            {modalMode === "VIEW" && selectedEvent ? (
              <div className="flex flex-col h-full">
                <div className="flex items-start justify-between gap-4 p-5 border-b border-[#F3F4F6] dark:border-slate-700 shrink-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`h-4 w-4 rounded-full shrink-0 ${getStatusDotClass(selectedEvent.status)}`}
                    />
                    <div className="min-w-0">
                      <h3 className="text-[22px] font-semibold leading-tight text-slate-900 dark:text-white wrap-break-word">
                        {selectedEvent.title}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {format(
                          new Date(selectedEvent.start),
                          "EEEE, dd MMMM yyyy",
                          { locale: id },
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {!selectedEvent.isLocked && (
                      <>
                        <button
                          type="button"
                          onClick={() => setModalMode("EDIT")}
                          className="event-detail-icon-btn"
                          aria-label="Edit event"
                        >
                          <svg
                            className="w-5 h-5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L8.582 18.07a4.5 4.5 0 0 1-1.897 1.13L3 20.25l1.05-3.685a4.5 4.5 0 0 1 1.13-1.897L16.862 4.487Z"
                            />
                          </svg>
                        </button>
                        <button
                          type="button"
                          disabled={isLoading}
                          onClick={() => {
                            setIsModalOpen(false);
                            setShowDeleteConfirm(true);
                          }}
                          className="event-detail-icon-btn event-detail-delete-btn"
                          aria-label="Hapus event"
                        >
                          <svg
                            className="w-5 h-5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166M19.228 5.79 18.16 19.673A2.25 2.25 0 0 1 15.916 21.75H8.084A2.25 2.25 0 0 1 5.84 19.673L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .563c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                            />
                          </svg>
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setIsModalOpen(false);
                      }}
                      className="event-detail-icon-btn"
                      aria-label="Tutup"
                    >
                      <svg
                        className="w-5 h-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 18 18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded-xl border border-[#E5E7EB] dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30 p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500">
                        Status
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {getStatusLabel(selectedEvent.status)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-[#E5E7EB] dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30 p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500">
                        Waktu
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {format(new Date(selectedEvent.start), "HH:mm", {
                          locale: id,
                        })}
                        {" - "}
                        {format(new Date(selectedEvent.end), "HH:mm", {
                          locale: id,
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
                    <div className="text-slate-400 dark:text-slate-500 mb-2">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.08em]">
                        Deskripsi
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-300">
                      {selectedEvent.description || "Tidak ada deskripsi."}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleSave}
                className="flex-1 flex flex-col overflow-hidden"
              >
                <div className="flex justify-between items-center p-5 border-b border-[#F3F4F6] dark:border-slate-700 shrink-0">
                  <h2 className="text-[18px] font-semibold text-gray-900 dark:text-white leading-tight">
                    {modalMode === "ADD" ? "Tambah Event" : "Edit Event"}
                  </h2>
                  <button
                    type="button"
                    onClick={() =>
                      modalMode === "EDIT"
                        ? setModalMode("VIEW")
                        : setIsModalOpen(false)
                    }
                    className="p-2 text-gray-400 hover:text-[#EA6C00] dark:hover:text-[#EA6C00] transition-colors rounded-full hover:bg-gray-50 dark:hover:bg-slate-700"
                    aria-label="Tutup"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                  <div>
                    <label className="block text-[14px] font-semibold text-gray-700 dark:text-slate-300 mb-1.5 leading-normal">
                      Judul Event <span className="text-[#EA6C00]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      className="w-full px-4 h-12 border border-[#E5E7EB] dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-[#EA6C00]/10 focus:border-[#EA6C00] outline-none transition-all placeholder-gray-400"
                      placeholder="Meeting dengan klien..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[14px] font-semibold text-gray-700 dark:text-slate-300 mb-1.5 leading-normal">
                        Mulai <span className="text-[#EA6C00]">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        required
                        value={formData.date}
                        onChange={(e) =>
                          setFormData({ ...formData, date: e.target.value })
                        }
                        className="w-full px-4 h-12 border border-[#E5E7EB] dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-[#EA6C00]/10 focus:border-[#EA6C00] outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[14px] font-semibold text-gray-700 dark:text-slate-300 mb-1.5 leading-normal">
                        Selesai
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.endDate}
                        onChange={(e) =>
                          setFormData({ ...formData, endDate: e.target.value })
                        }
                        className="w-full px-4 h-12 border border-[#E5E7EB] dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-[#EA6C00]/10 focus:border-[#EA6C00] outline-none transition-all"
                      />
                    </div>
                  </div>

                  {modalMode !== "ADD" && (
                    <div>
                      <label className="block text-[14px] font-semibold text-gray-700 dark:text-slate-300 mb-1.5 leading-normal">
                        Status
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            status: e.target.value as EventStatus,
                          })
                        }
                        className="w-full px-4 h-12 border border-[#E5E7EB] dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-[#EA6C00]/10 focus:border-[#EA6C00] outline-none transition-all"
                      >
                        <option value="PENDING">Pending</option>
                        <option value="DONE">Done</option>
                        <option value="OVERDUE">Overdue</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-[14px] font-semibold text-gray-700 dark:text-slate-300 mb-1.5 leading-normal">
                      Deskripsi
                    </label>
                    <textarea
                      rows={3}
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 min-h-23 border border-[#E5E7EB] dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-[#EA6C00]/10 focus:border-[#EA6C00] outline-none transition-all placeholder-gray-400 custom-scrollbar"
                      placeholder="Catatan tambahan (opsional)..."
                    />
                  </div>
                </div>

                <div className="shrink-0 border-t border-[#F3F4F6] dark:border-slate-700 bg-white dark:bg-slate-800 p-5 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() =>
                      modalMode === "EDIT"
                        ? setModalMode("VIEW")
                        : setIsModalOpen(false)
                    }
                    className="h-11 rounded-xl border border-[#E5E7EB] dark:border-slate-600 bg-white dark:bg-slate-700 px-5 text-sm font-medium text-gray-700 dark:text-slate-200 transition-colors hover:bg-gray-50 dark:hover:bg-slate-600"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex h-11 items-center gap-2 rounded-xl bg-[#EA6C00] px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#d96200] focus:ring-2 focus:ring-[#EA6C00]/20 disabled:opacity-70"
                  >
                    {isLoading && (
                      <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
                    )}
                    Simpan
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
