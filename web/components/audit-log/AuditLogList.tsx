import { AUDIT_ACTION_LABELS, AUDIT_ACTION_TONES, type AuditTone } from '@/lib/constants';
import { formatAuditChange, formatAuditTimestamp } from '@/lib/audit';
import type { AuditLogEntry } from '@/types';

const TONE_CLASSES: Record<AuditTone, string> = {
  success: 'badge-success',
  warning: 'badge-warning',
  danger: 'badge-danger',
  info: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600/10',
  neutral: 'bg-slate-100 text-slate-700 ring-1 ring-slate-600/10',
};

interface AuditLogListProps {
  entries: AuditLogEntry[];
  dimmed: boolean;
}

export default function AuditLogList({ entries, dimmed }: AuditLogListProps) {
  if (entries.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center text-slate-400">
        No activity found
      </p>
    );
  }

  return (
    <section
      aria-label="Audit entries"
      aria-busy={dimmed}
      className={`card overflow-hidden transition-opacity ${dimmed ? 'opacity-60' : ''}`}
    >
      <ul className="divide-y divide-slate-100">
        {entries.map((entry) => {
          const { date, time } = formatAuditTimestamp(entry.createdAt);

          return (
            <li key={entry.id} className="px-4 py-4 sm:px-6">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`badge ${TONE_CLASSES[AUDIT_ACTION_TONES[entry.action]]}`}>
                      {AUDIT_ACTION_LABELS[entry.action]}
                    </span>
                    {entry.targetLabel && (
                      <span className="text-sm font-medium text-slate-900">{entry.targetLabel}</span>
                    )}
                  </div>
                  {entry.changes.length > 0 && (
                    <div className="space-y-1 text-xs text-slate-600">
                      {entry.changes.map((change) => (
                        <p key={change.field} className="break-words">
                          {formatAuditChange(change)}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
                <div className="shrink-0 space-y-0.5 text-xs text-slate-500 lg:text-right">
                  <p className="break-all">{entry.actorEmail}</p>
                  <time dateTime={entry.createdAt}>{`${date} · ${time}`}</time>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}