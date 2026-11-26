'use client';

import { CheckCheckIcon } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import {
  NOTIFICATION_PANEL_SIZE,
  useMarkAllNotificationsRead,
  useNotifications,
} from '@/hooks/use-notifications';
import { useOpenNotification } from '@/hooks/use-open-notification';
import { getErrorMessage } from '@/lib/errors';
import NotificationItem from './NotificationItem';

interface NotificationPanelProps {
  onClose: () => void;
}

export default function NotificationPanel({ onClose }: NotificationPanelProps) {
  const { data, isPending } = useNotifications({
    page: 1,
    limit: NOTIFICATION_PANEL_SIZE,
    unreadOnly: false,
  });
  const markAllRead = useMarkAllNotificationsRead();
  const open = useOpenNotification(onClose);
  const hasUnread = (data?.unreadCount ?? 0) > 0;

  const handleMarkAll = () =>
    markAllRead.mutate(undefined, {
      onError: (error) => toast.error(getErrorMessage(error)),
    });

  const renderBody = () => {
    if (isPending) {
      return (
        <div
          role="status"
          aria-label="Loading notifications"
          className="mx-auto my-8 size-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"
        />
      );
    }
    if (!data) {
      return <p className="px-4 py-8 text-center text-sm text-slate-500">Could not load notifications</p>;
    }
    if (data.data.length === 0) {
      return <p className="px-4 py-8 text-center text-sm text-slate-500">No notifications yet</p>;
    }
    return (
      <ul className="divide-y divide-slate-100">
        {data.data.map((entry) => (
          <NotificationItem key={entry.id} entry={entry} onSelect={open} />
        ))}
      </ul>
    );
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-900 shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-900">Notifications</h2>
        <button
          type="button"
          onClick={handleMarkAll}
          disabled={!hasUnread || markAllRead.isPending}
          className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 disabled:text-slate-400"
        >
          <CheckCheckIcon className="size-3.5" /> Mark all as read
        </button>
      </div>
      <div className="max-h-[60vh] overflow-y-auto">{renderBody()}</div>
      <div className="border-t border-slate-100 px-4 py-2.5 text-center">
        <Link
          href="/notifications"
          onClick={onClose}
          className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
        >
          View all
        </Link>
      </div>
    </div>
  );
}