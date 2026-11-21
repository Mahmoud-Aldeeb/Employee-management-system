import { describe, expect, it } from 'vitest';
import { LeaveStatus } from '../src/common/enums/leave-status.enum.js';
import { LeaveType } from '../src/common/enums/leave-type.enum.js';
import {
  computeBalance,
  entitlementFor,
  findBookingProblem,
  tierFor,
  type LeaveRecord,
} from '../src/leave/policy/leave-balance.js';
import {
  addMonthsUtc,
  completedYears,
  countWorkingDays,
  rangesOverlap,
  workingDaysByYear,
} from '../src/leave/policy/leave-calendar.js';
import { EGYPT_LEAVE_POLICY as policy } from '../src/leave/policy/leave-policy.js';

const day = (value: string) => new Date(`${value}T00:00:00.000Z`);
const range = (start: string, end: string) => ({
  startDate: day(start),
  endDate: day(end),
});
const leave = (
  type: LeaveType,
  status: LeaveStatus,
  start: string,
  end: string,
): LeaveRecord => ({ type, status, ...range(start, end) });

describe('leave calendar', () => {
  it('counts only working days (Sunday to Thursday)', () => {
    expect(countWorkingDays(range('2026-11-22', '2026-11-26'), policy)).toBe(5);
    expect(countWorkingDays(range('2026-11-26', '2026-11-29'), policy)).toBe(2);
    expect(countWorkingDays(range('2026-11-27', '2026-11-28'), policy)).toBe(0);
  });

  it('splits a leave that crosses the new year', () => {
    const days = workingDaysByYear(range('2026-12-30', '2027-01-04'), policy);

    expect(days.get(2026)).toBe(2);
    expect(days.get(2027)).toBe(2);
  });

  it('detects overlapping ranges inclusively', () => {
    const first = range('2026-12-01', '2026-12-03');

    expect(rangesOverlap(first, range('2026-12-03', '2026-12-05'))).toBe(true);
    expect(rangesOverlap(first, range('2026-12-04', '2026-12-05'))).toBe(false);
  });

  it('adds months without overflowing short months', () => {
    expect(addMonthsUtc(day('2026-01-31'), 1).toISOString().slice(0, 10)).toBe(
      '2026-02-28',
    );
    expect(addMonthsUtc(day('2026-08-15'), 6).toISOString().slice(0, 10)).toBe(
      '2027-02-15',
    );
  });

  it('counts completed years of service', () => {
    expect(completedYears(day('2016-12-31'), day('2026-12-31'))).toBe(10);
    expect(completedYears(day('2016-12-31'), day('2026-12-30'))).toBe(9);
  });
});

describe('entitlement tiers (Egyptian Labor Law 14/2025)', () => {
  it('uses 15 days in the first year, 21 afterwards and 30 after ten years', () => {
    expect(tierFor(day('2026-03-01'), 2026, policy)).toBe('first-year');
    expect(tierFor(day('2026-03-01'), 2027, policy)).toBe('standard');
    expect(tierFor(day('2017-01-01'), 2026, policy)).toBe('standard');
    expect(tierFor(day('2016-06-01'), 2026, policy)).toBe('senior');
    expect(tierFor(day('2027-01-01'), 2026, policy)).toBeNull();
  });

  it('maps tiers to the statutory number of days', () => {
    expect(entitlementFor('first-year', policy)).toBe(15);
    expect(entitlementFor('standard', policy)).toBe(21);
    expect(entitlementFor('senior', policy)).toBe(30);
    expect(entitlementFor(null, policy)).toBe(0);
  });
});

