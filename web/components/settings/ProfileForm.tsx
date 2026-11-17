'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2Icon, SaveIcon, UserIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { z } from 'zod';
import Field from '@/components/ui/Field';
import { useUpdateProfile } from '@/hooks/use-profile';
import { getErrorMessage } from '@/lib/errors';
import type { Profile } from '@/types';

const profileSchema = z.object({
  bio: z.string().max(500, 'Bio must be 500 characters or fewer'),
});

type ProfileValues = z.infer<typeof profileSchema>;

const readOnlyInput = 'cursor-not-allowed bg-slate-50 text-slate-400';

export default function ProfileForm({ profile }: { profile: Profile }) {
  const updateProfile = useUpdateProfile();
  const hasEmployeeRecord = Boolean(profile._id);
  const canEdit = hasEmployeeRecord && !profile.isDeleted;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { bio: profile.bio ?? '' },
  });

  const onSubmit = handleSubmit(async ({ bio }) => {
    try {
      await updateProfile.mutateAsync(bio);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="card mb-6 p-4 sm:p-6">
      <h2 className="mb-5 flex items-center gap-2 border-b border-slate-100 pb-4 text-base font-medium text-slate-900 sm:mb-6">
        <UserIcon className="size-5 text-slate-400" /> Public Profile
      </h2>

      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-4 text-sm text-slate-700 sm:grid-cols-2">
          <Field label="Name" htmlFor="name">
            <input
              id="name"
              type="text"
              disabled
              defaultValue={`${profile.firstName} ${profile.lastName}`.trim()}
              className={readOnlyInput}
            />
          </Field>
          <Field label="Email" htmlFor="email">
            <input
              id="email"
              type="email"
              disabled
              defaultValue={profile.email}
              className={readOnlyInput}
            />
          </Field>
          <Field label="Position" htmlFor="position" className="sm:col-span-2">
            <input
              id="position"
              type="text"
              disabled
              defaultValue={profile.position ?? ''}
              className={readOnlyInput}
            />
          </Field>
        </div>

        <Field label="Bio" htmlFor="bio" error={errors.bio?.message}>
          <textarea
            id="bio"
            rows={4}
            disabled={!canEdit}
            placeholder="Write a brief bio..."
            className={`resize-none ${canEdit ? '' : readOnlyInput}`}
            {...register('bio')}
          />
          <p className="mt-1.5 text-xs text-slate-400">This will be displayed on your profile.</p>
        </Field>

        {profile.isDeleted && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-center">
            <p className="font-medium tracking-tight text-rose-600">Account Deactivated</p>
            <p className="mt-0.5 text-sm text-rose-500">You can no longer update your profile.</p>
          </div>
        )}

        {!hasEmployeeRecord && (
          <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-500">
            Administrator accounts do not have an employee profile to edit.
          </p>
        )}

        {canEdit && (
          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={updateProfile.isPending}
              className="btn-primary flex w-full items-center justify-center gap-2 disabled:opacity-50 sm:w-auto"
            >
              {updateProfile.isPending ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <SaveIcon className="size-4" />
              )}
              Save Changes
            </button>
          </div>
        )}
      </div>
    </form>
  );
}