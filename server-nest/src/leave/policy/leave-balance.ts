import { LeaveStatus } from '../../common/enums/leave-status.enum.js';
import { LeaveType } from '../../common/enums/leave-type.enum.js';
import {
  addMonthsUtc,
  completedYears,
  rangesOverlap,
  workingDaysByYear,
  type DateRange,
} from './leave-calendar.js';
import type { LeavePolicy } from './leave-policy.js';

export interface LeaveRecord extends DateRange {
  type: LeaveType;
  status: LeaveStatus;
}

export type LeaveTier = 'first-year' | 'standard' | 'senior';

export interface LeaveBalance {
  year: number;
  tier: LeaveTier | null;
  entitlement: number;
  taken: number;
  pending: number;
  remaining: number;
  casual: { limit: number; taken: number; pending: number; remaining: number };
  sickTaken: number;
  annualAvailableFrom: string;
}

export interface LeaveRequestInput extends DateRange {
  type: LeaveType;
}

export interface BookingContext {
  joinDate: Date;
  existing: readonly LeaveRecord[];
  policy: LeavePolicy;
}

interface BalanceInput {
  joinDate: Date;
  year: number;
  leaves: readonly LeaveRecord[];
  policy: LeavePolicy;
}

const DEDUCTED_TYPES: readonly LeaveType[] = [
  LeaveType.ANNUAL,
  LeaveType.CASUAL,
];
const CASUAL_ONLY: readonly LeaveType[] = [LeaveType.CASUAL];
const SICK_ONLY: readonly LeaveType[] = [LeaveType.SICK];
const APPROVED_ONLY: readonly LeaveStatus[] = [LeaveStatus.APPROVED];
const PENDING_ONLY: readonly LeaveStatus[] = [LeaveStatus.PENDING];
const BOOKED: readonly LeaveStatus[] = [
  LeaveStatus.APPROVED,
  LeaveStatus.PENDING,
];

const dayWord = (count: number) => (count === 1 ? 'day' : 'days');

function daysInYear(
  leaves: readonly LeaveRecord[],
  year: number,
  types: readonly LeaveType[],
  statuses: readonly LeaveStatus[],
  policy: LeavePolicy,
) {
  let total = 0;

  for (const leave of leaves) {
    if (!types.includes(leave.type) || !statuses.includes(leave.status))
      continue;
    total += workingDaysByYear(leave, policy).get(year) ?? 0;
  }

  return total;
}

export function tierFor(
  joinDate: Date,
  year: number,
  policy: LeavePolicy,
): LeaveTier | null {
  if (joinDate.getUTCFullYear() > year) return null;

  const years = completedYears(joinDate, new Date(Date.UTC(year, 11, 31)));
  if (years >= policy.seniorAfterYears) return 'senior';

  return years >= 1 ? 'standard' : 'first-year';
}

export function entitlementFor(tier: LeaveTier | null, policy: LeavePolicy) {
  switch (tier) {
    case 'senior':
      return policy.annualSenior;
    case 'standard':
      return policy.annualStandard;
    case 'first-year':
      return policy.annualFirstYear;
    default:
      return 0;
  }
}

export function computeBalance({
  joinDate,
  year,
  leaves,
  policy,
}: BalanceInput): LeaveBalance {
  const tier = tierFor(joinDate, year, policy);
  const entitlement = entitlementFor(tier, policy);
  const taken = daysInYear(leaves, year, DEDUCTED_TYPES, APPROVED_ONLY, policy);
  const pending = daysInYear(
    leaves,
    year,
    DEDUCTED_TYPES,
    PENDING_ONLY,
    policy,
  );
  const casualTaken = daysInYear(
    leaves,
    year,
    CASUAL_ONLY,
    APPROVED_ONLY,
    policy,
  );
  const casualPending = daysInYear(
    leaves,
    year,
    CASUAL_ONLY,
    PENDING_ONLY,
    policy,
  );

  return {
    year,
    tier,
    entitlement,
    taken,
    pending,
    remaining: entitlement - taken - pending,
    casual: {
      limit: policy.casualPerYear,
      taken: casualTaken,
      pending: casualPending,
      remaining: policy.casualPerYear - casualTaken - casualPending,
    },
    sickTaken: daysInYear(leaves, year, SICK_ONLY, APPROVED_ONLY, policy),
    annualAvailableFrom: addMonthsUtc(
      joinDate,
      policy.annualWaitingMonths,
    ).toISOString(),
  };
}

export function findBookingProblem(
  request: LeaveRequestInput,
  { joinDate, existing, policy }: BookingContext,
): string | null {
  const daysByYear = workingDaysByYear(request, policy);
  const totalDays = [...daysByYear.values()].reduce(
    (sum, days) => sum + days,
    0,
  );

  if (totalDays === 0) return 'The selected dates contain no working days';

  const booked = existing.filter((leave) => BOOKED.includes(leave.status));
  if (booked.some((leave) => rangesOverlap(leave, request))) {
    return 'These dates overlap with another leave request';
  }

  if (request.type === LeaveType.ANNUAL) {
    const availableFrom = addMonthsUtc(joinDate, policy.annualWaitingMonths);
    if (request.startDate.getTime() < availableFrom.getTime()) {
      return `Annual leave becomes available after ${policy.annualWaitingMonths} months of service (from ${availableFrom.toISOString().slice(0, 10)})`;
    }
  }

  if (
    request.type === LeaveType.CASUAL &&
    totalDays > policy.casualMaxPerRequest
  ) {
    return `Casual leave is limited to ${policy.casualMaxPerRequest} working days per request`;
  }

  if (request.type === LeaveType.SICK) return null;

  for (const [year, days] of daysByYear) {
    const balance = computeBalance({ joinDate, year, leaves: booked, policy });

    if (days > balance.remaining) {
      return `Not enough leave balance in ${year}: requested ${days} working ${dayWord(days)}, ${Math.max(0, balance.remaining)} available`;
    }
    if (request.type === LeaveType.CASUAL && days > balance.casual.remaining) {
      return `Casual leave limit reached for ${year}: ${Math.max(0, balance.casual.remaining)} of ${balance.casual.limit} days left`;
    }
  }

  return null;
}
