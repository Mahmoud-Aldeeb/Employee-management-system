'use client';

import { useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Loading from '@/components/Loading';
import { useDashboard } from '@/hooks/use-dashboard';
import { getErrorMessage } from '@/lib/errors';
import AdminDashboard from './AdminDashboard';
import EmployeeDashboard from './EmployeeDashboard';

export default function DashboardView() {
  const { data, isPending, isError, error } = useDashboard();

  useEffect(() => {
    if (isError) toast.error(getErrorMessage(error, 'Failed to load dashboard'));
  }, [isError, error]);

  if (isPending) return <Loading fullScreen={false} />;

  if (!data) {
    return <p className="text-center text-slate-500 py-12">Failed to load dashboard</p>;
  }

  return data.role === 'ADMIN' ? (
    <AdminDashboard data={data} />
  ) : (
    <EmployeeDashboard data={data} />
  );
}