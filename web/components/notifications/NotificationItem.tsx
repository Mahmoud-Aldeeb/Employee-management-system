import { NOTIFICATION_PRESENTATION } from '@/lib/notifications';
import { formatTimestamp } from '@/lib/timestamps';
import type { NotificationEntry } from '@/types';

interface NotificationItemProps {
  entry: NotificationEntry;
  onSelect: (entry: NotificationEntry) => void;
}

export default function NotificationItem({ entry, onSelect }: NotificationItemProps) {
  const { icon: Icon, tone } = NOTIFICATION_PRESENTATION[entry.type];
  const { date, time } = formatTimestamp(entry.createdAt);
  const unread = entry.readAt === null;

  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(entry)}
        className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 ${unread ? 'bg-indigo-50/40' : ''}`}
      >
        <span className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg ${tone}`}>
          <Icon className="size-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate text-sm font-medium text-slate-900">{entry.title}</span>
            {unread && (
              <>
                <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-indigo-500" />
                <span className="sr-only">Unread</span>
              </>
            )}
          </span>
          <span className="mt-0.5 block text-xs text-slate-600">{entry.message}</span>
          <time dateTime={entry.createdAt} className="mt-1 block text-[11px] text-slate-400">
            {`${date} · ${time}`}
          </time>
        </span>
      </button>
    </li>
  );
}