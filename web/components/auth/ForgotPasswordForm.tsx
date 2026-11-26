'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2Icon } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { z } from 'zod';
import { useForgotPassword } from '@/hooks/use-auth';
import { getErrorMessage } from '@/lib/errors';
import AuthPanel from './AuthPanel';

const schema = z.object({ email: z.email('Enter a valid email address') });

type ForgotPasswordValues = z.infer<typeof schema>;

export default function ForgotPasswordForm() {
  const forgotPassword = useForgotPassword();
  const [sentTo, setSentTo] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async ({ email }) => {
    try {
      await forgotPassword.mutateAsync(email);
      setSentTo(email);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not send the link'));
    }
  });

  if (sentTo) {
    return (
      <AuthPanel
        backHref="/login"
        backLabel="Back to sign in"
        title="Check your email"
        subtitle="If the address belongs to an account, a reset link is on its way."
      >
        <div className="space-y-5 text-sm text-slate-600">
          <p>
            If an account exists for <strong className="text-slate-800">{sentTo}</strong>, we have
            sent a link to choose a new password. It works once and expires in 1 hour.
          </p>
          <p>Nothing in your inbox? Check the spam folder, or try again in a minute.</p>
          <button type="button" className="btn-secondary w-full" onClick={() => setSentTo(null)}>
            Use a different email
          </button>
          <Link href="/login" className="btn-primary block text-center">
            Back to sign in
          </Link>
        </div>
      </AuthPanel>
    );
  }

  return (
    <AuthPanel
      backHref="/login"
      backLabel="Back to sign in"
      title="Forgot your password?"
      subtitle="Enter your work email and we will send you a link to choose a new one."
    >
      <form className="space-y-5" onSubmit={onSubmit} noValidate>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
            Work email
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
        <button
          type="submit"
          disabled={forgotPassword.isPending}
          className="btn-primary flex w-full items-center justify-center py-3 disabled:opacity-50"
        >
          {forgotPassword.isPending && <Loader2Icon className="mr-2 size-4 animate-spin" />}
          Send reset link
        </button>
      </form>
    </AuthPanel>
  );
}