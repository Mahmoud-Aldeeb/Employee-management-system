'use client';

import { LockIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import Loading from '@/components/Loading';
import { useProfile } from '@/hooks/use-profile';
import { getErrorMessage } from '@/lib/errors';
import ChangePasswordModal from './ChangePasswordModal';
import ProfileForm from './ProfileForm';

export default function SettingsView() {
  const [passwordOpen, setPasswordOpen] = useState(false);
  const { data: profile, isPending, isError, error } = useProfile();

  useEffect(() => {
    if (isError) toast.error(getErrorMessage(error, 'Failed to load profile'));
  }, [isError, error]);

  if (isPending) return <Loading fullScreen={false} />;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your account and preferences</p>
      </div>

      {profile && <ProfileForm profile={profile} />}

      <div className="card flex max-w-md flex-wrap items-center justify-between gap-4 p-4 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-slate-100 p-2.5">
            <LockIcon className="size-5 text-slate-600" />
          </div>
          <div>
            <p className="font-medium text-slate-900">Password</p>
            <p className="text-sm text-slate-500">Update your account password</p>
          </div>
        </div>
        <button type="button" onClick={() => setPasswordOpen(true)} className="btn-secondary text-sm">
          Change
        </button>
      </div>

      <ChangePasswordModal open={passwordOpen} onClose={() => setPasswordOpen(false)} />
    </div>
  );
}