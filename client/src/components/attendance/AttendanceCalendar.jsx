import { useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  getDay,
} from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";

/**
 * AttendanceCalendar displays monthly check-in history in an interactive grid view.
 */
const AttendanceCalendar = ({ history = [] }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOffset = getDay(monthStart);

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Map history by date string (YYYY-MM-DD)
  const historyMap = new Map();
  history.forEach((record) => {
    if (record.date) {
      const dateKey = format(new Date(record.date), "yyyy-MM-dd");
      historyMap.set(dateKey, record);
    }
  });

  return (
    <div className="card p-6 mt-8">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Attendance Calendar
            </h2>
            <p className="text-xs text-slate-400">
              {format(currentMonth, "MMMM yyyy")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-slate-600"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={nextMonth}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-slate-600"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-xs font-semibold text-slate-400 py-2 uppercase tracking-wider"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Days Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Blank cells for month start offset */}
        {Array.from({ length: startDayOffset }).map((_, i) => (
          <div key={`offset-${i}`} className="h-20 bg-slate-50/50 rounded-lg" />
        ))}

        {daysInMonth.map((day) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const record = historyMap.get(dateKey);
          const isToday = isSameDay(day, new Date());

          let bgClass = "bg-slate-50 hover:bg-slate-100/70";
          let badgeText = null;
          let badgeClass = "";

          if (record) {
            if (record.status === "PRESENT") {
              bgClass = "bg-emerald-50/60 border border-emerald-200/80";
              badgeText = "Present";
              badgeClass = "bg-emerald-100 text-emerald-700";
            } else if (record.status === "LATE") {
              bgClass = "bg-amber-50/60 border border-amber-200/80";
              badgeText = "Late";
              badgeClass = "bg-amber-100 text-amber-700";
            } else if (record.status === "ABSENT") {
              bgClass = "bg-rose-50/60 border border-rose-200/80";
              badgeText = "Absent";
              badgeClass = "bg-rose-100 text-rose-700";
            }
          }

          return (
            <div
              key={dateKey}
              className={`h-20 p-2 rounded-lg transition-all flex flex-col justify-between ${bgClass} ${
                isToday ? "ring-2 ring-indigo-500" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-semibold ${
                    isToday ? "text-indigo-600 font-bold" : "text-slate-700"
                  }`}
                >
                  {format(day, "d")}
                </span>
                {isToday && (
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                )}
              </div>

              {record ? (
                <div className="space-y-1">
                  <span
                    className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${badgeClass}`}
                  >
                    {badgeText}
                  </span>
                  {record.workingHours > 0 && (
                    <p className="text-[10px] text-slate-500 font-medium">
                      {record.workingHours}h
                    </p>
                  )}
                </div>
              ) : (
                <span className="text-[10px] text-slate-300">—</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AttendanceCalendar;
