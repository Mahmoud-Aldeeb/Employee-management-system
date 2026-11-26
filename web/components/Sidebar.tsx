'use client';

import {
  CalendarDaysIcon,
  CalendarHeartIcon,
  ChevronRightIcon,
  DollarSignIcon,
  FileSignalIcon,
  LayoutGridIcon,
  LogOutIcon,
  ScrollTextIcon,
  SettingsIcon,
  UserIcon,
  XIcon,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLogout } from '@/hooks/use-auth';
import { useProfile } from '@/hooks/use-profile';
import type { SessionUser } from '@/types';
import ErrorBoundary from '@/components/ErrorBoundary';
import NotificationBell from '@/components/notifications/NotificationBell';

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

function getNavItems(role: SessionUser['role']): NavItem[] {
  return [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutGridIcon },
    ...(role === 'ADMIN'
      ? [
        { name: 'Employees', href: '/employees', icon: UserIcon },
        { name: 'Analytics', href: '/analytics', icon: FileSignalIcon },
        { name: 'Audit Log', href: '/audit-log', icon: ScrollTextIcon },
      ]
      : [{ name: 'Attendance', href: '/attendance', icon: CalendarHeartIcon }]),
    { name: 'Leave', href: '/leave', icon: FileSignalIcon },
    { name: 'Team Calendar', href: '/team-calendar', icon: CalendarDaysIcon },
    { name: 'Payslips', href: '/payslips', icon: DollarSignIcon },
    { name: 'Settings', href: '/settings', icon: SettingsIcon },
  ];
}

interface SidebarProps {
  user: SessionUser;
  mobileOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ user, mobileOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const profile = useProfile();
  const logout = useLogout();

  const userName = profile.data
    ? `${profile.data.firstName} ${profile.data.lastName}`.trim()
    : '';
  const navItems = getNavItems(user.role);

  const handleLogout = async () => {
    await logout.mutateAsync().catch(() => null);
    router.replace('/login');
  };

  const sidebarContent = (
    <>
      <div className="px-5 pt-6 pb-5 border-b border-white/6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UserIcon className="text-white size-7" />
            <div>
              <p className="font-semibold text-[13px] text-white tracking-wide">Employee MS</p>
              <p className="text-[11px] text-slate-500 font-medium">Management System</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <div className="hidden lg:block">
              <ErrorBoundary>
                <NotificationBell placement="sidebar" />
              </ErrorBoundary>
            </div>
            <button
              onClick={onClose}
              aria-label="Close menu"
              className="lg:hidden text-slate-400 hover:text-white p-1"
            >
              <XIcon size={20} />
            </button>
          </div>
        </div>
      </div>

      {userName && (
        <div className="mx-3 mt-4 mb-1 p-3 rounded-lg bg-white/3 border border-white/4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center ring-1 ring-white/10 shrink-0">
              <span className="text-slate-400 text-xs font-semibold">
                {userName.charAt(0).toLocaleUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-slate-200 truncate">{userName}</p>
              <p className="text-[11px] text-slate-500 truncate">
                {user.role === 'ADMIN' ? 'Administrator' : 'Employee'}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="px-5 pt-5 pb-2">
        <p className="font-semibold text-[10px] uppercase tracking-[0.12em] text-slate-500">
          Navigation
        </p>
      </div>

      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-md text-[13px] font-medium transition-all duration-150 relative ${isActive ? 'bg-indigo-500/12 text-indigo-300' : 'text-slate-300 hover:text-white hover:bg-white/4'}`}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.75 h-5 rounded-r-full bg-indigo-500" />
              )}
              <item.icon
                className={`w-4.25 h-4.25 shrink-0 ${isActive ? 'text-indigo-300' : 'text-slate-400 group-hover:text-slate-300'}`}
              />
              <span className="flex-1">{item.name}</span>
              {isActive && <ChevronRightIcon />}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-white/6">
        <button
          onClick={handleLogout}
          disabled={logout.isPending}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-[13px] font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/8 transition-all duration-150 disabled:opacity-50"
        >
          <LogOutIcon className="w-4.25 h-4.25" />
          <span>Log out</span>
        </button>
      </div>
    </>
  );

  return (
    <>

      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}
      <aside className="hidden lg:flex flex-col h-full w-65 bg-linear-to-b from-slate-900 via-slate-900 to-slate-950 text-white shrink-0 border-r border-white/4">
        {sidebarContent}
      </aside>
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-linear-to-b from-slate-900 via-slate-900 to-slate-950 text-white z-50 flex flex-col transform transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}