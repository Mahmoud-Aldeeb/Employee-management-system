'use client';

import { MapPinIcon, PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import Loading from '@/components/Loading';
import Modal from '@/components/ui/Modal';
import {
  useDeleteWorkplace,
  useUpdateWorkplace,
  useWorkplaces,
} from '@/hooks/use-workplaces';
import { getErrorMessage } from '@/lib/errors';
import type { Workplace } from '@/types';
import WorkplaceForm from './WorkplaceForm';

export default function WorkplacesSection() {
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Workplace | null>(null);
  const { data, isPending, isError, error } = useWorkplaces();
  const updateWorkplace = useUpdateWorkplace();
  const deleteWorkplace = useDeleteWorkplace();

  useEffect(() => {
    if (isError) toast.error(getErrorMessage(error, 'Failed to load work locations'));
  }, [isError, error]);

  const toggle = async (workplace: Workplace) => {
    try {
      await updateWorkplace.mutateAsync({
        id: workplace.id,
        input: { isActive: !workplace.isActive },
      });
    } catch (toggleError) {
      toast.error(getErrorMessage(toggleError));
    }
  };

  const remove = async (workplace: Workplace) => {
    if (!window.confirm(`Delete ${workplace.name}?`)) return;

    try {
      await deleteWorkplace.mutateAsync(workplace.id);
      toast.success('Location deleted');
    } catch (deleteError) {
      toast.error(getErrorMessage(deleteError));
    }
  };

  const renderBody = () => {
    if (isPending) return <Loading fullScreen={false} />;
    if (!data || data.length === 0) {
      return (
        <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center">
          <p className="text-slate-600">No work locations yet</p>
          <p className="mt-1 text-sm text-slate-400">
            Clocking in is open to everyone until you add one.
          </p>
        </div>
      );
    }

    return (
      <ul className="divide-y divide-slate-100">
        {data.map((workplace) => (
          <li key={workplace.id} className="flex flex-wrap items-center gap-3 py-3">
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 font-medium text-slate-900">
                <span className="truncate">{workplace.name}</span>
                {!workplace.isActive && (
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                    Off
                  </span>
                )}
              </p>
              <p className="text-xs text-slate-500">
                {workplace.radiusMeters} m radius · {workplace.latitude.toFixed(5)},{' '}
                {workplace.longitude.toFixed(5)}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={workplace.isActive}
              aria-label={`Active: ${workplace.name}`}
              onClick={() => toggle(workplace)}
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${workplace.isActive ? 'bg-indigo-600' : 'bg-slate-300'
                }`}
            >
              <span
                className={`absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow transition-transform ${workplace.isActive ? 'translate-x-5' : ''
                  }`}
              />
            </button>
            <button
              type="button"
              onClick={() => setEditing(workplace)}
              aria-label={`Edit ${workplace.name}`}
              className="flex size-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition-colors hover:border-indigo-200 hover:text-indigo-600"
            >
              <PencilIcon className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => remove(workplace)}
              aria-label={`Delete ${workplace.name}`}
              className="flex size-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition-colors hover:border-rose-200 hover:text-rose-600"
            >
              <Trash2Icon className="size-4" />
            </button>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <>
      <section aria-labelledby="workplaces-title" className="card mb-6 max-w-3xl p-4 sm:p-6">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2
              id="workplaces-title"
              className="flex items-center gap-2 text-base font-medium text-slate-900"
            >
              <MapPinIcon className="size-5 text-slate-400" /> Work locations
            </h2>
            <p className="mt-1 max-w-xl text-sm text-slate-500">
              Employees can clock in only when they are at one of the active locations. Staff marked
              as able to check in from anywhere are never restricted.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <PlusIcon className="size-4" /> Add location
          </button>
        </div>
        {renderBody()}
      </section>

      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title="Add work location"
        maxWidth="max-w-lg"
      >
        <WorkplaceForm onSuccess={() => setCreating(false)} onCancel={() => setCreating(false)} />
      </Modal>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title="Edit work location"
        maxWidth="max-w-lg"
      >
        {editing && (
          <WorkplaceForm
            initialData={editing}
            onSuccess={() => setEditing(null)}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>
    </>
  );
}