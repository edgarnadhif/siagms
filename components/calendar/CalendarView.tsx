"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Calendar, dateFnsLocalizer, View, Views } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
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

export default function CalendarView() {
  const [events, setEvents] = useState<ICalendarEvent[]>([]);
  const [view, setView] = useState<View>(Views.MONTH);
  const [date, setDate] = useState<Date>(new Date());
  
  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ICalendarEvent | null>(null);
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
  const calendarEvents = events.map((e) => {
    const start = new Date(e.date);
    const end = e.endDate ? new Date(e.endDate) : new Date(start.getTime() + 60 * 60 * 1000); // default 1 hour if no end
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

  const onNavigate = (newDate: Date) => setDate(newDate);
  const onView = (newView: View) => setView(newView);

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
      endDate: event.endDate ? format(new Date(event.endDate), "yyyy-MM-dd'T'HH:mm") : "",
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
    let backgroundColor = "#378ADD"; // MANUAL blue default
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const isEdit = modalMode === "EDIT" && selectedEvent?.id;
      const url = isEdit ? `/api/calendar/${selectedEvent.id}` : "/api/calendar";
      const method = isEdit ? "PATCH" : "POST";
      
      const payload = {
        title: formData.title,
        description: formData.description,
        date: formData.date ? new Date(formData.date).toISOString() : new Date().toISOString(),
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
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
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 p-6 h-[800px] flex flex-col">
      {/* Legend */}
      <div className="flex gap-4 mb-4 text-xs font-semibold">
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#E24B4A]"></span> Sistem (Auto)</div>
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#378ADD]"></span> Manual</div>
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#639922]"></span> Selesai</div>
      </div>

      <div className="flex-1 min-h-0 calendar-override">
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
        />
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-xl border border-gray-100 dark:border-slate-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {modalMode === "ADD" ? "Tambah Event" : modalMode === "EDIT" ? "Edit Event" : "Detail Event"}
            </h3>
            
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 block">Judul Event *</label>
                <input 
                  type="text" 
                  required 
                  disabled={modalMode === "VIEW"}
                  value={formData.title} 
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 disabled:opacity-75 outline-none" 
                  placeholder="Meeting dengan klien..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 block">Mulai *</label>
                  <input 
                    type="datetime-local" 
                    required 
                    disabled={modalMode === "VIEW"}
                    value={formData.date} 
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 disabled:opacity-75 outline-none" 
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 block">Selesai</label>
                  <input 
                    type="datetime-local" 
                    disabled={modalMode === "VIEW"}
                    value={formData.endDate} 
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 disabled:opacity-75 outline-none" 
                  />
                </div>
              </div>

              {modalMode !== "ADD" && (
                <div>
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 block">Status</label>
                  <select 
                    disabled={modalMode === "VIEW"}
                    value={formData.status} 
                    onChange={(e) => setFormData({...formData, status: e.target.value as EventStatus})}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 disabled:opacity-75 outline-none"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="DONE">Done</option>
                    <option value="OVERDUE">Overdue</option>
                  </select>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 block">Deskripsi</label>
                <textarea 
                  rows={3} 
                  disabled={modalMode === "VIEW"}
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 disabled:opacity-75 outline-none custom-scrollbar" 
                  placeholder="Catatan tambahan (opsional)..."
                />
              </div>

              <div className="flex gap-3 justify-end mt-2">
                <button type="button" disabled={isLoading} onClick={() => setIsModalOpen(false)} className="px-4 py-2 font-semibold text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700 rounded-lg transition-colors text-sm">
                  {modalMode === "VIEW" ? "Tutup" : "Batal"}
                </button>
                {modalMode === "EDIT" && (
                  <button type="button" disabled={isLoading} onClick={handleDelete} className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 rounded-lg font-semibold transition-colors text-sm">
                    Hapus
                  </button>
                )}
                {modalMode !== "VIEW" && (
                  <button type="submit" disabled={isLoading} className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-bold shadow-sm transition-colors text-sm disabled:opacity-70 flex items-center gap-2">
                    {isLoading && <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>}
                    Simpan
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
