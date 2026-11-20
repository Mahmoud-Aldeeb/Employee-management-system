import { PalmtreeIcon } from 'lucide-react';
import { LEAVE_TYPE_LABELS } from '@/lib/constants';
import { formatDayRange } from '@/lib/dates';
import type { LeaveType, UpcomingLeave } from '@/types';
import DashboardSection from './DashboardSection';

const LEAVE_TYPES: LeaveType[] = ['SICK', 'CASUAL', 'ANNUAL'];

interface LeaveSummaryProps {
  daysTaken: Record<LeaveType, number>;
  upcoming: UpcomingLeave | null;
}

export default function LeaveSummary({ daysTaken, upcoming }: LeaveSummaryProps) {
  return (
    <DashboardSection id="leave-summary" title="Leave this year" description="Approved days by type">
      <dl className="space-y-3 text-sm">
        {LEAVE_TYPES.map((type) => (
          <div key={type} className="flex items-center justify-between">
            <dt className="text-slate-500">{LEAVE_TYPE_LABELS[type]}</dt>
            <dd className="font-medium text-slate-900">
              {daysTaken[type]} {daysTaken[type] === 1 ? 'day' : 'days'}
            </dd>
          </div>
        ))}
      </dl>
      <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm">
        {upcoming ? (
          <>
            <p className="flex items-center gap-2 font-medium text-slate-800">
              <PalmtreeIcon className="size-4 text-slate-400" /> Next approved leave
            </p>
            <p className="mt-1 text-slate-500">
              {LEAVE_TYPE_LABELS[upcoming.type]} · {formatDayRange(upcoming.startDate, upcoming.endDate)}
            </p>
          </>
        ) : (
          <p className="text-slate-500">No upcoming approved leave</p>
        )}
      </div>
    </DashboardSection>
  );
}