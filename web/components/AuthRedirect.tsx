'use client';

import { useRedirectIfAuthenticated } from '@/hooks/use-auth';

export default function AuthRedirect() {
  useRedirectIfAuthenticated();
  return null;
}