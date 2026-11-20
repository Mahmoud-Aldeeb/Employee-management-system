import { describe, expect, it } from 'vitest';
import { AttendanceStatus } from '../src/common/enums/attendance-status.enum.js';
import { DEPARTMENTS } from '../src/common/constants/departments.js';
import { DayType } from '../src/common/enums/day-type.enum.js';
import { LeaveStatus } from '../src/common/enums/leave-status.enum.js';
import { Role } from '../src/common/enums/role.enum.js';
import { cairoDay } from '../src/common/utils/cairo-time.js';
import { buildDemoDataset } from '../src/demo/demo-dataset.js';
import {
  DEMO_ADMIN_EMAIL,
  DEMO_EMPLOYEE_EMAIL,
  isDemoEmail,
} from '../src/demo/demo.constants.js';

const NOW = new Date('2026-11-19T10:00:00Z');
const dataset = buildDemoDataset({ now: NOW, passwordHash: 'hash' });
const today = cairoDay(NOW);

describe('demo dataset', () => {
  it('builds the expected amount of data', () => {
    expect(dataset.users).toHaveLength(13);
    expect(dataset.employees).toHaveLength(12);
    expect(dataset.salaries).toHaveLength(12);
    expect(dataset.payslips).toHaveLength(36);
  });

  it('keeps every account on the demo domain with unique emails', () => {
    const emails = dataset.users.map((user) => user.email);

    expect(emails.every(isDemoEmail)).toBe(true);
    expect(new Set(emails).size).toBe(emails.length);
    expect(
      dataset.users.find((user) => user.email === DEMO_ADMIN_EMAIL)?.role,
    ).toBe(Role.ADMIN);
    expect(
      dataset.users.filter((user) => user.role === Role.EMPLOYEE),
    ).toHaveLength(12);
  });

  it('uses only valid departments and links employees to their users', () => {
    const userIds = new Set(dataset.users.map((user) => String(user._id)));

    for (const employee of dataset.employees) {
      expect(DEPARTMENTS).toContain(employee.department);
      expect(userIds.has(String(employee.userId))).toBe(true);
    }
    expect(
      dataset.employees.some(
        (employee) => employee.email === DEMO_EMPLOYEE_EMAIL,
      ),
    ).toBe(true);
  });

  it('never creates two attendance records for the same employee and day', () => {
    const keys = dataset.attendance.map(
      (record) => `${String(record.employeeId)}-${record.date.getTime()}`,
    );

    expect(new Set(keys).size).toBe(keys.length);
  });

  it('only records attendance on work days with consistent hours', () => {
    for (const record of dataset.attendance) {
      expect([5, 6]).not.toContain(record.date.getUTCDay());

      if (record.checkOut && record.workingHours !== null && record.checkIn) {
        expect(record.checkOut.getTime()).toBeGreaterThan(
          record.checkIn.getTime(),
        );
        const expected =
          record.workingHours >= 8
            ? DayType.FULL_DAY
            : record.workingHours >= 6
              ? DayType.THREE_QUARTER_DAY
              : DayType.HALF_DAY;
        expect(record.dayType).toBe(expected);
      }
    }
  });

  it('leaves the demo employee free to clock in today', () => {
    const demoEmployee = dataset.employees.find(
      (employee) => employee.email === DEMO_EMPLOYEE_EMAIL,
    );
    const todayRecords = dataset.attendance.filter(
      (record) =>
        String(record.employeeId) === String(demoEmployee?._id) &&
        record.date.getTime() === today.getTime(),
    );

    expect(todayRecords).toHaveLength(0);
    expect(
      dataset.attendance.some(
        (record) => record.date.getTime() === today.getTime(),
      ),
    ).toBe(true);
  });

  it('marks late arrivals consistently', () => {
    const statuses = new Set(dataset.attendance.map((record) => record.status));

    expect(statuses.has(AttendanceStatus.PRESENT)).toBe(true);
    expect(statuses.has(AttendanceStatus.LATE)).toBe(true);
  });

  it('creates one payslip per employee and month with the right net amount', () => {
    const keys = dataset.payslips.map(
      (payslip) =>
        `${String(payslip.employeeId)}-${payslip.year}-${payslip.month}`,
    );

    expect(new Set(keys).size).toBe(keys.length);
    for (const payslip of dataset.payslips) {
      expect(payslip.netSalary).toBe(
        payslip.basicSalary + payslip.allowances - payslip.deductions,
      );
    }
    expect(
      dataset.payslips.some(
        (payslip) => payslip.month === 10 && payslip.year === 2026,
      ),
    ).toBe(true);
  });

  it('covers every leave status with valid date ranges', () => {
    const statuses = new Set(dataset.leaves.map((leave) => leave.status));
    const employeeIds = new Set(
      dataset.employees.map((employee) => String(employee._id)),
    );

    expect(statuses).toEqual(
      new Set([
        LeaveStatus.PENDING,
        LeaveStatus.APPROVED,
        LeaveStatus.REJECTED,
      ]),
    );
    for (const leave of dataset.leaves) {
      expect(leave.startDate.getTime()).toBeLessThanOrEqual(
        leave.endDate.getTime(),
      );
      expect(employeeIds.has(String(leave.employeeId))).toBe(true);
    }
  });

  it('is repeatable apart from generated ids', () => {
    const again = buildDemoDataset({ now: NOW, passwordHash: 'hash' });

    expect(again.attendance).toHaveLength(dataset.attendance.length);
    expect(again.leaves.map((leave) => leave.reason)).toEqual(
      dataset.leaves.map((leave) => leave.reason),
    );
  });
});
