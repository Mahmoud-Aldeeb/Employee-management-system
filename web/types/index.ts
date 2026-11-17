export type Role = "ADMIN" | "EMPLOYEE";
export type PortalRole = "admin" | "employee";
export type EmploymentStatus = "ACTIVE" | "INACTIVE";
export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE";
export type DayType =
  | "Full Day"
  | "Three Quarter Day"
  | "Half Day"
  | "Short Day";
export type LeaveType = "SICK" | "CASUAL" | "ANNUAL";
export type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface SessionUser {
  id: string;
  email: string;
  role: Role;
}

export interface Employee {
  _id: string;
  id?: string;
  userId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  department?: string;
  basicSalary: number;
  allowances: number;
  deductions: number;
  employmentStatus: EmploymentStatus;
  joinDate: string;
  isDeleted: boolean;
  bio: string;
  user?: { email: string; role: Role } | null;
}

export type Profile = Pick<Employee, "firstName" | "lastName" | "email"> &
  Partial<Employee>;

export interface AttendanceRecord {
  _id: string;
  employeeId: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: AttendanceStatus;
  workingHours: number | null;
  dayType: DayType | null;
}

export interface LeaveApplication {
  _id: string;
  id?: string;
  employeeId: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveStatus;
  employee?: Employee | null;
  createdAt: string;
}

export interface Payslip {
  _id: string;
  id?: string;
  employeeId: string;
  month: number;
  year: number;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  employee?: Employee | null;
  createdAt: string;
}

export interface AdminDashboardData {
  role: "ADMIN";
  totalEmployees: number;
  totalDepartments: number;
  todayAttendance: number;
  pendingLeaves: number;
}

export interface EmployeeDashboardData {
  role: "EMPLOYEE";
  employee: Employee;
  currentMonthAttendance: number;
  pendingLeaves: number;
  latestPayslip: Payslip | null;
}

export type DashboardData = AdminDashboardData | EmployeeDashboardData;

export interface AttendanceResponse {
  data: AttendanceRecord[];
  employee: { isDeleted: boolean };
}

export interface LeavesResponse {
  data: LeaveApplication[];
  employee?: Employee;
}

export interface AnalyticsData {
  monthlyAttendance: {
    date: string;
    count: number;
    avgWorkingHours: number;
    lateCount: number;
  }[];
  leaveStats: Record<LeaveStatus, number>;
  weeklyHours: { week: string; avgHours: number; days: number }[];
  departmentAttendance: { department: string; count: number }[];
  leaveTypeBreakdown: { type: string; count: number }[];
  summary: {
    totalActiveEmployees: number;
    todayAttendanceCount: number;
    attendanceRate: number;
  };
}
