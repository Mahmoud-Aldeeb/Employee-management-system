import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// ─── Mock api ─────────────────────────────────────────────────────────────────
const mockGet = vi.fn();
vi.mock('../api/axios', () => ({
  default: {
    get: mockGet,
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));

// ─── Mock hooks to avoid double-fetch complexity ──────────────────────────────
vi.mock('../hooks/useFetch', () => ({
  default: vi.fn(),
}));

vi.mock('../hooks/usePageTitle', () => ({
  default: vi.fn(),
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { role: 'ADMIN' } }),
}));

// ─── Mock AdminDashboard & EmployeeDashboard ─────────────────────────────────
vi.mock('../components/AdminDashboard', () => ({
  default: ({ data }) => <div data-testid="admin-dashboard">Total: {data.totalEmployees}</div>,
}));

vi.mock('../components/EmployeeDashboard', () => ({
  default: ({ data }) => <div data-testid="employee-dashboard">Days: {data.currentMonthAttendance}</div>,
}));

vi.mock('../components/Loading', () => ({
  default: () => <div data-testid="loading">Loading...</div>,
}));

import Dashboard from '../pages/Dashboard';
import useFetch from '../hooks/useFetch';

describe('Dashboard Page — Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show loading spinner initially', () => {
    useFetch.mockReturnValue({ data: null, loading: true, error: null });
    render(<BrowserRouter><Dashboard /></BrowserRouter>);
    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });

  it('should show error message when data is null and loading is done', () => {
    useFetch.mockReturnValue({ data: null, loading: false, error: null });
    render(<BrowserRouter><Dashboard /></BrowserRouter>);
    expect(screen.getByText(/failed to load dashboard/i)).toBeInTheDocument();
  });

  it('should render AdminDashboard when role is ADMIN', () => {
    useFetch.mockReturnValue({
      data: { role: 'ADMIN', totalEmployees: 25, totalDepartments: 5, todayAttendance: 20, pendingLeaves: 3 },
      loading: false,
      error: null,
    });
    render(<BrowserRouter><Dashboard /></BrowserRouter>);
    expect(screen.getByTestId('admin-dashboard')).toBeInTheDocument();
    expect(screen.getByText('Total: 25')).toBeInTheDocument();
  });

  it('should render EmployeeDashboard when role is EMPLOYEE', () => {
    useFetch.mockReturnValue({
      data: { role: 'EMPLOYEE', currentMonthAttendance: 18, pendingLeaves: 1, latestPayslip: null },
      loading: false,
      error: null,
    });
    render(<BrowserRouter><Dashboard /></BrowserRouter>);
    expect(screen.getByTestId('employee-dashboard')).toBeInTheDocument();
    expect(screen.getByText('Days: 18')).toBeInTheDocument();
  });
});
