'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2Icon } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { z } from 'zod';
import Field from '@/components/ui/Field';
import Modal from '@/components/ui/Modal';
import { useCreatePayslip } from '@/hooks/use-payslips';
import { getErrorMessage } from '@/lib/errors';
import { formatMoney } from '@/lib/format';
import type { Employee } from '@/types';

const amount = z.number({ error: 'Enter a valid number' }).min(0, 'Must be 0 or more');

const payslipSchema = z.object({
  employeeId: z.string().min(1, 'Select an employee'),
  month: z.number().int().min(1).max(12),
  year: z.number({ error: 'Enter a valid year' }).int().min(2000).max(2100),
  basicSalary: amount,
  allowances: amount,
  deductions: amount,
});

type PayslipValues = z.infer<typeof payslipSchema>;

function getDefaultValues(): PayslipValues {
  const now = new Date();
  return {
    employeeId: '',
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    basicSalary: 0,
    allowances: 0,
    deductions: 0,
  };
}

const MONTHS = Array.from({ length: 12 }, (_, index) => index + 1);

interface GeneratePayslipModalProps {
  open: boolean;
  onClose: () => void;
  employees: Employee[];
}

export default function GeneratePayslipModal({
  open,
  onClose,
  employees,
}: GeneratePayslipModalProps) {
  const createPayslip = useCreatePayslip();

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm<PayslipValues>({
    resolver: zodResolver(payslipSchema),
    defaultValues: getDefaultValues(),
  });

  const [basicSalary, allowances, deductions] = useWatch({
    control,
    name: ['basicSalary', 'allowances', 'deductions'],
  });
  const safe = (value: number) => (Number.isFinite(value) ? value : 0);
  const netSalary = safe(basicSalary) + safe(allowances) - safe(deductions);


  const fillFromEmployee = (employeeId: string) => {
    const employee = employees.find((item) => item._id === employeeId);
    if (!employee) return;

    setValue('basicSalary', employee.basicSalary, { shouldValidate: true });
    setValue('allowances', employee.allowances, { shouldValidate: true });
    setValue('deductions', employee.deductions, { shouldValidate: true });
  };


  const handleClose = () => {
    reset(getDefaultValues());
    onClose();
  };

  const onSubmit = handleSubmit(async (values) => {
    try {
      await createPayslip.mutateAsync(values);
      toast.success('Payslip generated');
      handleClose();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  });

  return (
    <Modal open={open} onClose={handleClose} title="Generate Monthly Payslip" maxWidth="max-w-lg">
      <form onSubmit={onSubmit} noValidate className="space-y-4 text-sm text-slate-700">
        <Field label="Employee" htmlFor="employeeId" error={errors.employeeId?.message}>
          <select
            id="employeeId"
            {...register('employeeId', {
              onChange: (event: { target: { value: string } }) => fillFromEmployee(event.target.value),
            })}
          >
            <option value="">Select employee</option>
            {employees.map((employee) => (
              <option key={employee._id} value={employee._id}>
                {employee.firstName} {employee.lastName} ({employee.position})
              </option>
            ))}
          </select>
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Month" htmlFor="month" error={errors.month?.message}>
            <select id="month" {...register('month', { valueAsNumber: true })}>
              {MONTHS.map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Year" htmlFor="year" error={errors.year?.message}>
            <input
              id="year"
              type="number"
              inputMode="numeric"
              {...register('year', { valueAsNumber: true })}
            />
          </Field>
        </div>

        <Field label="Basic Salary" htmlFor="basicSalary" error={errors.basicSalary?.message}>
          <input
            id="basicSalary"
            type="number"
            inputMode="decimal"
            step="any"
            placeholder="5000"
            {...register('basicSalary', { valueAsNumber: true })}
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Allowances" htmlFor="allowances" error={errors.allowances?.message}>
            <input
              id="allowances"
              type="number"
              inputMode="decimal"
              step="any"
              {...register('allowances', { valueAsNumber: true })}
            />
          </Field>
          <Field label="Deductions" htmlFor="deductions" error={errors.deductions?.message}>
            <input
              id="deductions"
              type="number"
              inputMode="decimal"
              step="any"
              {...register('deductions', { valueAsNumber: true })}
            />
          </Field>
        </div>

        <p className="text-xs text-slate-400">
          Amounts are filled from the employee&apos;s current salary. You can adjust them before generating.
        </p>

        <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
          <span className="text-slate-500">Net salary</span>
          <span className="text-base font-semibold text-slate-900">{formatMoney(netSalary)}</span>
        </div>

        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={handleClose} className="btn-secondary">
            Cancel
          </button>
          <button
            type="submit"
            disabled={createPayslip.isPending}
            className="btn-primary flex items-center justify-center disabled:opacity-50"
          >
            {createPayslip.isPending && <Loader2Icon className="mr-2 size-4 animate-spin" />}
            Generate
          </button>
        </div>
      </form>
    </Modal>
  );
}