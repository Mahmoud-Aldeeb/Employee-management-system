'use client';

import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { useSession } from '@/hooks/use-auth';
import Loading from './Loading';

export default function AdminOnly({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { data: user } = useSession();
  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    if (user && !isAdmin) router.replace('/dashboard');
  }, [user, isAdmin, router]);

  if (!isAdmin) return <Loading fullScreen={false} />;

  return <>{children}</>;
}