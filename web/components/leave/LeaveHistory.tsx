'use client';

import { CheckIcon, Loader2Icon, XIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useUpdateLeaveStatus } from '@/hooks/use-leaves';
import { formatDayRange } from '@/lib/dates';
import { getErrorMessage } from '@/lib/errors';
import type { LeaveApplication, LeaveStatus } from '@/types';

const STATUS_BADGE: Record<LeaveStatus, string> = {
  APPROVED: 'badge-success',
  REJECTED: 'badge-danger',
  PENDING: 'badge-warning',
};

interface LeaveHistoryProps {
  leaves: LeaveApplication[];
  isAdmin: boolean;
}

export default function LeaveHistory({ leaves, isAdmin }: LeaveHistoryProps) {
  const updateStatus = useUpdateLeaveStatus();
  const processingId = updateStatus.isPending ? updateStatus.variables?.id : undefined;

  const handleStatus = async (id: string, status: LeaveStatus) => {
    try {
      await updateStatus.mutateAsync({ id, status });
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="table-modern">
          <thead>
            <tr>
              {isAdmin && <th>Employee</th>}
              <th>Type</th>
              <th>Dates</th>
              <th className="hidden md:table-cell">Reason</th>
              <th>Status</th>
              {isAdmin && <th className="text-center">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {leaves.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 6 : 4} className="py-12 text-center text-slate-400">
                  No records found
                </td>
              </tr>
            ) : (
              leaves.map((leave) => (
                <tr key={leave._id}>
                  {isAdmin && (
                    <td className="whitespace-nowrap text-slate-900">
                      {leave.employee
                        ? `${leave.employee.firstName} ${leave.employee.lastName}`
                        : '—'}
                    </td>
                  )}
                  <td>
                    <span className="badge bg-slate-100 text-slate-600">{leave.type}</span>
                  </td>
                  <td className="text-xs text-slate-500">
                    <span className="whitespace-nowrap">
                      {formatDayRange(leave.startDate, leave.endDate)}
                      {leave.days !== undefined && (
                        <span className="ml-1 text-slate-400">
                          · {leave.days} {leave.days === 1 ? 'day' : 'days'}
                        </span>
                      )}
                    </span>
                    <p className="mt-1 line-clamp-2 md:hidden">{leave.reason}</p>
                  </td>
                  <td className="hidden max-w-xs truncate text-slate-500 md:table-cell" title={leave.reason}>
                    {leave.reason}
                  </td>
                  <td>
                    <span className={`badge ${STATUS_BADGE[leave.status]}`}>{leave.status}</span>
                  </td>
                  {isAdmin && (
                    <td>
                      {leave.status === 'PENDING' && (
                        <div className="flex justify-center gap-2">
                          <button
                            type="button"
                            aria-label="Approve leave"
                            disabled={processingId !== undefined}
                            onClick={() => handleStatus(leave._id, 'APPROVED')}
                            className="flex size-9 items-center justify-center rounded-md bg-emerald-50 text-emerald-600 transition-colors hover:bg-emerald-100 disabled:opacity-50"
                          >
                            {processingId === leave._id ? (
                              <Loader2Icon className="size-4 animate-spin" />
                            ) : (
                              <CheckIcon className="size-4" />
                            )}
                          </button>
                          <button
                            type="button"
                            aria-label="Reject leave"
                            disabled={processingId !== undefined}
                            onClick={() => handleStatus(leave._id, 'REJECTED')}
                            className="flex size-9 items-center justify-center rounded-md bg-rose-50 text-rose-600 transition-colors hover:bg-rose-100 disabled:opacity-50"
                          >
                            <XIcon className="size-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}