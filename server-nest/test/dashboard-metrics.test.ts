import { describe, expect, it } from 'vitest';
import {
  buildAttendanceTrend,
  countByDepartment,
  fullName,
  sumNetSalaries,
  toPendingItem,
  toWhosOutItem,
} from '../src/dashboard/dashboard.metrics.js';
import { LeaveType } from '../src/common/enums/leave-type.enum.js';

describe('dashboard metrics', () => {
  it('builds a full chronological trend and fills the missing days with zeros', () => {
    const today = new Date('2026-11-19T00:00:00Z');

    const trend = buildAttendanceTrend(
      [
        { _id: '2026-11-17', checkedIn: 5, late: 1 },
        { _id: '2026-11-19', checkedIn: 3, late: 0 },
      ],
      today,
      7,
    );

    expect(trend).toHaveLength(7);
    expect(trend[0]).toEqual({ date: '2026-11-13', checkedIn: 0, late: 0 });
    expect(trend[4]).toEqual({ date: '2026-11-17', checkedIn: 5, late: 1 });
    expect(trend[6]).toEqual({ date: '2026-11-19', checkedIn: 3, late: 0 });
  });

  it('counts departments, names the missing ones and sorts by size then name', () => {
    const result = countByDepartment([
      { department: 'Sales' },
      { department: 'Design' },
      { department: 'Design' },
      { department: 'Engineering' },
      {},
    ]);

    expect(result).toEqual([
      { department: 'Design', count: 2 },
      { department: 'Engineering', count: 1 },
      { department: 'Sales', count: 1 },
      { department: 'Unassigned', count: 1 },
    ]);
  });

  it('sums net salaries', () => {
    expect(
      sumNetSalaries([
        { basicSalary: 5000, allowances: 500, deductions: 200 },
        { basicSalary: 4000, allowances: 0, deductions: 100 },
      ]),
    ).toBe(9200);
    expect(sumNetSalaries([])).toBe(0);
  });

  it('maps leave rows for the pending list and the who is out list', () => {
    const row = {
      _id: 'abc',
      type: LeaveType.ANNUAL,
      startDate: new Date('2026-12-01T00:00:00Z'),
      endDate: new Date('2026-12-02T00:00:00Z'),
      reason: 'Trip',
      employeeId: { firstName: 'Sara', lastName: 'Ali', department: 'Design' },
    };

    expect(toPendingItem(row, 3)).toMatchObject({
      id: 'abc',
      employeeName: 'Sara Ali',
      department: 'Design',
      reason: 'Trip',
      days: 3,
    });
    expect(toWhosOutItem(row)).toMatchObject({
      id: 'abc',
      employeeName: 'Sara Ali',
    });
    expect(toPendingItem({ ...row, employeeId: null }, 1).employeeName).toBe(
      'Unknown employee',
    );
    expect(fullName(null)).toBe('Unknown employee');
  });
});
