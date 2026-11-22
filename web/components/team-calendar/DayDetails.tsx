import { dayTitle, entryKind } from '@/lib/team-calendar';
import type { TeamCalendarDay } from '@/types';

export default function DayDetails({ day }: { day: TeamCalendarDay | undefined }) {
  if (!day) return null;

  return (
    <section aria-label={`Out on ${dayTitle(day.date)}`} className="card p-4 sm:p-6">
      <h2 className="text-base font-semibold text-slate-900">
        {dayTitle(day.date)}
        {day.isToday ? ' (today)' : ''}
      </h2>

      {day.entries.length === 0 ? (
        <p className="mt-3 text-slate-400">Nobody is out this day</p>
      ) : (
        <ul className="mt-3 divide-y divide-slate-100">
          {day.entries.map((entry) => (
            <li key={entry.leaveId} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-900">{entry.employeeName}</p>
                <p className="text-xs text-slate-400">{entry.department ?? 'No department'}</p>
              </div>
              <p className="shrink-0 text-sm text-slate-500">{entryKind(entry)}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}