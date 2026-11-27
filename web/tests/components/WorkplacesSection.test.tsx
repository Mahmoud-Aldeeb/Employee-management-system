import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Toaster } from 'react-hot-toast';
import { afterEach, describe, expect, it, vi } from 'vitest';
import WorkplacesSection from '@/components/settings/workplaces/WorkplacesSection';
import type { Workplace } from '@/types';
import { server } from '../msw/server';
import { renderWithClient } from '../utils/render';
import { removeGeolocation, stubPosition, stubPositionError } from '../utils/geolocation';

afterEach(() => {
  removeGeolocation();
  vi.restoreAllMocks();
});

const office: Workplace = {
  id: 'w1',
  name: 'Main Office',
  latitude: 30.0444,
  longitude: 31.2357,
  radiusMeters: 150,
  isActive: true,
};
const branch: Workplace = {
  id: 'w2',
  name: 'Alex Branch',
  latitude: 31.2001,
  longitude: 29.9187,
  radiusMeters: 300,
  isActive: false,
};

const serveList = (rows: Workplace[]) =>
  http.get('/api/workplaces', () => HttpResponse.json(rows));

function renderSection() {
  return renderWithClient(
    <>
      <WorkplacesSection />
      <Toaster />
    </>,
  );
}

async function openAddDialog(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole('button', { name: 'Add location' }));
  return screen.findByRole('dialog', { name: 'Add work location' });
}

