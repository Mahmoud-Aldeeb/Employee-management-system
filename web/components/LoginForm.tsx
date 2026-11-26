'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2Icon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { z } from 'zod';
import AuthPanel from '@/components/auth/AuthPanel';
import PasswordField from '@/components/auth/PasswordField';
import { useLogin, useRedirectIfAuthenticated } from '@/hooks/use-auth';
import { getErrorMessage } from '@/lib/errors';
import type { PortalRole } from '@/types';

const loginSchema = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginValues = z.infer<typeof loginSchema>;

interface LoginFormProps {
  portal: PortalRole;
  title: string;
  subtitle: string;
}

export default function LoginForm({ portal, title, subtitle }: LoginFormProps) {
  const router = useRouter();
  const login = useLogin();
  useRedirectIfAuthenticated();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await login.mutateAsync({ ...values, portal });
      router.replace('/dashboard');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Login failed'));
    }
  });

  return (
    <AuthPanel backHref="/login" backLabel="Back to portals" title={title} subtitle={subtitle}>
      <form className="space-y-5" onSubmit={onSubmit} noValidate>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
            Email address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="@example.com"
            {...register('email')}
          />
          {errors.email && (
            <p className="mt-1.5 text-xs text-rose-600">{errors.email.message}</p>
          )}
        </div>
        <div>
          <PasswordField
            id="password"
            label="Password"
            autoComplete="current-password"
            registration={register('password')}
            error={errors.password?.message}
          />
          <div className="mt-2 text-right">
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              Forgot password?
            </Link>
          </div>
        </div>
        <button
          type="submit"
          disabled={login.isPending}
          className="w-full py-3 bg-linear-to-r from-indigo-600 to-indigo-500 text-white rounded-md text-sm font-semibold hover:from-indigo-700 hover:to-indigo-600 disabled:opacity-50 transition-all duration-200 shadow-lg shadow-indigo-500/25 active:scale-[0.98] flex items-center justify-center"
        >
          {login.isPending && <Loader2Icon className="animate-spin h-4 w-4 mr-2" />}
          Sign in
        </button>
      </form>
    </AuthPanel>
  );
}