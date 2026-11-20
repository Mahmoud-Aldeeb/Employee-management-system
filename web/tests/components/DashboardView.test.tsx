import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse, type JsonBodyType } from 'msw';
import { describe, expect, it } from 'vitest';
import DashboardView from '@/components/dashboard/DashboardView';
import { server } from '../msw/server';
import { renderWithClient } from '../utils/render';

const trend = Array.from({ length: 7 }, (_, index) => ({
  date: `2026-11-${String(10 + index).padStart(2, '0')}`,
  checkedIn: 8 + index,
  late: index % 2,
}));

const adminData = {
  role: 'ADMIN',
  totalEmployees: 12,
  totalDepartments: 4,
  newHiresThisMonth: 2,
  todayAttendance: 7,
  lateToday: 1,
  attendanceRate: 58,
  pendingLeaves: 3,
  monthlyPayroll: 61250,
  attendanceTrend: trend,
  departments: [
    { department: 'Engineering', count: 4 },
    { department: 'Design', count: 2 },
  ],
  pendingRequests: [
    {
      id: 'l1',
      type: 'ANNUAL',
      startDate: '2026-12-01T00:00:00.000Z',
      endDate: '2026-12-03T00:00:00.000Z',
      reason: 'Family trip',
      employeeName: 'Salma Farouk',
      department: 'Design',
    },
  ],
  whosOut: [
    {
      id: 'o1',
      employeeName: 'Tamer Wahba',
      type: 'CASUAL',
      startDate: '2026-11-19T00:00:00.000Z',
      endDate: '2026-11-19T00:00:00.000Z',
    },
  ],
};

const employeeData = {
  role: 'EMPLOYEE',
  employee: {
    _id: 'e1',
    firstName: 'Salma',
    lastName: 'Farouk',
    position: 'Senior UI Designer',
    department: 'Design',
    isDeleted: false,
  },
  salary: { basicSalary: 6500, allowances: 800, deductions: 450, netSalary: 6850, updatedAt: null },
  latestPayslip: { _id: 'p1', month: 10, year: 2026, netSalary: 5300 },
  currentMonthAttendance: 9,
  lateThisMonth: 2,
  pendingLeaves: 1,
  todayRecord: null,
  leaveDaysThisYear: { SICK: 1, CASUAL: 0, ANNUAL: 5 },
  upcomingLeave: {
    type: 'CASUAL',
    startDate: '2026-12-06T00:00:00.000Z',
    endDate: '2026-12-07T00:00:00.000Z',
  },
};

const dashboard = (data: JsonBodyType) =>
  http.get('/api/dashboard', () => HttpResponse.json(data));

describe('DashboardView for admins', () => {
  it('shows the key numbers and the overview widgets', async () => {
    server.use(dashboard(adminData));
    renderWithClient(<DashboardView />);

    expect(await screen.findByText('Total Employees')).toBeInTheDocument();
    expect(screen.getByText('2 joined this month')).toBeInTheDocument();
    expect(screen.getByText('58% attendance rate')).toBeInTheDocument();
    expect(screen.getByText('$61,250')).toBeInTheDocument();
    expect(screen.getByText('Showing 1 of 3 requests')).toBeInTheDocument();
    expect(screen.getByText('4 departments in use')).toBeInTheDocument();
    expect(screen.getByText('Late arrivals today: 1')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Engineering' })).toBeInTheDocument();
  });

  it('lists the pending request with its details', async () => {
    server.use(dashboard(adminData));
    renderWithClient(<DashboardView />);

    const approvals = await screen.findByRole('region', { name: 'Pending approvals' });

    expect(within(approvals).getByText('Salma Farouk')).toBeInTheDocument();
    expect(within(approvals).getByText('Annual leave · Dec 01 - Dec 03, 2026')).toBeInTheDocument();
    expect(within(approvals).getByText('Family trip')).toBeInTheDocument();
  });

  it('shows who is out today', async () => {
    server.use(dashboard(adminData));
    renderWithClient(<DashboardView />);

    const outToday = await screen.findByRole('region', { name: "Who's out today" });

    expect(within(outToday).getByText('Tamer Wahba')).toBeInTheDocument();
    expect(within(outToday).getByText('Casual leave · until Nov 19')).toBeInTheDocument();
  });

  it('approves a request straight from the dashboard', async () => {
    const user = userEvent.setup();
    let body: unknown;
    server.use(
      dashboard(adminData),
      http.patch('/api/leave/l1', async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ success: true });
      }),
    );
    renderWithClient(<DashboardView />);

    await user.click(await screen.findByRole('button', { name: 'Approve leave for Salma Farouk' }));

    await waitFor(() => expect(body).toEqual({ status: 'APPROVED' }));
  });

  it('shows friendly empty states', async () => {
    server.use(
      dashboard({ ...adminData, pendingLeaves: 0, pendingRequests: [], whosOut: [], departments: [] }),
    );
    renderWithClient(<DashboardView />);

    expect(await screen.findByText("You're all caught up")).toBeInTheDocument();
    expect(screen.getByText('Everyone is in today')).toBeInTheDocument();
    expect(screen.getByText('No employees yet')).toBeInTheDocument();
  });
});

