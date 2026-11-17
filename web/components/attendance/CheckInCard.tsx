'use client';

import { format } from 'date-fns';
import { CheckIcon, Loader2Icon, LogInIcon, LogOutIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useClockInOut } from '@/hooks/use-attendance';
import { getErrorMessage } from '@/lib/errors';
import type { AttendanceRecord } from '@/types';

export default function CheckInCard({ todayRecord }: { todayRecord?: AttendanceRecord }) {
  const clock = useClockInOut();

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

  const checkedInAt = todayRecord?.checkIn ? new Date(todayRecord.checkIn) : null;

  const handleClick = async () => {
    try {
      await clock.mutateAsync();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div>
        <p className="text-sm text-slate-500">
          {checkedInAt ? 'You are checked in' : "You haven't checked in today"}
        </p>
        <p className="text-lg font-medium text-slate-900">
          {checkedInAt ? `Since ${format(checkedInAt, 'hh:mm a')}` : 'Start your work day'}
        </p>
      </div>
      <button
        type="button"
        onClick={handleClick}
        disabled={clock.isPending}
        className={`flex w-full items-center justify-center gap-3 rounded-xl px-6 py-3.5 text-white shadow-md transition-all active:scale-[0.98] disabled:opacity-50 sm:w-auto ${checkedInAt
            ? 'bg-linear-to-br from-slate-700 to-slate-900'
            : 'bg-linear-to-br from-indigo-600 to-indigo-700'
          }`}
      >
        {clock.isPending ? (
          <Loader2Icon className="size-5 animate-spin" />
        ) : checkedInAt ? (
          <LogOutIcon className="size-5" />
        ) : (
          <LogInIcon className="size-5" />
        )}
        <span className="font-medium">
          {clock.isPending ? 'Processing...' : checkedInAt ? 'Clock Out' : 'Clock In'}
        </span>
      </button>
    </div>
  );
}