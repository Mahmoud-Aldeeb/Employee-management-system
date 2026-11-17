import type { Metadata } from 'next';
import { Suspense } from 'react';
import Loading from '@/components/Loading';
import LoginForm from '@/components/LoginForm';

export const metadata: Metadata = { title: 'Employee Portal' };

export default function EmployeeLoginPage() {
  return (
    <Suspense fallback={<Loading />}>
      <LoginForm
        portal="employee"
        title="Employee Portal"
        subtitle="Sign in to access your account"
      />
    </Suspense>
  );
}