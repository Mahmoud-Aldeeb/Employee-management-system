import { AlertCircleIcon, CalendarRangeIcon, ClockIcon, type LucideIcon } from 'lucide-react';
import type { AttendanceRecord } from '@/types';

interface Stat {
  label: string;
  value: string | number;
  icon: LucideIcon;
}

export default function AttendanceStats({ history }: { history: AttendanceRecord[] }) {
  const present = history.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length;
  const late = history.filter((r) => r.status === 'LATE').length;
  const worked = history.filter((r) => (r.workingHours ?? 0) > 0);
  const average =
    worked.length > 0
      ? (worked.reduce((sum, r) => sum + (r.workingHours ?? 0), 0) / worked.length).toFixed(1)
      : '0';

  const stats: Stat[] = [
    { label: 'Days Present', value: present, icon: CalendarRangeIcon },
    { label: 'Late Arrivals', value: late, icon: AlertCircleIcon },
    { label: 'Avg. Work Hrs', value: `${average} Hrs`, icon: ClockIcon },
  ];

  return (
    <div className="mb-6 grid grid-cols-1 gap-3 sm:mb-8 sm:grid-cols-3 sm:gap-5">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="card card-hover group relative flex items-center gap-4 overflow-hidden p-4 sm:p-6"
        >
          <div className="absolute bottom-0 left-0 top-0 w-1 rounded-r-full bg-slate-500/70 group-hover:bg-indigo-500/70" />
          <div className="rounded-lg bg-slate-100 p-3 transition-colors duration-200 group-hover:bg-indigo-50">
            <stat.icon className="size-5 text-slate-600 transition-colors duration-200 group-hover:text-indigo-600" />
          </div>
          <div>
            <p className="text-sm text-slate-500">{stat.label}</p>
            <p className="text-2xl font-medium tracking-tight text-slate-900">{stat.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}