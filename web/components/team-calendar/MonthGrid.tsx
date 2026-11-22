'use client';

import { dayFromKey } from '@/lib/dates';
import { dayTitle } from '@/lib/team-calendar';
import type { TeamCalendarDay } from '@/types';
import LeaveChip from './LeaveChip';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MAX_CHIPS = 2;

interface MonthGridProps {
  days: TeamCalendarDay[];
  selectedDate: string | null;
  onSelect: (date: string) => void;
}

function cellLabel(day: TeamCalendarDay) {
  const count = day.entries.length;
  const today = day.isToday ? ' (today)' : '';

  return `${dayTitle(day.date)}${today}: ${count === 0 ? 'nobody out' : `${count} out`}`;
}

export default function MonthGrid({ days, selectedDate, onSelect }: MonthGridProps) {
  const offset = dayFromKey(days[0].date).getDay();

  return (
    <div>
      <div className="mb-2 grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((weekday) => (
          <div
            key={weekday}
            className="py-2 text-xs font-semibold uppercase tracking-wider text-slate-400"
          >
            {weekday}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: offset }).map((_, index) => (
          <div key={`offset-${index}`} />
        ))}

        {days.map((day) => {
          const extra = day.entries.length - MAX_CHIPS;
          const selected = selectedDate === day.date;

          return (
            <button
              key={day.date}
              type="button"
              aria-label={cellLabel(day)}
              aria-pressed={selected}
              onClick={() => onSelect(day.date)}
              className={`flex min-h-24 flex-col gap-1 rounded-lg border p-1.5 text-left transition-colors ${day.isWeekend ? 'bg-slate-50 text-slate-400' : 'bg-white hover:bg-slate-50'
                } ${selected ? 'border-indigo-500 ring-2 ring-indigo-500/30' : 'border-slate-200'}`}
            >
              <span
                className={`flex size-6 items-center justify-center rounded-full text-xs font-medium ${day.isToday ? 'bg-indigo-600 text-white' : ''
                  }`}
              >
                {Number(day.date.slice(8, 10))}
              </span>
              {day.entries.slice(0, MAX_CHIPS).map((entry) => (
                <LeaveChip key={entry.leaveId} entry={entry} />
              ))}
              {extra > 0 && <span className="text-[11px] text-slate-500">+{extra} more</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}