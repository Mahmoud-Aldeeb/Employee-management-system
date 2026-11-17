'use client';

import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isSameDay,
  startOfMonth,
  subMonths,
} from 'date-fns';
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { useState } from 'react';
import { dayKey } from '@/lib/dates';
import type { AttendanceRecord, AttendanceStatus } from '@/types';

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const STATUS_STYLES: Record<
  AttendanceStatus,
  { cell: string; badge: string; dot: string; label: string }
> = {
  PRESENT: {
    cell: 'border border-emerald-200/80 bg-emerald-50/60',
    badge: 'bg-emerald-100 text-emerald-700',
    dot: 'bg-emerald-500',
    label: 'Present',
  },
  LATE: {
    cell: 'border border-amber-200/80 bg-amber-50/60',
    badge: 'bg-amber-100 text-amber-700',
    dot: 'bg-amber-500',
    label: 'Late',
  },
  ABSENT: {
    cell: 'border border-rose-200/80 bg-rose-50/60',
    badge: 'bg-rose-100 text-rose-700',
    dot: 'bg-rose-500',
    label: 'Absent',
  },
};

export default function AttendanceCalendar({ history }: { history: AttendanceRecord[] }) {
  const [today] = useState(() => new Date());
  const [currentMonth, setCurrentMonth] = useState(today);

  const monthStart = startOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: endOfMonth(currentMonth) });
  const startOffset = getDay(monthStart);
  const records = new Map(history.map((record) => [dayKey(record.date), record]));

  return (
    <div className="card p-4 sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-3 sm:mb-6">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-indigo-50 p-2.5 text-indigo-600">
            <CalendarIcon className="size-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">Attendance Calendar</h2>
            <p className="text-xs text-slate-400">{format(currentMonth, 'MMMM yyyy')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="flex size-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50"
          >
            <ChevronLeftIcon className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="flex size-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50"
          >
            <ChevronRightIcon className="size-4" />
          </button>
        </div>
      </div>

      <div className="mb-2 grid grid-cols-7 gap-1 text-center">
        {WEEK_DAYS.map((day) => (
          <div
            key={day}
            className="py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400 sm:text-xs"
          >
            <span className="sm:hidden">{day[0]}</span>
            <span className="hidden sm:inline">{day}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: startOffset }).map((_, index) => (
          <div key={`offset-${index}`} className="h-14 rounded-lg bg-slate-50/50 sm:h-20" />
        ))}

        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const record = records.get(key);
          const style = record ? STATUS_STYLES[record.status] : undefined;
          const isToday = isSameDay(day, today);

          return (
            <div
              key={key}
              title={style ? style.label : undefined}
              className={`flex h-14 flex-col justify-between rounded-lg p-1.5 transition-all sm:h-20 sm:p-2 ${style?.cell ?? 'bg-slate-50 hover:bg-slate-100/70'
                } ${isToday ? 'ring-2 ring-indigo-500' : ''}`}
            >
              <span
                className={`text-xs font-semibold ${isToday ? 'font-bold text-indigo-600' : 'text-slate-700'
                  }`}
              >
                {format(day, 'd')}
              </span>
              {record && style ? (
                <div>
                  <span
                    className={`hidden rounded px-1.5 py-0.5 text-[10px] font-medium sm:inline-block ${style.badge}`}
                  >
                    {style.label}
                  </span>
                  <span className={`block size-2 rounded-full sm:hidden ${style.dot}`} />
                  {(record.workingHours ?? 0) > 0 && (
                    <p className="mt-1 hidden text-[10px] font-medium text-slate-500 sm:block">
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

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 sm:hidden">
        {Object.values(STATUS_STYLES).map((style) => (
          <span key={style.label} className="flex items-center gap-1.5">
            <span className={`size-2 rounded-full ${style.dot}`} />
            {style.label}
          </span>
        ))}
      </div>
    </div>
  );
}