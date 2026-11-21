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
  days?: number;
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

export interface PendingLeaveItem {
  id: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  employeeName: string;
  department: string | null;
  days: number;
}

export interface WhosOutItem {
  id: string;
  employeeName: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
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

export interface AdminDashboardData {
  role: "ADMIN";
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

export interface UpcomingLeave {
  type: LeaveType;
  startDate: string;
  endDate: string;
}

export interface EmployeeDashboardData {
  role: "EMPLOYEE";
  employee: EmployeeSummary;
  salary: SalarySummary;
  latestPayslip: Payslip | null;
  currentMonthAttendance: number;
  lateThisMonth: number;
  pendingLeaves: number;
  todayRecord: AttendanceRecord | null;
  leaveBalance: LeaveBalance;
  upcomingLeave: UpcomingLeave | null;
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

export interface SalarySummary {
  basicSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  updatedAt: string | null;
}

export type EmployeeSummary = Omit<
  Employee,
  "basicSalary" | "allowances" | "deductions"
>;

export type LeaveTier = "first-year" | "standard" | "senior";

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
