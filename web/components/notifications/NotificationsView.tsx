'use client';

import { CheckCheckIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import Loading from '@/components/Loading';
import Pagination from '@/components/ui/Pagination';
import {
  NOTIFICATIONS_PAGE_SIZE,
  useMarkAllNotificationsRead,
  useNotifications,
} from '@/hooks/use-notifications';
import { useOpenNotification } from '@/hooks/use-open-notification';
import { getErrorMessage } from '@/lib/errors';
import NotificationItem from './NotificationItem';

const TABS = [
  { label: 'All', unreadOnly: false },
  { label: 'Unread', unreadOnly: true },
] as const;

export default function NotificationsView() {
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [pageState, setPageState] = useState({ unreadOnly: false, page: 1 });
  const page = pageState.unreadOnly === unreadOnly ? pageState.page : 1;

  const { data, isPending, isError, error, isPlaceholderData } = useNotifications({
    page,
    limit: NOTIFICATIONS_PAGE_SIZE,
    unreadOnly,
  });
  const markAllRead = useMarkAllNotificationsRead();
  const open = useOpenNotification();

  useEffect(() => {
    if (isError) toast.error(getErrorMessage(error, 'Failed to load notifications'));
  }, [isError, error]);

  const handleMarkAll = () =>
    markAllRead.mutate(undefined, {
      onError: (failure) => toast.error(getErrorMessage(failure)),
    });

  const renderBody = () => {
    if (isPending) return <Loading fullScreen={false} />;
    if (!data) {
      return <p className="py-12 text-center text-slate-500">Failed to load notifications</p>;
    }
    if (data.data.length === 0) {
      return (
        <p className="rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center text-slate-400">
          {unreadOnly ? 'You are all caught up' : 'No notifications yet'}
        </p>
      );
    }
    return (
      <section
        aria-label="Notification list"
        aria-busy={isPlaceholderData}
        className={`card overflow-hidden transition-opacity ${isPlaceholderData ? 'opacity-60' : ''}`}
      >
        <ul className="divide-y divide-slate-100">
          {data.data.map((entry) => (
            <NotificationItem key={entry.id} entry={entry} onSelect={open} />
          ))}
        </ul>
      </section>
    );
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">Requests, decisions, payslips and reminders</p>
        </div>
        <button
          type="button"
          onClick={handleMarkAll}
          disabled={(data?.unreadCount ?? 0) === 0 || markAllRead.isPending}
          className="btn-secondary flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <CheckCheckIcon className="size-4" /> Mark all as read
        </button>
      </div>

      <div className="mb-4 flex gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.label}
            type="button"
            aria-pressed={unreadOnly === tab.unreadOnly}
            onClick={() => setUnreadOnly(tab.unreadOnly)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${unreadOnly === tab.unreadOnly
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {renderBody()}

      {data && (
        <Pagination
          page={page}
          totalPages={data.totalPages}
          total={data.total}
          noun="notification"
          onChange={(next) => setPageState({ unreadOnly, page: next })}
        />
      )}
    </div>
  );
}