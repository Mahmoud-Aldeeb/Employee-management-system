import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import TeamCalendarView from '@/components/team-calendar/TeamCalendarView';
import type { TeamCalendar, TeamCalendarEntry } from '@/types';
import { admin, employee, signedIn } from '../msw/handlers';
import { server } from '../msw/server';
import { renderWithClient } from '../utils/render';

const entry = (overrides: Partial<TeamCalendarEntry> = {}): TeamCalendarEntry => ({
  leaveId: 'l1',
  employeeId: 'e1',
  employeeName: 'Salma Farouk',
  department: 'Design',
  status: 'APPROVED',
  type: 'ANNUAL',
  isMine: false,
  ...overrides,
});

const shift = (month: string, delta: number) => {
  const [year, number] = month.split('-').map(Number);
  return new Date(Date.UTC(year, number - 1 + delta, 1)).toISOString().slice(0, 7);
};

function buildMonth(
  month: string,
  entriesByDate: Record<string, TeamCalendarEntry[]> = {},
  todayDate?: string,
): TeamCalendar {
  const [year, number] = month.split('-').map(Number);
  const length = new Date(Date.UTC(year, number, 0)).getUTCDate();
  const days = Array.from({ length }, (_, index) => {
    const date = `${month}-${String(index + 1).padStart(2, '0')}`;
    const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();

    return {
      date,
      isWeekend: weekday === 5 || weekday === 6,
      isToday: date === todayDate,
      entries: entriesByDate[date] ?? [],
    };
  });
  const all = Object.values(entriesByDate).flat();

  return {
    month,
    previousMonth: shift(month, -1),
    nextMonth: shift(month, 1),
    days,
    summary: {
      employeesOut: new Set(all.map((item) => item.employeeId)).size,
      outToday: days.find((day) => day.isToday)?.entries.length ?? 0,
      pendingLeaves: all.filter((item) => item.status === 'PENDING').length,
    },
  };
}

const salma = entry();
const tamer = entry({
  leaveId: 'l2',
  employeeId: 'e2',
  employeeName: 'Tamer Wahba',
  department: 'Sales',
  status: 'PENDING',
  type: 'CASUAL',
});

const november = buildMonth(
  '2026-11',
  { '2026-11-22': [salma, tamer], '2026-11-23': [salma] },
  '2026-11-21',
);
const december = buildMonth('2026-12');

function serveCalendar(
  respond: (params: URLSearchParams) => TeamCalendar,
  seen: URLSearchParams[] = [],
) {
  return http.get('/api/leave/calendar', ({ request }) => {
    const params = new URL(request.url).searchParams;
    seen.push(params);
    return HttpResponse.json(respond(params));
  });
}

