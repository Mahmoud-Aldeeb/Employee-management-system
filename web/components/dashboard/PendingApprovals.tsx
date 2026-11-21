'use client';

import { CheckIcon, Loader2Icon, XIcon } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { useUpdateLeaveStatus } from '@/hooks/use-leaves';
import { LEAVE_TYPE_LABELS } from '@/lib/constants';
import { formatDayRange } from '@/lib/dates';
import { getErrorMessage } from '@/lib/errors';
import type { LeaveStatus, PendingLeaveItem } from '@/types';
import DashboardSection from './DashboardSection';

interface PendingApprovalsProps {
  items: PendingLeaveItem[];
  total: number;
  className?: string;
}

export default function PendingApprovals({ items, total, className }: PendingApprovalsProps) {
  const updateStatus = useUpdateLeaveStatus();
  const processingId = updateStatus.isPending ? updateStatus.variables?.id : undefined;

  const decide = async (id: string, status: LeaveStatus) => {
    try {
      await updateStatus.mutateAsync({ id, status });
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <DashboardSection
      id="pending-approvals"
      title="Pending approvals"
      description={
        total > items.length
          ? `Showing ${items.length} of ${total} requests`
          : 'Leave requests waiting for your decision'
      }
      className={className}
      action={
        <Link href="/leave" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
          View all
        </Link>
      }
    >
      {items.length === 0 ? (
        <p className="py-8 text-center text-slate-400">You&apos;re all caught up</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-900">{item.employeeName}</p>
                <p className="text-sm text-slate-500">
                  {LEAVE_TYPE_LABELS[item.type]} · {formatDayRange(item.startDate, item.endDate)} · {item.days}{' '}
                  {item.days === 1 ? 'day' : 'days'}
                </p>
                <p className="truncate text-xs text-slate-400" title={item.reason}>
                  {item.reason}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  aria-label={`Approve leave for ${item.employeeName}`}
                  disabled={processingId !== undefined}
                  onClick={() => decide(item.id, 'APPROVED')}
                  className="flex h-10 items-center gap-1.5 rounded-md bg-emerald-50 px-3 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-50"
                >
                  {processingId === item.id ? (
                    <Loader2Icon className="size-4 animate-spin" />
                  ) : (
                    <CheckIcon className="size-4" />
                  )}
                  Approve
                </button>
                <button
                  type="button"
                  aria-label={`Reject leave for ${item.employeeName}`}
                  disabled={processingId !== undefined}
                  onClick={() => decide(item.id, 'REJECTED')}
                  className="flex h-10 items-center gap-1.5 rounded-md bg-rose-50 px-3 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-100 disabled:opacity-50"
                >
                  <XIcon className="size-4" />
                  Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </DashboardSection>
  );
}