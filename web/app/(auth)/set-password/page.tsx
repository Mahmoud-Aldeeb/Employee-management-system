import type { Metadata } from 'next';
import ResetPasswordForm from '@/components/auth/ResetPasswordForm';

export const metadata: Metadata = { title: 'Set your password' };

export default function SetPasswordPage() {
  return <ResetPasswordForm mode="set" />;
}