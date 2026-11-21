import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import ApplyLeaveModal from '@/components/leave/ApplyLeaveModal';
import { addDaysToKey, cairoDateKey } from '@/lib/dates';
import { server } from '../msw/server';
import { renderWithClient } from '../utils/render';
import { Toaster } from 'react-hot-toast';

const today = cairoDateKey();
const inThreeDays = addDaysToKey(today, 3);
const inFourDays = addDaysToKey(today, 4);
const inFiveDays = addDaysToKey(today, 5);

const balance = {
  year: 2026,
  tier: 'standard',
  entitlement: 21,
  taken: 3,
  pending: 1,
  remaining: 17,
  casual: { limit: 7, taken: 1, pending: 0, remaining: 6 },
  sickTaken: 0,
  annualAvailableFrom: '2023-08-01T00:00:00.000Z',
  annualAvailable: true,
};

function renderModal() {
  server.use(http.get('/api/leave/balance', () => HttpResponse.json(balance)));
  const onClose = vi.fn();
  renderWithClient(
    <>
      <ApplyLeaveModal open onClose={onClose} />
      <Toaster />
    </>,
  );
  return onClose;
}

function setDate(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

describe('ApplyLeaveModal', () => {
  it('shows the current leave balance', async () => {
    renderModal();

    expect(
      await screen.findByText('17 annual days left in 2026 · 6 of 7 casual days left'),
    ).toBeInTheDocument();
  });

  it('explains the casual leave rules when casual leave is selected', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.selectOptions(screen.getByLabelText('Leave Type'), 'CASUAL');

    expect(
      screen.getByText(/limited to 2 working days per request and is deducted/),
    ).toBeInTheDocument();
  });

  it('rejects a start date that is not in the future', async () => {
    const user = userEvent.setup();
    renderModal();

    setDate('From', '2020-01-10');
    setDate('To', '2020-01-12');
    await user.type(screen.getByLabelText('Reason'), 'Family trip');
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    expect(await screen.findByText('Leave must start tomorrow or later')).toBeInTheDocument();
  });

  it('rejects an end date before the start date', async () => {
    const user = userEvent.setup();
    renderModal();

    setDate('From', inFiveDays);
    setDate('To', inFourDays);
    await user.type(screen.getByLabelText('Reason'), 'Family trip');
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    expect(await screen.findByText('End date cannot be before start date')).toBeInTheDocument();
  });

  it('requires a reason', async () => {
    const user = userEvent.setup();
    renderModal();

    setDate('From', inThreeDays);
    setDate('To', inFourDays);
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    expect(await screen.findByText('Please describe the reason')).toBeInTheDocument();
  });

  it('submits a valid request and closes the dialog', async () => {
    const user = userEvent.setup();
    let body: unknown;
    server.use(
      http.post('/api/leave', async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ success: true }, { status: 201 });
      }),
    );
    const onClose = renderModal();

    await user.selectOptions(screen.getByLabelText('Leave Type'), 'ANNUAL');
    setDate('From', inThreeDays);
    setDate('To', inFourDays);
    await user.type(screen.getByLabelText('Reason'), 'Family trip');
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(body).toEqual({
      type: 'ANNUAL',
      startDate: inThreeDays,
      endDate: inFourDays,
      reason: 'Family trip',
    });
  });

  it('keeps the dialog open and shows the policy message when the API refuses', async () => {
    const user = userEvent.setup();
    server.use(
      http.post('/api/leave', () =>
        HttpResponse.json(
          { error: 'Casual leave is limited to 2 working days per request' },
          { status: 400 },
        ),
      ),
    );
    const onClose = renderModal();

    await user.selectOptions(screen.getByLabelText('Leave Type'), 'CASUAL');
    setDate('From', inThreeDays);
    setDate('To', inFiveDays);
    await user.type(screen.getByLabelText('Reason'), 'Too long');
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => expect(onClose).not.toHaveBeenCalled());
    expect(await screen.findByText(/limited to 2 working days per request$/)).toBeInTheDocument();
  });
});