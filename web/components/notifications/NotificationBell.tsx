'use client';

import { BellIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useUnreadCount } from '@/hooks/use-notifications';
import { formatBadgeCount } from '@/lib/notifications';
import NotificationPanel from './NotificationPanel';

type Placement = 'sidebar' | 'header';

const BUTTON_STYLES: Record<Placement, string> = {
  sidebar: 'text-slate-400 hover:bg-white/5 hover:text-white',
  header: 'text-slate-700 hover:bg-slate-100',
};

const PANEL_STYLES: Record<Placement, string> = {
  sidebar: 'left-0',
  header: 'right-0',
};

export default function NotificationBell({ placement }: { placement: Placement }) {
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const { data: unread = 0 } = useUnreadCount();

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (container.current && !container.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const label = unread > 0 ? `Notifications, ${unread} unread` : 'Notifications';

  return (
    <div ref={container} className="relative">
      <button
        type="button"
        aria-label={label}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={`relative flex size-10 items-center justify-center rounded-lg transition-colors ${BUTTON_STYLES[placement]}`}
      >
        <BellIcon className="size-5" />
        {unread > 0 && (
          <span className="absolute right-0.5 top-0.5 flex min-w-4.5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold leading-4.5 text-white">
            {formatBadgeCount(unread)}
          </span>
        )}
      </button>
      {open && (
        <div
          role="dialog"
          aria-label="Notifications panel"
          className={`absolute top-full z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] ${PANEL_STYLES[placement]}`}
        >
          <NotificationPanel onClose={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}