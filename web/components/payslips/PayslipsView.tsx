'use client';

import { DownloadIcon, PlusIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import Loading from '@/components/Loading';
import { useSession } from '@/hooks/use-auth';
import { useEmployees } from '@/hooks/use-employees';
import { usePayslips } from '@/hooks/use-payslips';
import { getErrorMessage } from '@/lib/errors';
import { exportToCSV, type CsvColumn } from '@/lib/export-csv';
import GeneratePayslipModal from './GeneratePayslipModal';
import PayslipList from './PayslipList';

const EXPORT_COLUMNS: CsvColumn[] = [
  { label: 'Employee First Name', key: 'employee.firstName' },
  { label: 'Employee Last Name', key: 'employee.lastName' },
  { label: 'Month', key: 'month' },
  { label: 'Year', key: 'year' },
  { label: 'Basic Salary', key: 'basicSalary' },
  { label: 'Allowances', key: 'allowances' },
  { label: 'Deductions', key: 'deductions' },
  { label: 'Net Salary', key: 'netSalary' },
];

export default function PayslipsView() {
  const [modalOpen, setModalOpen] = useState(false);
  const { data: session } = useSession();
  const isAdmin = session?.role === 'ADMIN';

  const { data: payslips, isPending, isError, error } = usePayslips();
  const { data: allEmployees } = useEmployees('', { enabled: isAdmin });
  const employees = useMemo(
    () => (allEmployees ?? []).filter((employee) => !employee.isDeleted),
    [allEmployees],
  );

  useEffect(() => {
    if (isError) toast.error(getErrorMessage(error, 'Failed to load payslips'));
  }, [isError, error]);

  if (isPending) return <Loading fullScreen={false} />;

  if (!payslips) {
    return <p className="py-12 text-center text-slate-500">Failed to load payslips</p>;
  }

  const handleExport = () => {
    if (!exportToCSV(payslips, 'payslips_report', EXPORT_COLUMNS)) {
      toast.error('No payslips to export');
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">Payslips</h1>
          <p className="page-subtitle">
            {isAdmin ? 'Generate and manage employee payslips' : 'Your payslip history'}
          </p>
        </div>
        <div className="flex w-full gap-3 sm:w-auto">
          <button
            type="button"
            onClick={handleExport}
            className="btn-secondary flex flex-1 items-center justify-center gap-2 sm:flex-none"
          >
            <DownloadIcon className="size-4" /> Export CSV
          </button>
          {isAdmin && (
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="btn-primary flex flex-1 items-center justify-center gap-2 sm:flex-none"
            >
              <PlusIcon className="size-4" /> Generate Payslip
            </button>
          )}
        </div>
      </div>

      <PayslipList payslips={payslips} isAdmin={isAdmin} />

      {isAdmin && (
        <GeneratePayslipModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          employees={employees}
        />
      )}
    </div>
  );
}