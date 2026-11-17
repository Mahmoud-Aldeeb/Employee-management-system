'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2Icon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { z } from 'zod';
import Field from '@/components/ui/Field';
import { useCreateEmployee, useUpdateEmployee } from '@/hooks/use-employees';
import { DEPARTMENTS } from '@/lib/constants';
import { getErrorMessage } from '@/lib/errors';
import type { Employee } from '@/types';

const amount = z.number({ error: 'Enter a valid number' }).min(0, 'Must be 0 or more');

const fields = {
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
  phone: z.string().trim().min(1, 'Phone number is required'),
  joinDate: z.string().min(1, 'Join date is required'),
  bio: z.string(),
  department: z.union([z.literal(''), z.enum(DEPARTMENTS)]),
  position: z.string().trim().min(1, 'Position is required'),
  basicSalary: amount,
  allowances: amount,
  deductions: amount,
  employmentStatus: z.enum(['ACTIVE', 'INACTIVE']),
  email: z.email('Enter a valid email address'),
  role: z.enum(['EMPLOYEE', 'ADMIN']),
};

const createSchema = z.object({
  ...fields,
  password: z.string().min(8, 'Use at least 8 characters'),
});

const editSchema = z.object({
  ...fields,
  password: z
    .string()
    .refine((value) => value === '' || value.length >= 8, 'Use at least 8 characters'),
});

type EmployeeFormValues = z.infer<typeof createSchema>;

interface EmployeeFormProps {
  initialData?: Employee;
  onSuccess: () => void;
  onCancel: () => void;
}

function toDefaultValues(employee?: Employee): EmployeeFormValues {
  return {
    firstName: employee?.firstName ?? '',
    lastName: employee?.lastName ?? '',
    phone: employee?.phone ?? '',
    joinDate: employee?.joinDate ? employee.joinDate.slice(0, 10) : '',
    bio: employee?.bio ?? '',
    department: DEPARTMENTS.find((name) => name === employee?.department) ?? '',
    position: employee?.position ?? '',
    basicSalary: employee?.basicSalary ?? 0,
    allowances: employee?.allowances ?? 0,
    deductions: employee?.deductions ?? 0,
    employmentStatus: employee?.employmentStatus ?? 'ACTIVE',
    email: employee?.email ?? '',
    role: employee?.user?.role ?? 'EMPLOYEE',
    password: '',
  };
}

const sectionTitle = 'mb-5 border-b border-slate-100 pb-4 text-base font-medium text-slate-900 sm:mb-6';
const sectionGrid = 'grid grid-cols-1 gap-4 text-sm text-slate-700 sm:grid-cols-2 sm:gap-5';

export default function EmployeeForm({ initialData, onSuccess, onCancel }: EmployeeFormProps) {
  const isEdit = Boolean(initialData);
  const createEmployee = useCreateEmployee();
  const updateEmployee = useUpdateEmployee();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(isEdit ? editSchema : createSchema),
    defaultValues: toDefaultValues(initialData),
  });

  const onSubmit = handleSubmit(async (values) => {
    const { password, department, employmentStatus, ...rest } = values;
    const common = { ...rest, ...(department ? { department } : {}) };

    try {
      if (initialData) {
        await updateEmployee.mutateAsync({
          id: initialData.id ?? initialData._id,
          input: { ...common, employmentStatus, ...(password ? { password } : {}) },
        });
      } else {
        await createEmployee.mutateAsync({ ...common, password });
      }
      onSuccess();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="animate-fade-in space-y-5 sm:space-y-6">
      <div className="card p-4 sm:p-6">
        <h3 className={sectionTitle}>Personal Information</h3>
        <div className={sectionGrid}>
          <Field label="First Name" htmlFor="firstName" error={errors.firstName?.message}>
            <input id="firstName" type="text" autoComplete="given-name" {...register('firstName')} />
          </Field>
          <Field label="Last Name" htmlFor="lastName" error={errors.lastName?.message}>
            <input id="lastName" type="text" autoComplete="family-name" {...register('lastName')} />
          </Field>
          <Field label="Phone Number" htmlFor="phone" error={errors.phone?.message}>
            <input id="phone" type="tel" autoComplete="tel" {...register('phone')} />
          </Field>
          <Field label="Join Date" htmlFor="joinDate" error={errors.joinDate?.message}>
            <input id="joinDate" type="date" {...register('joinDate')} />
          </Field>
          <Field
            label="Bio (Optional)"
            htmlFor="bio"
            error={errors.bio?.message}
            className="sm:col-span-2"
          >
            <textarea
              id="bio"
              rows={3}
              placeholder="Brief description..."
              className="resize-none"
              {...register('bio')}
            />
          </Field>
        </div>
      </div>

      <div className="card p-4 sm:p-6">
        <h3 className={sectionTitle}>Employment Details</h3>
        <div className={sectionGrid}>
          <Field label="Department" htmlFor="department" error={errors.department?.message}>
            <select id="department" {...register('department')}>
              <option value="">Select Department</option>
              {DEPARTMENTS.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Position" htmlFor="position" error={errors.position?.message}>
            <input id="position" type="text" {...register('position')} />
          </Field>
          <Field label="Basic Salary" htmlFor="basicSalary" error={errors.basicSalary?.message}>
            <input
              id="basicSalary"
              type="number"
              inputMode="decimal"
              step="any"
              {...register('basicSalary', { valueAsNumber: true })}
            />
          </Field>
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
          {isEdit && (
            <Field
              label="State"
              htmlFor="employmentStatus"
              error={errors.employmentStatus?.message}
            >
              <select id="employmentStatus" {...register('employmentStatus')}>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </Field>
          )}
        </div>
      </div>

      <div className="card p-4 sm:p-6">
        <h3 className={sectionTitle}>Account Setup</h3>
        <div className={sectionGrid}>
          <Field
            label="Work Email"
            htmlFor="email"
            error={errors.email?.message}
            className="sm:col-span-2"
          >
            <input id="email" type="email" autoComplete="off" {...register('email')} />
          </Field>
          <Field
            label={isEdit ? 'Change Password' : 'Temporary Password'}
            htmlFor="password"
            error={errors.password?.message}
          >
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder={isEdit ? 'Leave blank to keep current' : undefined}
              {...register('password')}
            />
          </Field>
          <Field label="System Role" htmlFor="role" error={errors.role?.message}>
            <select id="role" {...register('role')}>
              <option value="EMPLOYEE">Employee</option>
              <option value="ADMIN">Admin</option>
            </select>
          </Field>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary flex items-center justify-center disabled:opacity-50"
        >
          {isSubmitting && <Loader2Icon className="mr-2 size-4 animate-spin" />}
          {isEdit ? 'Update Employee' : 'Create Employee'}
        </button>
      </div>
    </form>
  );
}