describe('WorkplacesSection', () => {
  it('lists the locations with their radius, position and state', async () => {
    server.use(serveList([office, branch]));
    renderSection();

    expect(await screen.findByText('Main Office')).toBeInTheDocument();
    expect(screen.getByText(/150 m radius · 30\.04440, 31\.23570/)).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Active: Main Office' })).toBeChecked();
    expect(screen.getByRole('switch', { name: 'Active: Alex Branch' })).not.toBeChecked();
    expect(screen.getByText('Off')).toBeInTheDocument();
  });

  it('explains what happens when there is no location', async () => {
    server.use(serveList([]));
    renderSection();

    expect(await screen.findByText('No work locations yet')).toBeInTheDocument();
    expect(screen.getByText('Clocking in is open to everyone until you add one.')).toBeInTheDocument();
  });

  it('adds a location', async () => {
    const user = userEvent.setup();
    let body: unknown;
    server.use(
      serveList([]),
      http.post('/api/workplaces', async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ ...office }, { status: 201 });
      }),
    );
    renderSection();
    const dialog = await openAddDialog(user);

    await user.type(within(dialog).getByLabelText('Name'), 'Main Office');
    await user.type(within(dialog).getByLabelText('Latitude'), '30.0444');
    await user.type(within(dialog).getByLabelText('Longitude'), '31.2357');
    await user.click(within(dialog).getByRole('button', { name: 'Save location' }));

    await waitFor(() =>
      expect(body).toEqual({ name: 'Main Office', latitude: 30.0444, longitude: 31.2357, radiusMeters: 150 }),
    );
    expect(await screen.findByText('Location added')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('validates the fields before sending anything', async () => {
    const user = userEvent.setup();
    server.use(serveList([]));
    renderSection();
    const dialog = await openAddDialog(user);

    await user.click(within(dialog).getByRole('button', { name: 'Save location' }));
    expect(await within(dialog).findByText('Name is required')).toBeInTheDocument();
    expect(within(dialog).getByText('Latitude is required')).toBeInTheDocument();
    expect(within(dialog).getByText('Longitude is required')).toBeInTheDocument();

    await user.type(within(dialog).getByLabelText('Latitude'), '95');
    const radius = within(dialog).getByLabelText('Radius (meters)');
    await user.clear(radius);
    await user.type(radius, '10');
    await user.click(within(dialog).getByRole('button', { name: 'Save location' }));

    expect(await within(dialog).findByText('Latitude must be between -90 and 90')).toBeInTheDocument();
    expect(within(dialog).getByText('Radius must be between 50 and 2000')).toBeInTheDocument();
  });

  it('fills the position from the device and links to the map', async () => {
    const user = userEvent.setup();
    stubPosition({ latitude: 30.0444, longitude: 31.2357, accuracy: 12, timestamp: 1_700_000_000_000 });
    server.use(serveList([]));
    renderSection();
    const dialog = await openAddDialog(user);

    await user.click(within(dialog).getByRole('button', { name: 'Use my current location' }));

    await waitFor(() => expect(within(dialog).getByLabelText('Latitude')).toHaveValue('30.044400'));
    expect(within(dialog).getByLabelText('Longitude')).toHaveValue('31.235700');
    expect(within(dialog).getByText(/accurate to about 12 m/)).toBeInTheDocument();
    expect(within(dialog).queryByText(/from a phone/)).not.toBeInTheDocument();
    expect(within(dialog).getByRole('link', { name: /Open in Google Maps/ })).toHaveAttribute(
      'href',
      'https://www.google.com/maps?q=30.044400,31.235700',
    );
  });

  it('suggests a phone when the reading is coarse', async () => {
    const user = userEvent.setup();
    stubPosition({ latitude: 30.0444, longitude: 31.2357, accuracy: 120, timestamp: 1_700_000_000_000 });
    server.use(serveList([]));
    renderSection();
    const dialog = await openAddDialog(user);

    await user.click(within(dialog).getByRole('button', { name: 'Use my current location' }));

    expect(await within(dialog).findByText(/from a phone/)).toBeInTheDocument();
  });

  it('explains when the device refuses to share its location', async () => {
    const user = userEvent.setup();
    stubPositionError(1);
    server.use(serveList([]));
    renderSection();
    const dialog = await openAddDialog(user);

    await user.click(within(dialog).getByRole('button', { name: 'Use my current location' }));

    expect(await screen.findByText(/Location access is blocked/)).toBeInTheDocument();
    expect(within(dialog).getByLabelText('Latitude')).toHaveValue('');
  });

  it('switches a location off', async () => {
    const user = userEvent.setup();
    let body: unknown;
    server.use(
      serveList([office]),
      http.put('/api/workplaces/w1', async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ success: true });
      }),
    );
    renderSection();

    await user.click(await screen.findByRole('switch', { name: 'Active: Main Office' }));

    await waitFor(() => expect(body).toEqual({ isActive: false }));
  });

  it('edits a location', async () => {
    const user = userEvent.setup();
    let body: unknown;
    server.use(
      serveList([office]),
      http.put('/api/workplaces/w1', async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ success: true });
      }),
    );
    renderSection();

    await user.click(await screen.findByRole('button', { name: 'Edit Main Office' }));
    const dialog = await screen.findByRole('dialog', { name: 'Edit work location' });
    expect(within(dialog).getByLabelText('Name')).toHaveValue('Main Office');
    const radius = within(dialog).getByLabelText('Radius (meters)');
    await user.clear(radius);
    await user.type(radius, '300');
    await user.click(within(dialog).getByRole('button', { name: 'Save location' }));

    await waitFor(() =>
      expect(body).toEqual({ name: 'Main Office', latitude: 30.0444, longitude: 31.2357, radiusMeters: 300 }),
    );
  });

  it('deletes a location only after confirmation', async () => {
    const user = userEvent.setup();
    const deleted: string[] = [];
    server.use(
      serveList([office]),
      http.delete('/api/workplaces/:id', ({ params }) => {
        deleted.push(String(params.id));
        return HttpResponse.json({ success: true });
      }),
    );
    const confirm = vi.spyOn(window, 'confirm');
    renderSection();
    const remove = await screen.findByRole('button', { name: 'Delete Main Office' });

    confirm.mockReturnValue(false);
    await user.click(remove);
    expect(deleted).toEqual([]);

    confirm.mockReturnValue(true);
    await user.click(remove);
    await waitFor(() => expect(deleted).toEqual(['w1']));
  });

  it('shows a message when the locations cannot be loaded', async () => {
    server.use(http.get('/api/workplaces', () => HttpResponse.json({ error: 'Failed' }, { status: 500 })));
    renderSection();

    expect(await screen.findByText('Failed')).toBeInTheDocument();
  });
});