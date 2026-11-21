'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2Icon, SendIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { z } from 'zod';
import Field from '@/components/ui/Field';
import Modal from '@/components/ui/Modal';
import { useCreateLeave, useLeaveBalance } from '@/hooks/use-leaves';
import { addDaysToKey, cairoDateKey } from '@/lib/dates';
import { getErrorMessage } from '@/lib/errors';

const LEAVE_TYPES = ['SICK', 'CASUAL', 'ANNUAL'] as const;

function createLeaveSchema(minDate: string) {
  return z
    .object({
      type: z.enum(LEAVE_TYPES),
      startDate: z
        .string()
        .min(1, 'Select a start date')
        .refine((value) => value >= minDate, { error: 'Leave must start tomorrow or later' }),
      endDate: z.string().min(1, 'Select an end date'),
      reason: z.string().trim().min(1, 'Please describe the reason'),
    })
    .refine((value) => !value.startDate || !value.endDate || value.endDate >= value.startDate, {
      error: 'End date cannot be before start date',
      path: ['endDate'],
    });
}

type LeaveValues = z.infer<ReturnType<typeof createLeaveSchema>>;

interface ApplyLeaveModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ApplyLeaveModal({ open, onClose }: ApplyLeaveModalProps) {
  const [minDate] = useState(() => addDaysToKey(cairoDateKey(), 1));
  const schema = useMemo(() => createLeaveSchema(minDate), [minDate]);
  const createLeave = useCreateLeave();
  const { data: balance } = useLeaveBalance(open);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<LeaveValues>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'SICK', startDate: '', endDate: '', reason: '' },
  });
  const type = useWatch({ control, name: 'type' });

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = handleSubmit(async (values) => {
    try {
      await createLeave.mutateAsync(values);
      toast.success('Leave request submitted');
      handleClose();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  });

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Apply for Leave"
      subtitle="Submit your leave request for approval"
      maxWidth="max-w-lg"
    >
      <form onSubmit={onSubmit} noValidate className="space-y-5 text-sm text-slate-700">
        {balance && (
          <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
            {balance.remaining} annual days left in {balance.year} · {balance.casual.remaining} of{' '}
            {balance.casual.limit} casual days left
          </p>
        )}

        <Field label="Leave Type" htmlFor="type" error={errors.type?.message}>
          <select id="type" {...register('type')}>
            <option value="SICK">Sick Leave</option>
            <option value="CASUAL">Casual Leave</option>
            <option value="ANNUAL">Annual Leave</option>
          </select>
        </Field>

        {type === 'CASUAL' && (
          <p className="text-xs text-slate-400">
            Casual leave is limited to 2 working days per request and is deducted from your annual
            balance.
          </p>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="From" htmlFor="startDate" error={errors.startDate?.message}>
            <input id="startDate" type="date" min={minDate} {...register('startDate')} />
          </Field>
          <Field label="To" htmlFor="endDate" error={errors.endDate?.message}>
            <input id="endDate" type="date" min={minDate} {...register('endDate')} />
          </Field>
        </div>

        <Field label="Reason" htmlFor="reason" error={errors.reason?.message}>
          <textarea
            id="reason"
            rows={3}
            placeholder="Briefly describe why you need this leave..."
            className="resize-none"
            {...register('reason')}
          />
        </Field>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={handleClose} className="btn-secondary flex-1">
            Cancel
          </button>
          <button
            type="submit"
            disabled={createLeave.isPending}
            className="btn-primary flex flex-1 items-center justify-center gap-2 disabled:opacity-50"
          >
            {createLeave.isPending ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <SendIcon className="size-4" />
            )}
            {createLeave.isPending ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </form>
    </Modal>
  );
}