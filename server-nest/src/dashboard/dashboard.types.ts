import type { LeaveType } from '../common/enums/leave-type.enum.js';
import type { Role } from '../common/enums/role.enum.js';

export interface PendingLeaveItem {
  id: string;
  type: LeaveType;
  startDate: Date;
  endDate: Date;
  reason: string;
  days: number;
  employeeName: string;
  department: string | null;
}

export interface WhosOutItem {
  id: string;
  employeeName: string;
  type: LeaveType;
  startDate: Date;
  endDate: Date;
}

export interface AttendanceTrendDay {
  date: string;
  checkedIn: number;
  late: number;
}

export interface DepartmentCount {
  department: string;
  count: number;
}

export interface AdminDashboard {
  role: Role.ADMIN;
  totalEmployees: number;
  totalDepartments: number;
  newHiresThisMonth: number;
  todayAttendance: number;
  lateToday: number;
  attendanceRate: number;
  pendingLeaves: number;
  monthlyPayroll: number;
  attendanceTrend: AttendanceTrendDay[];
  departments: DepartmentCount[];
  pendingRequests: PendingLeaveItem[];
  whosOut: WhosOutItem[];
}
