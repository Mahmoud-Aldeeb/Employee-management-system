import { shortName } from '@/lib/format';
import { describeEntry } from '@/lib/team-calendar';
import type { LeaveStatus, TeamCalendarEntry } from '@/types';

const STATUS_STYLES: Record<LeaveStatus, string> = {
  APPROVED: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/10',
  PENDING: 'border border-dashed border-amber-300 bg-amber-50 text-amber-700',
  REJECTED: 'bg-rose-50 text-rose-700 ring-1 ring-rose-600/10',
};

export default function LeaveChip({ entry }: { entry: TeamCalendarEntry }) {
  return (
    <span
      title={describeEntry(entry)}
      className={`block truncate rounded px-1.5 py-0.5 text-[11px] font-medium ${STATUS_STYLES[entry.status]} ${entry.isMine ? 'outline-2 outline-indigo-400' : ''}`}
    >
      {shortName(entry.employeeName)}
    </span>
  );
}