describe('DashboardView for employees', () => {
  it('greets the employee and shows the personal summary', async () => {
    server.use(dashboard(employeeData));
    renderWithClient(<DashboardView />);

    expect(await screen.findByRole('heading', { name: 'Welcome, Salma!' })).toBeInTheDocument();
    expect(screen.getByText('Senior UI Designer - Design')).toBeInTheDocument();
    expect(screen.getByText('Current Salary')).toBeInTheDocument();
    expect(screen.getByText('$6,850')).toBeInTheDocument();
    expect(screen.getByText('$5,300')).toBeInTheDocument();
    expect(screen.getByText('October 2026')).toBeInTheDocument();
  });

  it('summarises the leave taken this year and the next leave', async () => {
    server.use(dashboard(employeeData));
    renderWithClient(<DashboardView />);

    const summary = await screen.findByRole('region', { name: 'Leave this year' });

    expect(within(summary).getByText('5 days')).toBeInTheDocument();
    expect(within(summary).getByText('1 day')).toBeInTheDocument();
    expect(within(summary).getByText('Casual leave · Dec 06 - Dec 07, 2026')).toBeInTheDocument();
  });

  it('lets the employee clock in from the dashboard', async () => {
    const user = userEvent.setup();
    let clockedIn = false;
    server.use(
      dashboard(employeeData),
      http.post('/api/attendance', () => {
        clockedIn = true;
        return HttpResponse.json({ type: 'CHECK_IN' });
      }),
    );
    renderWithClient(<DashboardView />);

    await user.click(await screen.findByRole('button', { name: 'Clock In' }));

    await waitFor(() => expect(clockedIn).toBe(true));
  });

  it('replaces the clock in card when the account is deactivated', async () => {
    server.use(
      dashboard({ ...employeeData, employee: { ...employeeData.employee, isDeleted: true } }),
    );
    renderWithClient(<DashboardView />);

    expect(await screen.findByText(/has been deactivated/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Clock In' })).not.toBeInTheDocument();
  });

  it('says when there is no payslip yet', async () => {
    server.use(dashboard({ ...employeeData, latestPayslip: null, upcomingLeave: null }));
    renderWithClient(<DashboardView />);

    expect(await screen.findByText('No payslips yet')).toBeInTheDocument();
    expect(screen.getByText('No upcoming approved leave')).toBeInTheDocument();
  });
});

describe('DashboardView errors', () => {
  it('shows a fallback message when the request fails', async () => {
    server.use(http.get('/api/dashboard', () => HttpResponse.json({ error: 'Failed' }, { status: 500 })));
    renderWithClient(<DashboardView />);

    expect(await screen.findByText('Failed to load dashboard')).toBeInTheDocument();
  });
});