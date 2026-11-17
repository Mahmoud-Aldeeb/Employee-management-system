import type { Metadata } from 'next';
import LoginLanding from '@/components/LoginLanding';

export const metadata: Metadata = { title: 'Sign in' };

export default function LoginPage() {
  return <LoginLanding />;
}