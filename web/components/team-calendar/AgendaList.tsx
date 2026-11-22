import { dayTitle, entryKind } from '@/lib/team-calendar';
import type { TeamCalendarDay } from '@/types';

export default function AgendaList({ days }: { days: TeamCalendarDay[] }) {
  const busyDays = days.filter((day) => day.entries.length > 0);

  if (busyDays.length === 0) {
    return <p className="py-8 text-center text-slate-400">No leave this month</p>;
  }

  return (
    <ul className="space-y-3">
      {busyDays.map((day) => (
        <li key={day.date} className="rounded-xl border border-slate-200 bg-white p-3">
          <p className={`text-sm font-semibold ${day.isToday ? 'text-indigo-600' : 'text-slate-800'}`}>
            {dayTitle(day.date)}
            {day.isToday ? ' · Today' : ''}
          </p>
          <ul className="mt-2 space-y-1.5">
            {day.entries.map((entry) => (
              <li key={entry.leaveId} className="flex items-center justify-between gap-2 text-sm">
                <span className="truncate text-slate-700">{entry.employeeName}</span>
                <span className="shrink-0 text-xs text-slate-400">{entryKind(entry)}</span>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}