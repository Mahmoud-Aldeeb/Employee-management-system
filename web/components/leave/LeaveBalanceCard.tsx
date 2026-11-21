import { format } from 'date-fns';
import { PalmtreeIcon } from 'lucide-react';
import DashboardSection from '@/components/dashboard/DashboardSection';
import { LEAVE_TYPE_LABELS } from '@/lib/constants';
import { dayFromKey, formatDayRange } from '@/lib/dates';
import type { LeaveBalance, LeaveTier, UpcomingLeave } from '@/types';

const TIER_LABELS: Record<LeaveTier, string> = {
  'first-year': 'First year',
  standard: 'Standard',
  senior: 'Senior (10+ years)',
};

const days = (count: number) => `${count} ${count === 1 ? 'day' : 'days'}`;

interface LeaveBalanceCardProps {
  balance: LeaveBalance;
  upcoming?: UpcomingLeave | null;
  className?: string;
}

export default function LeaveBalanceCard({ balance, upcoming, className }: LeaveBalanceCardProps) {
  const used = balance.taken + balance.pending;
  const percent =
    balance.entitlement > 0 ? Math.min(100, Math.round((used / balance.entitlement) * 100)) : 0;

  const rows = [
    { label: 'Taken', value: days(balance.taken) },
    { label: 'Pending approval', value: days(balance.pending) },
    { label: 'Casual days left', value: `${balance.casual.remaining} of ${balance.casual.limit}` },
    { label: 'Sick leave taken', value: days(balance.sickTaken) },
  ];

  return (
    <DashboardSection
      id="leave-balance"
      title="Leave balance"
      description={`${balance.year} · ${balance.tier ? TIER_LABELS[balance.tier] : 'Not started'}`}
      className={className}
    >
      <p className="text-3xl font-bold tracking-tight text-slate-900">
        {Math.max(0, balance.remaining)}{' '}
        <span className="text-sm font-normal text-slate-400">of {balance.entitlement} days left</span>
      </p>
      <div
        role="progressbar"
        aria-label="Annual leave used"
        aria-valuenow={used}
        aria-valuemin={0}
        aria-valuemax={balance.entitlement}
        className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100"
      >
        <div className="h-full rounded-full bg-indigo-500" style={{ width: `${percent}%` }} />
      </div>

      <dl className="mt-4 space-y-3 text-sm">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between">
            <dt className="text-slate-500">{row.label}</dt>
            <dd className="font-medium text-slate-900">{row.value}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-3 text-xs text-slate-400">Casual leave is deducted from your annual balance.</p>

      {!balance.annualAvailable && (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
          Annual leave becomes available from{' '}
          {format(dayFromKey(balance.annualAvailableFrom), 'MMM dd, yyyy')}.
        </p>
      )}

      {upcoming !== undefined && (
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
      )}
    </DashboardSection>
  );
}