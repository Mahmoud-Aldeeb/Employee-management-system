import type { Metadata } from 'next';
import { Suspense } from 'react';
import Loading from '@/components/Loading';
import LoginForm from '@/components/LoginForm';

export const metadata: Metadata = { title: 'Admin Portal' };

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<Loading />}>
      <LoginForm
        portal="admin"
        title="Admin Portal"
        subtitle="Sign in to manage the organization"
      />
    </Suspense>
  );
}