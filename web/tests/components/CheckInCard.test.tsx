import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it } from 'vitest';
import CheckInCard from '@/components/attendance/CheckInCard';
import type { AttendanceRecord } from '@/types';
import { attendancePolicy } from '../msw/handlers';
import { server } from '../msw/server';
import { renderWithClient } from '../utils/render';
import { removeGeolocation, stubPosition, stubPositionError } from '../utils/geolocation';

afterEach(removeGeolocation);

const required = attendancePolicy({
  locationRequired: true,
  workplaces: [{ name: 'Main Office', radiusMeters: 150 }],
});

const checkedIn: AttendanceRecord = {
  _id: 'a1',
  employeeId: 'e1',
  date: '2026-11-26T00:00:00.000Z',
  checkIn: '2026-11-26T06:30:00.000Z',
  checkOut: null,
  status: 'PRESENT',
  workingHours: null,
  dayType: null,
};

const OFFICE_LOCATION = {
  latitude: 30.0444,
  longitude: 31.2357,
  accuracy: 12,
  capturedAt: 1_700_000_000_000,
};

function serveClock(
  bodies: unknown[],
  reply: (body: { location?: unknown }) => Response = () => HttpResponse.json({ type: 'CHECK_IN' }),
) {
  return http.post('/api/attendance', async ({ request }) => {
    const body = (await request.json()) as { location?: unknown };
    bodies.push(body);
    return reply(body);
  });
}

describe('CheckInCard', () => {
  it('clocks in without asking for a location when none is required', async () => {
    const user = userEvent.setup();
    const bodies: unknown[] = [];
    const geolocation = stubPosition();
    server.use(serveClock(bodies));
    renderWithClient(<CheckInCard />);

    await user.click(await screen.findByRole('button', { name: 'Clock In' }));

    await waitFor(() => expect(bodies).toEqual([{}]));
    expect(geolocation).not.toHaveBeenCalled();
  });

  it('says where to clock in and sends the position when it is required', async () => {
    const user = userEvent.setup();
    const bodies: unknown[] = [];
    stubPosition();
    server.use(required, serveClock(bodies));
    renderWithClient(<CheckInCard />);

    await screen.findByText(/Clock in from Main Office/);
    await user.click(screen.getByRole('button', { name: 'Clock In' }));

    await waitFor(() => expect(bodies).toEqual([{ location: OFFICE_LOCATION }]));
  });

  it('explains that the employee is away from the work location', async () => {
    const user = userEvent.setup();
    stubPosition();
    server.use(
      required,
      serveClock([], () =>
        HttpResponse.json(
          { error: 'You are 420 m from Main Office (allowed 150 m).', code: 'OUTSIDE_WORKPLACE' },
          { status: 403 },
        ),
      ),
    );
    renderWithClient(<CheckInCard />);

    await screen.findByText(/Clock in from Main Office/);
    await user.click(screen.getByRole('button', { name: 'Clock In' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('You are not at a work location');
    expect(alert).toHaveTextContent('You are 420 m from Main Office (allowed 150 m).');
    expect(screen.getByRole('button', { name: 'Clock In' })).toBeEnabled();
  });

  it('explains that location access is blocked and sends nothing', async () => {
    const user = userEvent.setup();
    const bodies: unknown[] = [];
    stubPositionError(1);
    server.use(required, serveClock(bodies));
    renderWithClient(<CheckInCard />);

    await screen.findByText(/Clock in from Main Office/);
    await user.click(screen.getByRole('button', { name: 'Clock In' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Location access is blocked');
    expect(bodies).toEqual([]);
  });

  it('asks for the location and tries again when the server says it is required', async () => {
    const user = userEvent.setup();
    const bodies: { location?: unknown }[] = [];
    stubPosition();
    server.use(
      serveClock(bodies, (body) =>
        body.location
          ? HttpResponse.json({ type: 'CHECK_IN' })
          : HttpResponse.json(
            { error: 'Allow location access to clock in.', code: 'LOCATION_REQUIRED' },
            { status: 422 },
          ),
      ),
    );
    renderWithClient(<CheckInCard />);

    await user.click(await screen.findByRole('button', { name: 'Clock In' }));

    await waitFor(() => expect(bodies).toHaveLength(2));
    expect(bodies[0]).toEqual({});
    expect(bodies[1]).toEqual({ location: OFFICE_LOCATION });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('records the location when clocking out', async () => {
    const user = userEvent.setup();
    const bodies: unknown[] = [];
    stubPosition();
    server.use(required, serveClock(bodies, () => HttpResponse.json({ type: 'CHECK_OUT' })));
    renderWithClient(<CheckInCard todayRecord={checkedIn} />);

    await screen.findByText(/location is also recorded/);
    await user.click(screen.getByRole('button', { name: 'Clock Out' }));

    await waitFor(() => expect(bodies).toEqual([{ location: OFFICE_LOCATION }]));
  });

  it('never blocks a clock out when the location cannot be found', async () => {
    const user = userEvent.setup();
    const bodies: unknown[] = [];
    stubPositionError(3);
    server.use(required, serveClock(bodies, () => HttpResponse.json({ type: 'CHECK_OUT' })));
    renderWithClient(<CheckInCard todayRecord={checkedIn} />);

    await screen.findByText(/location is also recorded/);
    await user.click(screen.getByRole('button', { name: 'Clock Out' }));

    await waitFor(() => expect(bodies).toEqual([{}]));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows the completed state once the day is closed', () => {
    renderWithClient(<CheckInCard todayRecord={{ ...checkedIn, checkOut: '2026-11-26T14:30:00.000Z' }} />);

    expect(screen.getByText('Work Day Completed')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});