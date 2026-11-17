import { Suspense, type ReactNode } from 'react';
import AppShell from '@/components/AppShell';
import Loading from '@/components/Loading';

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<Loading />}>
      <AppShell>{children}</AppShell>
    </Suspense>
  );
}