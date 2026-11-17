'use client';

import { usePathname } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { useRequireAuth } from '@/hooks/use-auth';
import Loading from './Loading';
import MobileHeader from './MobileHeader';
import Sidebar from './Sidebar';

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [openPath, setOpenPath] = useState<string | null>(null);
  const { data: user, isPending } = useRequireAuth();

  if (isPending || !user) return <Loading />;

  const menuOpen = openPath === pathname;

  return (
    <div className="flex h-dvh bg-linear-to-br from-slate-50 via-white to-indigo-50/30">
      <Sidebar user={user} mobileOpen={menuOpen} onClose={() => setOpenPath(null)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileHeader onOpenMenu={() => setOpenPath(pathname)} />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-400 p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}