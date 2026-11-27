'use client';

import { format } from 'date-fns';
import {
  AlertCircleIcon,
  CheckIcon,
  Loader2Icon,
  LogInIcon,
  LogOutIcon,
  MapPinIcon,
} from 'lucide-react';
import { useClockFlow, type ClockPhase } from '@/hooks/use-clock-flow';
import type { AttendanceRecord } from '@/types';

const BUSY_LABELS: Record<Exclude<ClockPhase, 'idle'>, string> = {
  locating: 'Getting your location…',
  submitting: 'Processing...',
};

export default function CheckInCard({ todayRecord }: { todayRecord?: AttendanceRecord }) {
  const checkedInAt = todayRecord?.checkIn ? new Date(todayRecord.checkIn) : null;
  const { run, phase, problem, locationRequired, workplaces } = useClockFlow(
    checkedInAt !== null,
  );

  if (todayRecord?.checkOut) {
    return (
      <div className="card flex items-center gap-4 p-4 sm:p-6">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <CheckIcon className="size-5" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Work Day Completed</h3>
          <p className="text-sm text-slate-500">Great job! See you tomorrow.</p>
        </div>
      </div>
    );
  }

  const busy = phase !== 'idle';
  const placeNames = workplaces.map((workplace) => workplace.name).join(', ');
  const hint = !locationRequired
    ? null
    : checkedInAt
      ? 'Your location is also recorded when you clock out.'
      : `Clock in from ${placeNames}. Your browser will ask to share your location.`;

  return (
    <div className="card p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-500">
            {checkedInAt ? 'You are checked in' : "You haven't checked in today"}
          </p>
          <p className="text-lg font-medium text-slate-900">
            {checkedInAt ? `Since ${format(checkedInAt, 'hh:mm a')}` : 'Start your work day'}
          </p>
          {hint && (
            <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
              <MapPinIcon className="size-3.5 shrink-0" /> {hint}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={run}
          disabled={busy}
          aria-busy={busy}
          className={`flex w-full items-center justify-center gap-3 rounded-xl px-6 py-3.5 text-white shadow-md transition-all active:scale-[0.98] disabled:opacity-50 sm:w-auto ${checkedInAt
              ? 'bg-linear-to-br from-slate-700 to-slate-900'
              : 'bg-linear-to-br from-indigo-600 to-indigo-700'
            }`}
        >
          {busy ? (
            <Loader2Icon className="size-5 animate-spin" />
          ) : checkedInAt ? (
            <LogOutIcon className="size-5" />
          ) : (
            <LogInIcon className="size-5" />
          )}
          <span className="font-medium">
            {phase === 'idle' ? (checkedInAt ? 'Clock Out' : 'Clock In') : BUSY_LABELS[phase]}
          </span>
        </button>
      </div>

      {problem && (
        <div
          role="alert"
          className="mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
        >
          <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />
          <div>
            <p className="font-medium">{problem.title}</p>
            <p className="mt-0.5 text-amber-700">{problem.detail}</p>
          </div>
        </div>
      )}
    </div>
  );
}