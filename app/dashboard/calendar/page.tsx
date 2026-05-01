import React from "react";
import CalendarView from "@/components/calendar/CalendarView";

export const metadata = {
  title: "Kalender Aktivitas - SIAGMS",
};

export default function CalendarPage({
  searchParams,
}: {
  searchParams?: { date?: string };
}) {
  const initialDate = searchParams?.date;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title dark:text-gray-100">Kalender</h1>
          <p className="card-subtitle text-gray-400 dark:text-gray-400 mt-2">
            Jadwal kegiatan operasional &amp; pengingat sistem
          </p>
        </div>
      </div>

      <CalendarView initialDate={initialDate} />
    </div>
  );
}
