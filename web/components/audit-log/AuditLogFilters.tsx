'use client';

import Field from '@/components/ui/Field';
import { EMPTY_AUDIT_FILTERS, type AuditFilterValues } from '@/hooks/use-audit-logs';
import { AUDIT_ACTIONS, AUDIT_ACTION_LABELS } from '@/lib/constants';

interface AuditLogFiltersProps {
  values: AuditFilterValues;
  onChange: (values: AuditFilterValues) => void;
}

export default function AuditLogFilters({ values, onChange }: AuditLogFiltersProps) {
  const hasFilters = Object.values(values).some(Boolean);

  const update = <K extends keyof AuditFilterValues>(key: K, value: AuditFilterValues[K]) =>
    onChange({ ...values, [key]: value });

  return (
    <div className="card mb-6 p-4 sm:p-5">
      <div className="grid grid-cols-1 gap-4 text-sm text-slate-700 sm:grid-cols-2 lg:grid-cols-[2fr_1.5fr_1fr_1fr]">
        <Field label="Search" htmlFor="audit-search">
          <input
            id="audit-search"
            type="search"
            autoComplete="off"
            placeholder="Actor or employee..."
            value={values.search}
            onChange={(event) => update('search', event.target.value)}
          />
        </Field>
        <Field label="Event type" htmlFor="audit-action">
          <select
            id="audit-action"
            value={values.action}
            onChange={(event) =>
              update('action', AUDIT_ACTIONS.find((item) => item === event.target.value) ?? '')
            }
          >
            <option value="">All events</option>
            {AUDIT_ACTIONS.map((action) => (
              <option key={action} value={action}>
                {AUDIT_ACTION_LABELS[action]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="From" htmlFor="audit-from">
          <input
            id="audit-from"
            type="date"
            value={values.from}
            max={values.to || undefined}
            onChange={(event) => update('from', event.target.value)}
          />
        </Field>
        <Field label="To" htmlFor="audit-to">
          <input
            id="audit-to"
            type="date"
            value={values.to}
            min={values.from || undefined}
            onChange={(event) => update('to', event.target.value)}
          />
        </Field>
      </div>
      {hasFilters && (
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => onChange(EMPTY_AUDIT_FILTERS)}
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}