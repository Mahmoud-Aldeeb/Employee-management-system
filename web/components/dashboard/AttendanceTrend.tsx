import { format } from 'date-fns';
import { dayFromKey } from '@/lib/dates';
import type { AttendanceTrendDay } from '@/types';

export default function AttendanceTrend({ days }: { days: AttendanceTrendDay[] }) {
  const max = Math.max(...days.map((day) => day.checkedIn), 1);

  return (
    <div>
      <ul aria-label="Check-ins per day" className="flex items-end justify-between gap-2">
        {days.map((day) => {
          const onTime = day.checkedIn - day.late;

          return (
            <li
              key={day.date}
              title={`${format(dayFromKey(day.date), 'EEE MMM dd')}: ${day.checkedIn} checked in, ${day.late} late`}
              className="flex flex-1 flex-col items-center gap-2"
            >
              <span className="text-xs font-medium text-slate-600">{day.checkedIn}</span>
              <div className="flex h-28 w-full max-w-10 flex-col justify-end overflow-hidden rounded-md bg-slate-100">
                <div className="bg-amber-400" style={{ height: `${(day.late / max) * 100}%` }} />
                <div className="bg-indigo-500" style={{ height: `${(onTime / max) * 100}%` }} />
              </div>
              <span className="text-[11px] text-slate-400">
                {format(dayFromKey(day.date), 'EEE')}
              </span>
            </li>
          );
        })}
      </ul>
      <div className="mt-4 flex gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-indigo-500" /> On time
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-amber-400" /> Late
        </span>
      </div>
    </div>
  );
}