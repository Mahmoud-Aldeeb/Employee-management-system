'use client';

import { MenuIcon, UserIcon } from 'lucide-react';
import ErrorBoundary from '@/components/ErrorBoundary';
import NotificationBell from '@/components/notifications/NotificationBell';

export default function MobileHeader({ onOpenMenu }: { onOpenMenu: () => void }) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-slate-200 bg-white/80 px-4 backdrop-blur lg:hidden">
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="Open menu"
        className="flex size-10 items-center justify-center rounded-lg bg-slate-900 text-white shadow-sm transition-transform active:scale-95"
      >
        <MenuIcon size={20} />
      </button>
      <div className="flex items-center gap-2">
        <UserIcon className="size-5 text-slate-700" />
        <span className="text-sm font-semibold tracking-wide text-slate-800">Employee MS</span>
      </div>
      <div className="ml-auto">
        <ErrorBoundary>
          <NotificationBell placement="header" />
        </ErrorBoundary>
      </div>
    </header>
  );
}