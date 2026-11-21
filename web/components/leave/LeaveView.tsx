'use client';

import { PlusIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import Loading from '@/components/Loading';
import { useSession } from '@/hooks/use-auth';
import { useLeaveBalance, useLeaves } from '@/hooks/use-leaves';
import { getErrorMessage } from '@/lib/errors';
import ApplyLeaveModal from './ApplyLeaveModal';
import LeaveBalanceCard from './LeaveBalanceCard';
import LeaveHistory from './LeaveHistory';

export default function LeaveView() {
  const [modalOpen, setModalOpen] = useState(false);
  const { data: session } = useSession();
  const { data, isPending, isError, error } = useLeaves();
  const isAdmin = session?.role === 'ADMIN';
  const { data: balance } = useLeaveBalance(session?.role === 'EMPLOYEE');

  useEffect(() => {
    if (isError) toast.error(getErrorMessage(error, 'Failed to load leaves'));
  }, [isError, error]);

  if (isPending) return <Loading fullScreen={false} />;

  if (!data) {
    return <p className="py-12 text-center text-slate-500">Failed to load leaves</p>;
  }

  const isDeleted = data.employee?.isDeleted ?? false;

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

      {balance && <LeaveBalanceCard balance={balance} className="mb-6 max-w-xl sm:mb-8" />}

      <LeaveHistory leaves={data.data} isAdmin={isAdmin} />
      <ApplyLeaveModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}