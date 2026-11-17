import { format } from 'date-fns';
import { DownloadIcon } from 'lucide-react';
import Link from 'next/link';
import { formatMoney } from '@/lib/format';
import type { Payslip } from '@/types';

interface PayslipListProps {
  payslips: Payslip[];
  isAdmin: boolean;
}

export default function PayslipList({ payslips, isAdmin }: PayslipListProps) {
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="table-modern">
          <thead>
            <tr>
              {isAdmin && <th>Employee</th>}
              <th>Period</th>
              <th className="hidden sm:table-cell">Basic Salary</th>
              <th>Net Salary</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {payslips.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 5 : 4} className="py-12 text-center text-slate-400">
                  No payslips found
                </td>
              </tr>
            ) : (
              payslips.map((payslip) => (
                <tr key={payslip._id}>
                  {isAdmin && (
                    <td className="whitespace-nowrap text-slate-900">
                      {payslip.employee
                        ? `${payslip.employee.firstName} ${payslip.employee.lastName}`
                        : '—'}
                    </td>
                  )}
                  <td className="whitespace-nowrap text-slate-500">
                    {format(new Date(payslip.year, payslip.month - 1), 'MMMM yyyy')}
                  </td>
                  <td className="hidden text-slate-500 sm:table-cell">
                    {formatMoney(payslip.basicSalary)}
                  </td>
                  <td className="font-medium text-slate-800">{formatMoney(payslip.netSalary)}</td>
                  <td className="text-center">
                    <Link
                      href={`/print/payslips/${payslip._id}`}
                      target="_blank"
                      className="inline-flex items-center rounded bg-blue-50 px-3 py-2 text-xs font-medium text-blue-600 ring-1 ring-blue-600/10 transition-colors hover:bg-blue-100"
                    >
                      <DownloadIcon className="mr-1.5 size-3" /> Download
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}