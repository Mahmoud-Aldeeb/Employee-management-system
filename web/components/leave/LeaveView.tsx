'use client';

import {
  PalmtreeIcon,
  PlusIcon,
  ThermometerIcon,
  UmbrellaIcon,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import Loading from '@/components/Loading';
import { useSession } from '@/hooks/use-auth';
import { useLeaves } from '@/hooks/use-leaves';
import { getErrorMessage } from '@/lib/errors';
import type { LeaveType } from '@/types';
import ApplyLeaveModal from './ApplyLeaveModal';
import LeaveHistory from './LeaveHistory';

const TYPE_CARDS: { type: LeaveType; label: string; icon: LucideIcon }[] = [
  { type: 'SICK', label: 'Sick Leave', icon: ThermometerIcon },
  { type: 'CASUAL', label: 'Casual Leave', icon: UmbrellaIcon },
  { type: 'ANNUAL', label: 'Annual Leave', icon: PalmtreeIcon },
];

export default function LeaveView() {
  const [modalOpen, setModalOpen] = useState(false);
  const { data: session } = useSession();
  const { data, isPending, isError, error } = useLeaves();
  const isAdmin = session?.role === 'ADMIN';

  useEffect(() => {
    if (isError) toast.error(getErrorMessage(error, 'Failed to load leaves'));
  }, [isError, error]);

  if (isPending) return <Loading fullScreen={false} />;

  if (!data) {
    return <p className="py-12 text-center text-slate-500">Failed to load leaves</p>;
  }

  const leaves = data.data;
  const isDeleted = data.employee?.isDeleted ?? false;
  const approved = leaves.filter((leave) => leave.status === 'APPROVED');

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">Leave Management</h1>
          <p className="page-subtitle">
            {isAdmin ? 'Manage leave applications' : 'Your leave history and requests'}
          </p>
        </div>
        {!isAdmin && !isDeleted && (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="btn-primary flex w-full items-center justify-center gap-2 sm:w-auto"
          >
            <PlusIcon className="size-4" /> Apply for Leave
          </button>
        )}
      </div>

      {!isAdmin && (
        <div className="mb-6 grid grid-cols-1 gap-3 sm:mb-8 sm:grid-cols-3 sm:gap-5">
          {TYPE_CARDS.map((card) => (
            <div
              key={card.type}
              className="card card-hover group relative flex items-center gap-4 overflow-hidden p-4 sm:p-6"
            >
              <div className="absolute bottom-0 left-0 top-0 w-1 rounded-r-full bg-slate-500/70 group-hover:bg-indigo-500/70" />
              <div className="rounded-lg bg-slate-100 p-3 transition-colors duration-200 group-hover:bg-indigo-50">
                <card.icon className="size-5 text-slate-600 transition-colors duration-200 group-hover:text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">{card.label}</p>
                <p className="text-2xl font-bold tracking-tight text-slate-900">
                  {approved.filter((leave) => leave.type === card.type).length}{' '}
                  <span className="text-sm font-normal text-slate-400">taken</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <LeaveHistory leaves={leaves} isAdmin={isAdmin} />
      <ApplyLeaveModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}