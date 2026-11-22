import type { LeaveStatus } from '../../common/enums/leave-status.enum.js';
import type { LeaveType } from '../../common/enums/leave-type.enum.js';

export interface TeamCalendarEntry {
  leaveId: string;
  employeeId: string;
  employeeName: string;
  department: string | null;
  status: LeaveStatus;
  type: LeaveType | null;
  isMine: boolean;
}

export interface TeamCalendarDay {
  date: string;
  isWeekend: boolean;
  isToday: boolean;
  entries: TeamCalendarEntry[];
}

export interface TeamCalendarSummary {
  employeesOut: number;
  outToday: number;
  pendingLeaves: number;
}

export interface TeamCalendar {
  month: string;
  previousMonth: string;
  nextMonth: string;
  days: TeamCalendarDay[];
  summary: TeamCalendarSummary;
}
