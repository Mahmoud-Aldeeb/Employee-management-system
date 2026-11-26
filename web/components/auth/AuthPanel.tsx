import { ArrowLeftIcon } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import LoginLeftSide from '@/components/LoginLeftSide';

interface AuthPanelProps {
  backHref: string;
  backLabel: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}

export default function AuthPanel({
  backHref,
  backLabel,
  title,
  subtitle,
  children,
}: AuthPanelProps) {
  return (
    <div className="min-h-dvh flex flex-col md:flex-row">
      <LoginLeftSide />
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-white">
        <div className="w-full max-w-md animate-fade-in">
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-700 text-sm mb-10 transition-colors"
          >
            <ArrowLeftIcon size={16} /> {backLabel}
          </Link>
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-medium text-zinc-800">{title}</h1>
            <p className="text-slate-500 text-sm sm:text-base">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}