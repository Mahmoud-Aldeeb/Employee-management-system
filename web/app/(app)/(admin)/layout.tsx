import type { ReactNode } from 'react';
import AdminOnly from '@/components/AdminOnly';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminOnly>{children}</AdminOnly>;
}