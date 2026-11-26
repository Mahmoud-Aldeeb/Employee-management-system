'use client';

import { DownloadIcon, PlusIcon, SearchIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import Loading from '@/components/Loading';
import Modal from '@/components/ui/Modal';
import { useDemoStatus } from '@/hooks/use-demo';
import { useDeleteEmployee, useEmployees, useResendInvite } from '@/hooks/use-employees';
import { DEPARTMENTS } from '@/lib/constants';
import { getErrorMessage } from '@/lib/errors';
import { exportToCSV, type CsvColumn } from '@/lib/export-csv';
import type { Employee } from '@/types';
import EmployeeCard from './EmployeeCard';
import EmployeeForm from './EmployeeForm';
import { useDebounce } from '@/hooks/use-debounce';

const EXPORT_COLUMNS: CsvColumn[] = [
  { label: 'First Name', key: 'firstName' },
  { label: 'Last Name', key: 'lastName' },
  { label: 'Email', key: 'email' },
  { label: 'Phone', key: 'phone' },
  { label: 'Position', key: 'position' },
  { label: 'Department', key: 'department' },
  { label: 'Status', key: 'employmentStatus' },
  { label: 'Basic Salary', key: 'basicSalary' },
];

export default function EmployeesView() {
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [editing, setEditing] = useState<Employee | null>(null);
  const [creating, setCreating] = useState(false);

  const debouncedSearch = useDebounce(search, 400);
  const { data: employees, isPending, isError, error } = useEmployees(department);
  const deleteEmployee = useDeleteEmployee();
  const resendInvite = useResendInvite();
  useDemoStatus();

  useEffect(() => {
    if (isError) toast.error(getErrorMessage(error, 'Failed to load employees'));
  }, [isError, error]);

  const filtered = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
    return (employees ?? []).filter((employee) =>
      `${employee.firstName} ${employee.lastName} ${employee.position}`
        .toLowerCase()
        .includes(term),
    );
  }, [employees, debouncedSearch]);

  const handleExport = () => {
    if (!exportToCSV(filtered, 'employees_report', EXPORT_COLUMNS)) {
      toast.error('No employees to export');
    }
  };

  const handleDelete = async (employee: Employee) => {
    if (!window.confirm(`Delete ${employee.firstName} ${employee.lastName}?`)) return;

    try {
      await deleteEmployee.mutateAsync(employee.id ?? employee._id);
      toast.success('Employee deleted');
    } catch (deleteError) {
      toast.error(getErrorMessage(deleteError));
    }
  };

  const handleResendInvite = async (employee: Employee) => {
    try {
      const { invite } = await resendInvite.mutateAsync(employee.id ?? employee._id);
      if (invite === 'QUEUED') {
        toast.success(`Invitation sent to ${employee.email}`);
      } else {
        toast.error('The invitation could not be sent. Try again in a moment.');
      }
    } catch (resendError) {
      toast.error(getErrorMessage(resendError));
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">Employees</h1>
          <p className="page-subtitle">Manage your team members</p>
        </div>
        <div className="flex w-full gap-3 sm:w-auto">
          <button
            type="button"
            onClick={handleExport}
            className="btn-secondary flex flex-1 items-center justify-center gap-2 sm:flex-none"
          >
            <DownloadIcon size={16} /> Export CSV
          </button>
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="btn-primary flex flex-1 items-center justify-center gap-2 sm:flex-none"
          >
            <PlusIcon size={16} /> Add Employee
          </button>
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            aria-label="Search employees"
            placeholder="Search employees..."
            className="pl-10"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <select
          aria-label="Filter by department"
          value={department}
          onChange={(event) => setDepartment(event.target.value)}
          className="sm:w-56"
        >
          <option value="">All Departments</option>
          {DEPARTMENTS.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

      {isPending ? (
        <Loading fullScreen={false} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.length === 0 ? (
            <p className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center text-slate-400">
              No employees found
            </p>
          ) : (
            filtered.map((employee) => (
              <EmployeeCard
                key={employee._id}
                employee={employee}
                onEdit={setEditing}
                onDelete={handleDelete}
                onResendInvite={handleResendInvite}
              />
            ))
          )}
        </div>
      )}

      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title="Add New Employee"
        subtitle="Create a user account and employee profile"
      >
        <EmployeeForm onSuccess={() => setCreating(false)} onCancel={() => setCreating(false)} />
      </Modal>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title="Edit Employee"
        subtitle="Update employee details"
      >
        {editing && (
          <EmployeeForm
            initialData={editing}
            onSuccess={() => setEditing(null)}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>
    </div>
  );
}