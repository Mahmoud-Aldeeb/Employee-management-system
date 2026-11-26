'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import { Loader2Icon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { z } from 'zod';
import { useResetPassword } from '@/hooks/use-auth';
import { useHashToken } from '@/hooks/use-hash-token';
import { getErrorMessage } from '@/lib/errors';
import AuthPanel from './AuthPanel';
import PasswordField from './PasswordField';

type Mode = 'reset' | 'set';

interface Copy {
  title: string;
  subtitle: string;
  submit: string;
  done: string;
}

const COPY: Record<Mode, Copy> = {
  reset: {
    title: 'Choose a new password',
    subtitle: 'Pick a password you have not used before.',
    submit: 'Update password',
    done: 'Password updated. Sign in with your new password.',
  },
  set: {
    title: 'Welcome! Set your password',
    subtitle: 'Choose the password you will use to sign in.',
    submit: 'Set password',
    done: 'Password set. You can sign in now.',
  },
};

const schema = z.object({
  newPassword: z
    .string()
    .min(8, 'Use at least 8 characters')
    .max(72, 'Use at most 72 characters'),
});

type ResetPasswordValues = z.infer<typeof schema>;

export default function ResetPasswordForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const token = useHashToken();
  const resetPassword = useResetPassword();
  const [linkError, setLinkError] = useState<string | null>(null);
  const copy = COPY[mode];

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async ({ newPassword }) => {
    try {
      const portal = await resetPassword.mutateAsync({
        token: token ?? '',
        newPassword,
      });
      toast.success(copy.done);
      router.replace(`/login/${portal}`);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 400) {
        setLinkError(getErrorMessage(error));
        return;
      }
      toast.error(getErrorMessage(error, 'Could not update the password'));
    }
  });

  if (token === null) return null;

  if (token === '' || linkError) {
    return (
      <AuthPanel
        backHref="/login"
        backLabel="Back to sign in"
        title="This link cannot be used"
        subtitle={linkError ?? 'The link is incomplete. Open it again from your email.'}
      >
        <Link href="/forgot-password" className="btn-primary block text-center">
          Request a new link
        </Link>
      </AuthPanel>
    );
  }

  return (
    <AuthPanel
      backHref="/login"
      backLabel="Back to sign in"
      title={copy.title}
      subtitle={copy.subtitle}
    >
      <form className="space-y-5" onSubmit={onSubmit} noValidate>
        <PasswordField
          id="newPassword"
          label="New password"
          autoComplete="new-password"
          hint="At least 8 characters"
          registration={register('newPassword')}
          error={errors.newPassword?.message}
        />
        <button
          type="submit"
          disabled={resetPassword.isPending}
          className="btn-primary flex w-full items-center justify-center py-3 disabled:opacity-50"
        >
          {resetPassword.isPending && <Loader2Icon className="mr-2 size-4 animate-spin" />}
          {copy.submit}
        </button>
      </form>
    </AuthPanel>
  );
}