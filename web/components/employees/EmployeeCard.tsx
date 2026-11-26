import { MailIcon, PencilIcon, Trash2Icon } from 'lucide-react';
import type { Employee } from '@/types';

interface EmployeeCardProps {
  employee: Employee;
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
  onResendInvite: (employee: Employee) => void;
}

export default function EmployeeCard({
  employee,
  onEdit,
  onDelete,
  onResendInvite,
}: EmployeeCardProps) {
  const fullName = `${employee.firstName} ${employee.lastName}`;
  const initials = `${employee.firstName[0] ?? ''}${employee.lastName[0] ?? ''}`.toUpperCase();
  const invited = Boolean(employee.user?.invitedAt) && !employee.isDeleted;

  return (
    <div className="card card-hover relative overflow-hidden">
      <div className="flex h-32 items-center justify-center bg-linear-to-br from-slate-100 to-slate-50 sm:aspect-4/3 sm:h-auto">
        <div className="flex size-20 items-center justify-center rounded-full bg-linear-to-br from-indigo-100 to-slate-100">
          <span className="text-2xl font-medium text-indigo-400">{initials}</span>
        </div>
      </div>

      <div className="absolute left-3 top-3 flex gap-2">
        <span className="rounded-lg bg-white/90 px-2.5 py-1 text-xs font-semibold text-slate-600 shadow-sm backdrop-blur-sm">
          {employee.department || 'Remote'}
        </span>
        {employee.isDeleted && (
          <span className="rounded bg-red-500/60 px-2.5 py-1 text-xs font-medium text-white">
            DELETED
          </span>
        )}
        {invited && (
          <span className="rounded bg-amber-500/90 px-2.5 py-1 text-xs font-medium text-white">
            INVITED
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 p-4 sm:p-5">
        <div className="min-w-0">
          <h3 className="truncate text-slate-900">{fullName}</h3>
          <p className="truncate text-xs text-slate-500">{employee.position}</p>
        </div>
        {!employee.isDeleted && (
          <div className="flex shrink-0 gap-2">
            {invited && (
              <button
                type="button"
                onClick={() => onResendInvite(employee)}
                aria-label={`Resend invite to ${fullName}`}
                className="flex size-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition-colors hover:border-amber-200 hover:text-amber-600"
              >
                <MailIcon className="size-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => onEdit(employee)}
              aria-label={`Edit ${fullName}`}
              className="flex size-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition-colors hover:border-indigo-200 hover:text-indigo-600"
            >
              <PencilIcon className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(employee)}
              aria-label={`Delete ${fullName}`}
              className="flex size-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition-colors hover:border-rose-200 hover:text-rose-600"
            >
              <Trash2Icon className="size-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}