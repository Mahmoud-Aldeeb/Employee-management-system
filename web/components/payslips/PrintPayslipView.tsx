'use client';

import { format } from 'date-fns';
import { useParams } from 'next/navigation';
import Loading from '@/components/Loading';
import { usePayslip } from '@/hooks/use-payslips';
import { formatMoney } from '@/lib/format';

const labelClass = 'mb-1 text-xs uppercase tracking-wider text-slate-400';
const valueClass = 'break-words font-semibold text-slate-900';
const headClass = 'px-4 py-3 text-xs uppercase tracking-wider text-slate-500';

export default function PrintPayslipView() {
  const { id } = useParams<{ id: string }>();
  const { data: payslip, isPending } = usePayslip(id);

  if (isPending) return <Loading />;

  if (!payslip) {
    return <p className="py-12 text-center text-slate-500">Payslip not found</p>;
  }

  const period = new Date(payslip.year, payslip.month - 1);

  return (
    <div className="min-h-dvh bg-white">
      <div className="animate-fade-in mx-auto max-w-2xl p-4 sm:p-8">
        <div className="mb-6 border-b border-slate-200 pb-6 text-center sm:mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">PAYSLIP</h1>
          <p className="mt-1 text-sm text-slate-500">{format(period, 'MMM yyyy')}</p>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:mb-8 sm:grid-cols-2 sm:gap-6">
          <div>
            <p className={labelClass}>Employee Name</p>
            <p className={valueClass}>
              {payslip.employee?.firstName} {payslip.employee?.lastName}
            </p>
          </div>
          <div>
            <p className={labelClass}>Position</p>
            <p className={valueClass}>{payslip.employee?.position}</p>
          </div>
          <div>
            <p className={labelClass}>Email</p>
            <p className={valueClass}>{payslip.employee?.email}</p>
          </div>
          <div>
            <p className={labelClass}>Period</p>
            <p className={valueClass}>{format(period, 'MMMM yyyy')}</p>
          </div>
        </div>

        <div className="mb-8 overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50">
                <th className={`${headClass} text-left`}>Description</th>
                <th className={`${headClass} text-right`}>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-slate-100">
                <td className="px-4 py-3 text-slate-700">Basic Salary</td>
                <td className="px-4 py-3 text-right font-medium text-slate-900">
                  {formatMoney(payslip.basicSalary)}
                </td>
              </tr>
              <tr className="border-t border-slate-100">
                <td className="px-4 py-3 text-slate-700">Allowances</td>
                <td className="px-4 py-3 text-right font-medium text-slate-900">
                  + {formatMoney(payslip.allowances)}
                </td>
              </tr>
              <tr className="border-t border-slate-100">
                <td className="px-4 py-3 text-slate-700">Deductions</td>
                <td className="px-4 py-3 text-right font-medium text-slate-900">
                  - {formatMoney(payslip.deductions)}
                </td>
              </tr>
              <tr className="border-t-2 border-slate-200 bg-slate-50">
                <td className="px-4 py-4 font-bold text-slate-900">Net Salary</td>
                <td className="p-4 text-right text-lg font-bold text-slate-900">
                  {formatMoney(payslip.netSalary)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="text-center">
          <button type="button" className="btn-primary print:hidden" onClick={() => window.print()}>
            Print Payslip
          </button>
        </div>
      </div>
    </div>
  );
}