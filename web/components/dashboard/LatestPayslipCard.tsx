import { format } from 'date-fns';
import Link from 'next/link';
import { formatMoney } from '@/lib/format';
import type { Payslip } from '@/types';
import DashboardSection from './DashboardSection';

export default function LatestPayslipCard({ payslip }: { payslip: Payslip | null }) {
  return (
    <DashboardSection
      id="latest-payslip"
      title="Latest payslip"
      description={
        payslip
          ? format(new Date(payslip.year, payslip.month - 1), 'MMMM yyyy')
          : 'Nothing issued yet'
      }
    >
      {payslip ? (
        <>
          <p className="text-3xl font-bold tracking-tight text-slate-900">
            {formatMoney(payslip.netSalary)}
          </p>
          <p className="mt-1 text-sm text-slate-500">Net salary</p>
        </>
      ) : (
        <p className="text-slate-500">No payslips yet</p>
      )}
      <Link
        href="/payslips"
        className="mt-4 inline-flex text-sm font-medium text-indigo-600 hover:text-indigo-700"
      >
        View all payslips
      </Link>
    </DashboardSection>
  );
}