import type { LeaveType } from '../common/enums/leave-type.enum.js';
import type {
  AttendanceTrendDay,
  DepartmentCount,
  PendingLeaveItem,
  WhosOutItem,
} from './dashboard.types.js';

export const DAY_MS = 86_400_000;

export interface TrendRow {
  _id: string;
  checkedIn: number;
  late: number;
}

export interface EmployeeRef {
  firstName: string;
  lastName: string;
  department?: string;
}

export interface LeaveRow {
  _id: unknown;
  type: LeaveType;
  startDate: Date;
  endDate: Date;
  reason: string;
  employeeId: EmployeeRef | null;
}

export function fullName(
  person: { firstName: string; lastName: string } | null | undefined,
) {
  return person ? `${person.firstName} ${person.lastName}` : 'Unknown employee';
}

export function buildAttendanceTrend(
  rows: TrendRow[],
  today: Date,
  days: number,
): AttendanceTrendDay[] {
  const byDate = new Map(rows.map((row) => [row._id, row]));

  return Array.from({ length: days }, (_, index) => {
    const date = new Date(today.getTime() - (days - 1 - index) * DAY_MS)
      .toISOString()
      .slice(0, 10);
    const row = byDate.get(date);

    return { date, checkedIn: row?.checkedIn ?? 0, late: row?.late ?? 0 };
  });
}

export function countByDepartment(
  employees: Array<{ department?: string | null }>,
): DepartmentCount[] {
  const counts = new Map<string, number>();

  for (const employee of employees) {
    const name = employee.department || 'Unassigned';
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([department, count]) => ({ department, count }))
    .sort(
      (a, b) => b.count - a.count || a.department.localeCompare(b.department),
    );
}

export function sumNetSalaries(
  salaries: Array<{
    basicSalary: number;
    allowances: number;
    deductions: number;
  }>,
) {
  return salaries.reduce(
    (total, salary) =>
      total + salary.basicSalary + salary.allowances - salary.deductions,
    0,
  );
}

export function inclusiveDays(start: Date, end: Date) {
  return Math.round((end.getTime() - start.getTime()) / DAY_MS) + 1;
}

export function toPendingItem(leave: LeaveRow): PendingLeaveItem {
  return {
    id: String(leave._id),
    type: leave.type,
    startDate: leave.startDate,
    endDate: leave.endDate,
    reason: leave.reason,
    employeeName: fullName(leave.employeeId),
    department: leave.employeeId?.department ?? null,
  };
}

export function toWhosOutItem(leave: LeaveRow): WhosOutItem {
  return {
    id: String(leave._id),
    employeeName: fullName(leave.employeeId),
    type: leave.type,
    startDate: leave.startDate,
    endDate: leave.endDate,
  };
}
