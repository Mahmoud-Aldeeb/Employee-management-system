import type { LeavePolicy } from './leave-policy.js';

const DAY_MS = 86_400_000;

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export function startOfUtcDay(date: Date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

export function isWorkday(day: Date, policy: LeavePolicy) {
  return !policy.weekendDays.includes(day.getUTCDay());
}

export function workingDaysByYear(range: DateRange, policy: LeavePolicy) {
  const byYear = new Map<number, number>();

  for (
    let time = range.startDate.getTime();
    time <= range.endDate.getTime();
    time += DAY_MS
  ) {
    const day = new Date(time);
    if (!isWorkday(day, policy)) continue;

    const year = day.getUTCFullYear();
    byYear.set(year, (byYear.get(year) ?? 0) + 1);
  }

  return byYear;
}

export function countWorkingDays(range: DateRange, policy: LeavePolicy) {
  let total = 0;
  for (const days of workingDaysByYear(range, policy).values()) total += days;
  return total;
}

export function rangesOverlap(first: DateRange, second: DateRange) {
  return (
    first.startDate.getTime() <= second.endDate.getTime() &&
    second.startDate.getTime() <= first.endDate.getTime()
  );
}

export function addMonthsUtc(date: Date, months: number) {
  const target = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1),
  );
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate();

  target.setUTCDate(Math.min(date.getUTCDate(), lastDay));
  return target;
}

export function completedYears(from: Date, to: Date) {
  const beforeAnniversary =
    to.getUTCMonth() < from.getUTCMonth() ||
    (to.getUTCMonth() === from.getUTCMonth() &&
      to.getUTCDate() < from.getUTCDate());

  return (
    to.getUTCFullYear() - from.getUTCFullYear() - (beforeAnniversary ? 1 : 0)
  );
}
