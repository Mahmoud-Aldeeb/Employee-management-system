'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ExternalLinkIcon, Loader2Icon, LocateFixedIcon } from 'lucide-react';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { z } from 'zod';
import Field from '@/components/ui/Field';
import { useCreateWorkplace, useUpdateWorkplace } from '@/hooks/use-workplaces';
import { describeClockError } from '@/lib/clock-problems';
import { getErrorMessage } from '@/lib/errors';
import { requestPosition } from '@/lib/geolocation';
import type { Workplace } from '@/types';

const MIN_RADIUS = 50;
const MAX_RADIUS = 2000;
const DEFAULT_RADIUS = '150';
const COARSE_ACCURACY_M = 50;
const LOCATE_TIMEOUT_MS = 15_000;

const numberInRange = (label: string, min: number, max: number) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .refine((value) => {
      const parsed = Number(value);
      return Number.isFinite(parsed) && parsed >= min && parsed <= max;
    }, `${label} must be between ${min} and ${max}`);

const schema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80, 'Use at most 80 characters'),
  latitude: numberInRange('Latitude', -90, 90),
  longitude: numberInRange('Longitude', -180, 180),
  radiusMeters: numberInRange('Radius', MIN_RADIUS, MAX_RADIUS),
});

type WorkplaceValues = z.infer<typeof schema>;

interface WorkplaceFormProps {
  initialData?: Workplace;
  onSuccess: () => void;
  onCancel: () => void;
}

function toDefaultValues(workplace?: Workplace): WorkplaceValues {
  return {
    name: workplace?.name ?? '',
    latitude: workplace ? String(workplace.latitude) : '',
    longitude: workplace ? String(workplace.longitude) : '',
    radiusMeters: workplace ? String(workplace.radiusMeters) : DEFAULT_RADIUS,
  };
}

export default function WorkplaceForm({ initialData, onSuccess, onCancel }: WorkplaceFormProps) {
  const createWorkplace = useCreateWorkplace();
  const updateWorkplace = useUpdateWorkplace();
  const [locating, setLocating] = useState(false);
  const [accuracy, setAccuracy] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<WorkplaceValues>({
    resolver: zodResolver(schema),
    defaultValues: toDefaultValues(initialData),
  });
  const [latitude, longitude] = useWatch({ control, name: ['latitude', 'longitude'] });
  const hasPosition =
    latitude.trim() !== '' &&
    longitude.trim() !== '' &&
    Number.isFinite(Number(latitude)) &&
    Number.isFinite(Number(longitude));

  const useCurrentLocation = async () => {
    setLocating(true);
    try {
      const found = await requestPosition({ timeout: LOCATE_TIMEOUT_MS });
      setValue('latitude', found.latitude.toFixed(6), { shouldValidate: true });
      setValue('longitude', found.longitude.toFixed(6), { shouldValidate: true });
      setAccuracy(Math.round(found.accuracy));
    } catch (error) {
      const problem = describeClockError(error);
      toast.error(`${problem.title}. ${problem.detail}`);
    } finally {
      setLocating(false);
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    const input = {
      name: values.name,
      latitude: Number(values.latitude),
      longitude: Number(values.longitude),
      radiusMeters: Number(values.radiusMeters),
    };

    try {
      if (initialData) {
        await updateWorkplace.mutateAsync({ id: initialData.id, input });
        toast.success('Location updated');
      } else {
        await createWorkplace.mutateAsync(input);
        toast.success('Location added');
      }
      onSuccess();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5 text-sm text-slate-700">
      <Field label="Name" htmlFor="workplace-name" error={errors.name?.message}>
        <input id="workplace-name" type="text" placeholder="Main Office" {...register('name')} />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Latitude" htmlFor="workplace-latitude" error={errors.latitude?.message}>
          <input
            id="workplace-latitude"
            type="text"
            inputMode="decimal"
            placeholder="30.0444"
            {...register('latitude')}
          />
        </Field>
        <Field label="Longitude" htmlFor="workplace-longitude" error={errors.longitude?.message}>
          <input
            id="workplace-longitude"
            type="text"
            inputMode="decimal"
            placeholder="31.2357"
            {...register('longitude')}
          />
        </Field>
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={useCurrentLocation}
            disabled={locating}
            className="btn-secondary flex items-center gap-2 text-sm disabled:opacity-50"
          >
            {locating ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <LocateFixedIcon className="size-4" />
            )}
            Use my current location
          </button>
          {hasPosition && (
            <a
              href={`https://www.google.com/maps?q=${latitude.trim()},${longitude.trim()}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              Open in Google Maps <ExternalLinkIcon className="size-3.5" />
            </a>
          )}
        </div>
        {accuracy !== null && (
          <p className="text-xs text-slate-500">
            Position captured, accurate to about {accuracy} m.
            {accuracy > COARSE_ACCURACY_M &&
              ' For a better result, do this from a phone while standing at the entrance.'}
          </p>
        )}
      </div>

      <Field label="Radius (meters)" htmlFor="workplace-radius" error={errors.radiusMeters?.message}>
        <input id="workplace-radius" type="text" inputMode="numeric" {...register('radiusMeters')} />
        <p className="mt-1.5 text-xs text-slate-500">
          Between {MIN_RADIUS} and {MAX_RADIUS} m. 150 m suits most offices.
        </p>
      </Field>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary flex flex-1 items-center justify-center gap-2 disabled:opacity-50"
        >
          {isSubmitting && <Loader2Icon className="size-4 animate-spin" />}
          Save location
        </button>
      </div>
    </form>
  );
}