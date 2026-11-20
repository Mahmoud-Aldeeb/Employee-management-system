import { PalmtreeIcon } from 'lucide-react';
import { LEAVE_TYPE_LABELS } from '@/lib/constants';
import { dayFromKey } from '@/lib/dates';
import { format } from 'date-fns';
import type { WhosOutItem } from '@/types';
import DashboardSection from './DashboardSection';

export default function WhosOut({ items }: { items: WhosOutItem[] }) {
  return (
    <DashboardSection
      id="whos-out"
      title="Who's out today"
      description={items.length > 0 ? `${items.length} on approved leave` : undefined}
    >
      {items.length === 0 ? (
        <p className="py-6 text-center text-slate-400">Everyone is in today</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                <PalmtreeIcon className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900">{item.employeeName}</p>
                <p className="text-xs text-slate-500">
                  {LEAVE_TYPE_LABELS[item.type]} · until {format(dayFromKey(item.endDate), 'MMM dd')}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </DashboardSection>
  );
}