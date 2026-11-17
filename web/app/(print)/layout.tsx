import { Suspense, type ReactNode } from 'react';
import Loading from '@/components/Loading';
import RequireAuth from '@/components/RequireAuth';

export default function PrintLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<Loading />}>
      <RequireAuth>{children}</RequireAuth>
    </Suspense>
  );
}