describe('TeamCalendarView', () => {
  it('shows the month, the summary and who is out', async () => {
    server.use(signedIn(admin), serveCalendar(() => november));
    renderWithClient(<TeamCalendarView />);

    expect(await screen.findByText('November 2026')).toBeInTheDocument();

    const grid = screen.getByRole('region', { name: 'Month view' });
    expect(within(grid).getByRole('button', { name: /Sunday, Nov 22: 2 out/ })).toBeInTheDocument();
    expect(
      within(grid).getByRole('button', { name: /Saturday, Nov 21 \(today\): nobody out/ }),
    ).toBeInTheDocument();
    expect(within(grid).getAllByText('Salma F.')).toHaveLength(2);
    expect(within(grid).getByText('Tamer W.')).toBeInTheDocument();

    const summary = screen.getByLabelText('Summary');
    expect(within(summary).getByText('Employees out this month').nextElementSibling).toHaveTextContent('2');
    expect(within(summary).getByText('Pending requests').nextElementSibling).toHaveTextContent('1');
  });

  it('opens the details of the selected day', async () => {
    const user = userEvent.setup();
    server.use(signedIn(admin), serveCalendar(() => november));
    renderWithClient(<TeamCalendarView />);

    const grid = await screen.findByRole('region', { name: 'Month view' });
    await user.click(within(grid).getByRole('button', { name: /Sunday, Nov 22/ }));

    const details = screen.getByRole('region', { name: 'Out on Sunday, Nov 22' });
    expect(within(details).getByText('Salma Farouk')).toBeInTheDocument();
    expect(within(details).getByText('Annual leave')).toBeInTheDocument();
    expect(within(details).getByText('Tamer Wahba')).toBeInTheDocument();
    expect(within(details).getByText('Casual leave (pending)')).toBeInTheDocument();
  });

  it('shows today by default', async () => {
    server.use(signedIn(admin), serveCalendar(() => november));
    renderWithClient(<TeamCalendarView />);

    const details = await screen.findByRole('region', { name: 'Out on Saturday, Nov 21' });

    expect(within(details).getByText('Nobody is out this day')).toBeInTheDocument();
  });

  it('moves between months and back to today', async () => {
    const user = userEvent.setup();
    const seen: URLSearchParams[] = [];
    server.use(
      signedIn(admin),
      serveCalendar((params) => (params.get('month') === '2026-12' ? december : november), seen),
    );
    renderWithClient(<TeamCalendarView />);

    await user.click(await screen.findByRole('button', { name: 'Next month' }));
    expect(await screen.findByText('December 2026')).toBeInTheDocument();
    expect(seen.at(-1)?.get('month')).toBe('2026-12');

    await user.click(screen.getByRole('button', { name: 'Today' }));
    expect(await screen.findByText('November 2026')).toBeInTheDocument();
    expect(seen.at(-1)?.has('month')).toBe(false);
  });

  it('lets admins filter by department', async () => {
    const user = userEvent.setup();
    const seen: URLSearchParams[] = [];
    server.use(signedIn(admin), serveCalendar(() => november, seen));
    renderWithClient(<TeamCalendarView />);

    await user.selectOptions(await screen.findByLabelText('Filter by department'), 'Sales');

    await waitFor(() => expect(seen.at(-1)?.get('department')).toBe('Sales'));
  });

  it('hides the department filter from employees and explains what they see', async () => {
    server.use(signedIn(employee), serveCalendar(() => november));
    renderWithClient(<TeamCalendarView />);

    expect(await screen.findByText('November 2026')).toBeInTheDocument();
    expect(screen.queryByLabelText('Filter by department')).not.toBeInTheDocument();
    expect(screen.getByText(/without its type, plus your own requests/)).toBeInTheDocument();
  });

  it('lists only the days with leave in the agenda and masks hidden types', async () => {
    const masked = buildMonth('2026-11', { '2026-11-22': [entry({ type: null })] }, '2026-11-21');
    server.use(signedIn(employee), serveCalendar(() => masked));
    renderWithClient(<TeamCalendarView />);

    const agenda = await screen.findByRole('region', { name: 'Agenda' });

    expect(within(agenda).getByText('Sunday, Nov 22')).toBeInTheDocument();
    expect(within(agenda).getByText('On leave')).toBeInTheDocument();
    expect(within(agenda).queryByText('Annual leave')).not.toBeInTheDocument();
  });

  it('says so when nobody is on leave', async () => {
    server.use(signedIn(admin), serveCalendar(() => december));
    renderWithClient(<TeamCalendarView />);

    const agenda = await screen.findByRole('region', { name: 'Agenda' });

    expect(within(agenda).getByText('No leave this month')).toBeInTheDocument();
  });

  it('shows a fallback message when the request fails', async () => {
    server.use(
      signedIn(admin),
      http.get('/api/leave/calendar', () => HttpResponse.json({ error: 'Failed' }, { status: 500 })),
    );
    renderWithClient(<TeamCalendarView />);

    expect(await screen.findByText('Failed to load the team calendar')).toBeInTheDocument();
  });
});