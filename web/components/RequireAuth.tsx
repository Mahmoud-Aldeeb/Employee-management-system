'use client';

import type { ReactNode } from 'react';
import { useRequireAuth } from '@/hooks/use-auth';
import Loading from './Loading';

export default function RequireAuth({ children }: { children: ReactNode }) {
  const { data: user, isPending } = useRequireAuth();

  if (isPending || !user) return <Loading />;

  return <>{children}</>;
}