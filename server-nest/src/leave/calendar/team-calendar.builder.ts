import { LeaveStatus } from '../../common/enums/leave-status.enum.js';
import type { LeaveType } from '../../common/enums/leave-type.enum.js';
import type { LeavePolicy } from '../policy/leave-policy.js';
import type {
  TeamCalendar,
  TeamCalendarDay,
  TeamCalendarEntry,
  TeamCalendarSummary,
} from './team-calendar.types.js';

const DAY_MS = 86_400_000;
const MONTH_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])$/;

export interface CalendarLeave {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string | null;
  type: LeaveType;
  status: LeaveStatus;
  startDate: Date;
  endDate: Date;
}

export interface CalendarViewer {
  isAdmin: boolean;
  employeeId: string | null;
}

interface BuildInput {
  month: string;
  today: Date;
  leaves: readonly CalendarLeave[];
  viewer: CalendarViewer;
  policy: LeavePolicy;
}

export function currentMonthKey(today: Date) {
  return today.toISOString().slice(0, 7);
}

export function monthRange(month: string) {
  const match = MONTH_PATTERN.exec(month);
  if (!match) throw new Error(`Invalid month: ${month}`);

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;

  return {
    start: new Date(Date.UTC(year, monthIndex, 1)),
    end: new Date(Date.UTC(year, monthIndex + 1, 0)),
  };
}

export function shiftMonth(month: string, delta: number) {
  const { start } = monthRange(month);
  const shifted = new Date(
    Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + delta, 1),
  );

  return shifted.toISOString().slice(0, 7);
}

function canSee(leave: CalendarLeave, viewer: CalendarViewer) {
  if (leave.status === LeaveStatus.REJECTED) return false;
  if (viewer.isAdmin) return true;

  return (
    leave.status === LeaveStatus.APPROVED ||
    leave.employeeId === viewer.employeeId
  );
}

function toEntry(
  leave: CalendarLeave,
  viewer: CalendarViewer,
): TeamCalendarEntry {
  const isMine =
    viewer.employeeId !== null && leave.employeeId === viewer.employeeId;

  return {
    leaveId: leave.id,
    employeeId: leave.employeeId,
    employeeName: leave.employeeName,
    department: leave.department,
    status: leave.status,
    type: viewer.isAdmin || isMine ? leave.type : null,
    isMine,
  };
}

function covers(leave: CalendarLeave, day: Date) {
  return (
    leave.startDate.getTime() <= day.getTime() &&
    day.getTime() <= leave.endDate.getTime()
  );
}

function summarize(
  leaves: readonly CalendarLeave[],
  days: readonly TeamCalendarDay[],
): TeamCalendarSummary {
  return {
    employeesOut: new Set(leaves.map((leave) => leave.employeeId)).size,
    outToday: days.find((day) => day.isToday)?.entries.length ?? 0,
    pendingLeaves: leaves.filter(
      (leave) => leave.status === LeaveStatus.PENDING,
    ).length,
  };
}

export function buildTeamCalendar({
  month,
  today,
  leaves,
  viewer,
  policy,
}: BuildInput): TeamCalendar {
  const { start, end } = monthRange(month);
  const dayCount = Math.round((end.getTime() - start.getTime()) / DAY_MS) + 1;

  const visible = leaves.filter(
    (leave) =>
      canSee(leave, viewer) &&
      leave.startDate.getTime() <= end.getTime() &&
      leave.endDate.getTime() >= start.getTime(),
  );

  const days: TeamCalendarDay[] = Array.from(
    { length: dayCount },
    (_, index) => {
      const day = new Date(start.getTime() + index * DAY_MS);

      return {
        date: day.toISOString().slice(0, 10),
        isWeekend: policy.weekendDays.includes(day.getUTCDay()),
        isToday: day.getTime() === today.getTime(),
        entries: visible
          .filter((leave) => covers(leave, day))
          .map((leave) => toEntry(leave, viewer))
          .sort((a, b) => a.employeeName.localeCompare(b.employeeName)),
      };
    },
  );

  return {
    month,
    previousMonth: shiftMonth(month, -1),
    nextMonth: shiftMonth(month, 1),
    days,
    summary: summarize(visible, days),
  };
}
