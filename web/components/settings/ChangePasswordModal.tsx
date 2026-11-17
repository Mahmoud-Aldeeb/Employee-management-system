'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2Icon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { z } from 'zod';
import Field from '@/components/ui/Field';
import Modal from '@/components/ui/Modal';
import { useChangePassword } from '@/hooks/use-auth';
import { getErrorMessage } from '@/lib/errors';

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Use at least 8 characters'),
});

type PasswordValues = z.infer<typeof passwordSchema>;

interface ChangePasswordModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ChangePasswordModal({ open, onClose }: ChangePasswordModalProps) {
  const changePassword = useChangePassword();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordValues>({ resolver: zodResolver(passwordSchema) });

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = handleSubmit(async (values) => {
    try {
      await changePassword.mutateAsync(values);
      toast.success('Password updated successfully');
      handleClose();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  });

  return (
    <Modal open={open} onClose={handleClose} title="Change Password" maxWidth="max-w-md">
      <form onSubmit={onSubmit} noValidate className="space-y-5 text-sm text-slate-700">
        <Field
          label="Current Password"
          htmlFor="currentPassword"
          error={errors.currentPassword?.message}
        >
          <input
            id="currentPassword"
            type="password"
            autoComplete="current-password"
            {...register('currentPassword')}
          />
        </Field>
        <Field label="New Password" htmlFor="newPassword" error={errors.newPassword?.message}>
          <input
            id="newPassword"
            type="password"
            autoComplete="new-password"
            {...register('newPassword')}
          />
        </Field>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={handleClose} className="btn-secondary flex-1">
            Cancel
          </button>
          <button
            type="submit"
            disabled={changePassword.isPending}
            className="btn-primary flex flex-1 items-center justify-center gap-2 disabled:opacity-50"
          >
            {changePassword.isPending && <Loader2Icon className="size-4 animate-spin" />}
            Update Password
          </button>
        </div>
      </form>
    </Modal>
  );
}