describe('leave balance', () => {
  const joinDate = day('2023-02-01');
  const today = day('2026-11-21');

  it('deducts annual and casual leave, ignores rejected ones and tracks sick leave separately', () => {
    const balance = computeBalance({
      joinDate,
      year: 2026,
      policy,
      today,
      leaves: [
        leave(
          LeaveType.ANNUAL,
          LeaveStatus.APPROVED,
          '2026-11-22',
          '2026-11-26',
        ),
        leave(
          LeaveType.CASUAL,
          LeaveStatus.PENDING,
          '2026-12-06',
          '2026-12-06',
        ),
        leave(
          LeaveType.ANNUAL,
          LeaveStatus.REJECTED,
          '2026-10-04',
          '2026-10-08',
        ),
        leave(LeaveType.SICK, LeaveStatus.APPROVED, '2026-10-11', '2026-10-12'),
      ],
    });

    expect(balance).toMatchObject({
      year: 2026,
      tier: 'standard',
      entitlement: 21,
      taken: 5,
      pending: 1,
      remaining: 15,
      sickTaken: 2,
      annualAvailable: true,
      casual: { limit: 7, taken: 0, pending: 1, remaining: 6 },
    });
    expect(balance.annualAvailableFrom.startsWith('2023-08-01')).toBe(true);
  });

  it('counts a leave across two years in each year', () => {
    const leaves = [
      leave(LeaveType.ANNUAL, LeaveStatus.APPROVED, '2026-12-30', '2027-01-04'),
    ];

    expect(
      computeBalance({ joinDate, year: 2026, leaves, policy, today }).taken,
    ).toBe(2);
    expect(
      computeBalance({ joinDate, year: 2027, leaves, policy, today }).taken,
    ).toBe(2);
  });

  it('reports whether annual leave is available yet', () => {
    const hired = day('2026-09-01');
    const availability = (date: string) =>
      computeBalance({
        joinDate: hired,
        year: 2026,
        leaves: [],
        policy,
        today: day(date),
      }).annualAvailable;

    expect(availability('2026-11-21')).toBe(false);
    expect(availability('2027-02-28')).toBe(false);
    expect(availability('2027-03-01')).toBe(true);
  });
});

describe('booking rules', () => {
  const joinDate = day('2023-02-01');
  const check = (
    type: LeaveType,
    start: string,
    end: string,
    existing: LeaveRecord[] = [],
    join: Date = joinDate,
  ) =>
    findBookingProblem(
      { type, ...range(start, end) },
      { joinDate: join, existing, policy },
    );

  it('accepts a valid request', () => {
    expect(check(LeaveType.ANNUAL, '2026-12-06', '2026-12-07')).toBeNull();
  });

  it('rejects dates without working days', () => {
    expect(check(LeaveType.ANNUAL, '2026-11-27', '2026-11-28')).toBe(
      'The selected dates contain no working days',
    );
  });

  it('rejects overlaps with booked leave but ignores rejected ones', () => {
    const approved = leave(
      LeaveType.ANNUAL,
      LeaveStatus.APPROVED,
      '2026-12-06',
      '2026-12-10',
    );
    const rejected = leave(
      LeaveType.ANNUAL,
      LeaveStatus.REJECTED,
      '2026-12-06',
      '2026-12-10',
    );

    expect(check(LeaveType.SICK, '2026-12-08', '2026-12-09', [approved])).toBe(
      'These dates overlap with another leave request',
    );
    expect(
      check(LeaveType.SICK, '2026-12-08', '2026-12-09', [rejected]),
    ).toBeNull();
  });

  it('makes annual leave available only after six months of service', () => {
    const message = check(
      LeaveType.ANNUAL,
      '2026-12-06',
      '2026-12-07',
      [],
      day('2026-09-01'),
    );

    expect(message).toContain('becomes available after 6 months of service');
    expect(message).toContain('2027-03-01');
    expect(
      check(
        LeaveType.CASUAL,
        '2026-12-06',
        '2026-12-06',
        [],
        day('2026-09-01'),
      ),
    ).toBeNull();
  });

  it('limits casual leave to two working days per request', () => {
    expect(check(LeaveType.CASUAL, '2026-12-06', '2026-12-08')).toBe(
      'Casual leave is limited to 2 working days per request',
    );
    expect(check(LeaveType.CASUAL, '2026-12-06', '2026-12-07')).toBeNull();
  });

  it('limits casual leave to seven days a year', () => {
    const used = [
      leave(LeaveType.CASUAL, LeaveStatus.APPROVED, '2026-03-01', '2026-03-02'),
      leave(LeaveType.CASUAL, LeaveStatus.APPROVED, '2026-04-05', '2026-04-06'),
      leave(LeaveType.CASUAL, LeaveStatus.APPROVED, '2026-05-03', '2026-05-04'),
    ];

    expect(check(LeaveType.CASUAL, '2026-12-06', '2026-12-07', used)).toBe(
      'Casual leave limit reached for 2026: 1 of 7 days left',
    );
  });

  it('rejects requests that exceed the remaining balance', () => {
    const used = [
      leave(LeaveType.ANNUAL, LeaveStatus.APPROVED, '2026-01-04', '2026-01-29'),
    ];

    expect(check(LeaveType.ANNUAL, '2026-12-06', '2026-12-07', used)).toBe(
      'Not enough leave balance in 2026: requested 2 working days, 1 available',
    );
  });

  it('does not limit sick leave by the annual balance', () => {
    const used = [
      leave(LeaveType.ANNUAL, LeaveStatus.APPROVED, '2026-01-04', '2026-01-29'),
    ];

    expect(check(LeaveType.SICK, '2026-12-06', '2026-12-10', used)).toBeNull();
  });
});
