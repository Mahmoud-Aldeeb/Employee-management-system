import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import AttendanceHistory from '@/components/attendance/AttendanceHistory';
import type { AttendanceRecord } from '@/types';

const base: AttendanceRecord = {
  _id: 'a1',
  employeeId: 'e1',
  date: '2026-11-16T00:00:00.000Z',
  checkIn: '2026-11-16T06:30:00.000Z',
  checkOut: '2026-11-16T14:30:00.000Z',
  status: 'PRESENT',
  workingHours: 8,
  dayType: 'Full Day',
};

describe('AttendanceHistory location column', () => {
  it('shows where the employee clocked in and out', () => {
    render(
      <AttendanceHistory
        history={[
          {
            ...base,
            checkInLocation: { status: 'INSIDE', workplaceName: 'Main Office', distanceMeters: 96, accuracyMeters: 10 },
            checkOutLocation: { status: 'OUTSIDE', workplaceName: 'Main Office', distanceMeters: 1100, accuracyMeters: 10 },
          },
        ]}
      />,
    );

    expect(screen.getByText('In: Main Office · 96 m')).toBeInTheDocument();
    expect(screen.getByText('Out: Away from Main Office · 1.1 km')).toBeInTheDocument();
  });

  it('shows a dash when no location was recorded', () => {
    render(<AttendanceHistory history={[{ ...base, checkInLocation: null, checkOutLocation: null }]} />);

    expect(screen.queryByText(/^In:/)).not.toBeInTheDocument();
    expect(screen.getAllByText('-').length).toBeGreaterThan(0);
  });
});