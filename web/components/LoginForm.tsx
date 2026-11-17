'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeftIcon, EyeIcon, EyeOffIcon, Loader2Icon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { z } from 'zod';
import { useLogin, useRedirectIfAuthenticated } from '@/hooks/use-auth';
import { getErrorMessage } from '@/lib/errors';
import type { PortalRole } from '@/types';
import LoginLeftSide from './LoginLeftSide';

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
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="min-h-dvh flex flex-col md:flex-row">
      <LoginLeftSide />
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-white">
        <div className="w-full max-w-md animate-fade-in">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-700 text-sm mb-10 transition-colors"
          >
            <ArrowLeftIcon size={16} /> Back to portals
          </Link>
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-medium text-zinc-800">{title}</h1>
            <p className="text-slate-500 text-sm sm:text-base">{subtitle}</p>
          </div>

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
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...register('password')}
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  onClick={() => setShowPassword((visible) => !visible)}
                >
                  {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-rose-600">{errors.password.message}</p>
              )}
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
        </div>
      </div>
    </div>
  );
}