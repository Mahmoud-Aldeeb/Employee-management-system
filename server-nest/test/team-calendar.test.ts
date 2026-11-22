import { describe, expect, it } from 'vitest';
import { LeaveStatus } from '../src/common/enums/leave-status.enum.js';
import { LeaveType } from '../src/common/enums/leave-type.enum.js';
import {
  buildTeamCalendar,
  currentMonthKey,
  monthRange,
  shiftMonth,
  type CalendarLeave,
} from '../src/leave/calendar/team-calendar.builder.js';
import { EGYPT_LEAVE_POLICY as policy } from '../src/leave/policy/leave-policy.js';

const day = (value: string) => new Date(`${value}T00:00:00.000Z`);

const leave = (
  overrides: Partial<CalendarLeave> &
    Pick<CalendarLeave, 'id' | 'employeeId' | 'employeeName'>,
): CalendarLeave => ({
  department: 'Design',
  type: LeaveType.ANNUAL,
  status: LeaveStatus.APPROVED,
  startDate: day('2026-11-22'),
  endDate: day('2026-11-24'),
  ...overrides,
});

const admin = { isAdmin: true, employeeId: null };
const sara = { isAdmin: false, employeeId: 'sara' };
const build = (
  leaves: CalendarLeave[],
  viewer: typeof admin | typeof sara = admin,
  month = '2026-11',
  today = day('2026-11-21'),
) => buildTeamCalendar({ month, today, leaves, viewer, policy });

describe('month helpers', () => {
  it('computes the length of any month', () => {
    const lastDay = (month: string) => monthRange(month).end.getUTCDate();

    expect(lastDay('2026-11')).toBe(30);
    expect(lastDay('2027-02')).toBe(28);
    expect(lastDay('2028-02')).toBe(29);
    expect(lastDay('2026-12')).toBe(31);
  });

  it('moves across year boundaries', () => {
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
  });

  it('derives the current month from the Cairo date', () => {
    expect(currentMonthKey(day('2026-11-21'))).toBe('2026-11');
  });

  it('rejects malformed months', () => {
    expect(() => monthRange('2026-13')).toThrow('Invalid month');
    expect(() => monthRange('nonsense')).toThrow('Invalid month');
  });
});

describe('calendar days', () => {
  it('lists every day of the month with the weekend and today flags', () => {
    const calendar = build([]);

    expect(calendar.days).toHaveLength(30);
    expect(calendar.days[0].date).toBe('2026-11-01');
    expect(
      calendar.days.filter((item) => item.isWeekend).map((item) => item.date),
    ).toEqual([
      '2026-11-06',
      '2026-11-07',
      '2026-11-13',
      '2026-11-14',
      '2026-11-20',
      '2026-11-21',
      '2026-11-27',
      '2026-11-28',
    ]);
    expect(
      calendar.days.filter((item) => item.isToday).map((item) => item.date),
    ).toEqual(['2026-11-21']);
    expect(calendar.previousMonth).toBe('2026-10');
    expect(calendar.nextMonth).toBe('2026-12');
  });

  it('flags nothing as today when the month does not contain it', () => {
    expect(build([], admin, '2026-12').days.some((item) => item.isToday)).toBe(
      false,
    );
  });
});

describe('placing leave', () => {
  const trip = leave({
    id: 'l1',
    employeeId: 'omar',
    employeeName: 'Omar Nabil',
  });

  it('puts a leave on each day it covers and nowhere else', () => {
    const covered = build([trip])
      .days.filter((item) => item.entries.length > 0)
      .map((item) => item.date);

    expect(covered).toEqual(['2026-11-22', '2026-11-23', '2026-11-24']);
  });

  it('clips a leave that crosses a month boundary', () => {
    const crossing = leave({
      id: 'l2',
      employeeId: 'omar',
      employeeName: 'Omar Nabil',
      startDate: day('2026-11-29'),
      endDate: day('2026-12-02'),
    });
    const datesOf = (month: string) =>
      build([crossing], admin, month)
        .days.filter((item) => item.entries.length > 0)
        .map((item) => item.date);

    expect(datesOf('2026-11')).toEqual(['2026-11-29', '2026-11-30']);
    expect(datesOf('2026-12')).toEqual(['2026-12-01', '2026-12-02']);
  });

  it('sorts the people of a day by name', () => {
    const calendar = build([
      leave({ id: 'a', employeeId: '2', employeeName: 'Zeina Adel' }),
      leave({ id: 'b', employeeId: '1', employeeName: 'Amr Zaki' }),
    ]);

    expect(
      calendar.days[21].entries.map((entry) => entry.employeeName),
    ).toEqual(['Amr Zaki', 'Zeina Adel']);
  });

  it('summarizes the month', () => {
    const calendar = build([
      leave({ id: 'a', employeeId: '1', employeeName: 'Amr Zaki' }),
      leave({
        id: 'b',
        employeeId: '2',
        employeeName: 'Dalia Nasser',
        status: LeaveStatus.PENDING,
        startDate: day('2026-11-21'),
        endDate: day('2026-11-23'),
      }),
      leave({
        id: 'c',
        employeeId: '2',
        employeeName: 'Dalia Nasser',
        startDate: day('2026-11-02'),
        endDate: day('2026-11-02'),
      }),
    ]);

    expect(calendar.summary).toEqual({
      employeesOut: 2,
      outToday: 1,
      pendingLeaves: 1,
    });
  });
});

describe('visibility', () => {
  const approvedColleague = leave({
    id: 'a',
    employeeId: 'omar',
    employeeName: 'Omar Nabil',
  });
  const pendingColleague = leave({
    id: 'b',
    employeeId: 'mona',
    employeeName: 'Mona Hassan',
    status: LeaveStatus.PENDING,
  });
  const mine = leave({
    id: 'c',
    employeeId: 'sara',
    employeeName: 'Sara Ali',
    status: LeaveStatus.PENDING,
    type: LeaveType.SICK,
  });
  const rejected = leave({
    id: 'd',
    employeeId: 'lina',
    employeeName: 'Lina Sami',
    status: LeaveStatus.REJECTED,
  });
  const entriesOn = (viewer: typeof admin | typeof sara) =>
    build([approvedColleague, pendingColleague, mine, rejected], viewer)
      .days[21].entries;

  it('shows admins every live leave with its type and never the rejected ones', () => {
    const entries = entriesOn(admin);

    expect(entries.map((entry) => entry.employeeName)).toEqual([
      'Mona Hassan',
      'Omar Nabil',
      'Sara Ali',
    ]);
    expect(entries.every((entry) => entry.type !== null)).toBe(true);
    expect(entries.every((entry) => !entry.isMine)).toBe(true);
  });

  it('shows employees their own leave in detail and colleagues without type or pending ones', () => {
    const entries = entriesOn(sara);

    expect(entries.map((entry) => entry.employeeName)).toEqual([
      'Omar Nabil',
      'Sara Ali',
    ]);
    expect(entries.find((entry) => entry.employeeId === 'omar')).toMatchObject({
      type: null,
      isMine: false,
    });
    expect(entries.find((entry) => entry.employeeId === 'sara')).toMatchObject({
      type: LeaveType.SICK,
      status: LeaveStatus.PENDING,
      isMine: true,
    });
  });
});
