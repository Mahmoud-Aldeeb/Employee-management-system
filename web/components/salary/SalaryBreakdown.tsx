import { format } from 'date-fns';
import { WalletIcon } from 'lucide-react';
import { formatMoney } from '@/lib/format';
import type { SalarySummary } from '@/types';

interface SalaryBreakdownProps {
  salary: SalarySummary;
  className?: string;
}

export default function SalaryBreakdown({ salary, className = '' }: SalaryBreakdownProps) {
  const rows = [
    { label: 'Basic salary', value: formatMoney(salary.basicSalary) },
    { label: 'Allowances', value: `+ ${formatMoney(salary.allowances)}` },
    { label: 'Deductions', value: `- ${formatMoney(salary.deductions)}` },
  ];

  return (
    <section className={`card p-4 sm:p-6 ${className}`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
          <WalletIcon className="size-5 text-slate-400" /> Current Salary
        </h2>
        {salary.updatedAt && (
          <span className="text-xs text-slate-400">
            Updated {format(new Date(salary.updatedAt), 'MMM dd, yyyy')}
          </span>
        )}
      </div>
      <dl className="space-y-3 text-sm">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between">
            <dt className="text-slate-500">{row.label}</dt>
            <dd className="font-medium text-slate-900">{row.value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
        <span className="text-slate-500">Net salary</span>
        <span className="text-lg font-bold text-slate-900">{formatMoney(salary.netSalary)}</span>
      </div>
    </section>
  );
}