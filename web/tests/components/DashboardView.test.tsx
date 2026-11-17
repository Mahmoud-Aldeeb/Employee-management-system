import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import DashboardView from '@/components/dashboard/DashboardView';
import { server } from '../msw/server';
import { renderWithClient } from '../utils/render';

const sara = {
  _id: 'e1',
  firstName: 'Sara',
  lastName: 'Ali',
  position: 'Designer',
  department: 'Design',
};

describe('DashboardView', () => {
  it('shows the admin overview numbers', async () => {
    server.use(
      http.get('/api/dashboard', () =>
        HttpResponse.json({
          role: 'ADMIN',
          totalEmployees: 12,
          totalDepartments: 10,
          todayAttendance: 7,
          pendingLeaves: 3,
        }),
      ),
    );
    renderWithClient(<DashboardView />);

    expect(await screen.findByText('Total Employees')).toBeInTheDocument();
    for (const value of ['12', '10', '7', '3']) {
      expect(screen.getByText(value)).toBeInTheDocument();
    }
  });

  it('greets the employee and shows N/A without a payslip', async () => {
    server.use(
      http.get('/api/dashboard', () =>
        HttpResponse.json({
          role: 'EMPLOYEE',
          employee: sara,
          currentMonthAttendance: 18,
          pendingLeaves: 1,
          latestPayslip: null,
        }),
      ),
    );
    renderWithClient(<DashboardView />);

    expect(await screen.findByRole('heading', { name: 'Welcome, Sara!' })).toBeInTheDocument();
    expect(screen.getByText('Designer - Design')).toBeInTheDocument();
    expect(screen.getByText('18')).toBeInTheDocument();
    expect(screen.getByText('N/A')).toBeInTheDocument();
  });

  it('formats the latest payslip amount', async () => {
    server.use(
      http.get('/api/dashboard', () =>
        HttpResponse.json({
          role: 'EMPLOYEE',
          employee: sara,
          currentMonthAttendance: 20,
          pendingLeaves: 0,
          latestPayslip: { _id: 'p1', netSalary: 2180 },
        }),
      ),
    );
    renderWithClient(<DashboardView />);

    expect(await screen.findByText('$2,180')).toBeInTheDocument();
  });

  it('shows a fallback message when the request fails', async () => {
    server.use(
      http.get('/api/dashboard', () =>
        HttpResponse.json({ error: 'Failed' }, { status: 500 }),
      ),
    );
    renderWithClient(<DashboardView />);

    expect(await screen.findByText('Failed to load dashboard')).toBeInTheDocument();
  });
});