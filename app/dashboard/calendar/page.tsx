import React from "react";
import CalendarView from "@/components/calendar/CalendarView";
import Link from "next/link";

export const metadata = {
  title: "Kalender Aktivitas - SIAGMS",
};

export default function CalendarPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            Kalender
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Jadwal kegiatan operasional & pengingat sistem
          </p>
        </div>
      </div>

      <CalendarView />
    </div>
  );
}
