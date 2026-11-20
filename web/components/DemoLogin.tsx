'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useDemoLogin, useDemoStatus } from '@/hooks/use-demo';
import { getErrorMessage } from '@/lib/errors';
import type { PortalRole } from '@/types';

export default function DemoLogin() {
  const router = useRouter();
  const { data: enabled } = useDemoStatus();
  const demoLogin = useDemoLogin();

  if (!enabled) return null;

  const start = async (role: PortalRole) => {
    try {
      await demoLogin.mutateAsync(role);
      router.replace('/dashboard');
    } catch (error) {
      toast.error(getErrorMessage(error, 'The demo is unavailable right now'));
    }
  };

  return (
    <section
      aria-labelledby="demo-title"
      className="mt-8 rounded-lg border border-dashed border-indigo-200 bg-indigo-50/50 p-5"
    >
      <h2 id="demo-title" className="text-sm font-semibold text-slate-800">
        Just exploring?
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        Try the live demo with sample data. No sign-up needed.
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => start('admin')}
          disabled={demoLogin.isPending}
          className="btn-primary flex-1 disabled:opacity-50"
        >
          Explore as Admin
        </button>
        <button
          type="button"
          onClick={() => start('employee')}
          disabled={demoLogin.isPending}
          className="btn-secondary flex-1 disabled:opacity-50"
        >
          Explore as Employee
        </button>
      </div>
    </section>
  );
}