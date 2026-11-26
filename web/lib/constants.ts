import type { AuditAction, LeaveType } from "@/types";

export const DEPARTMENTS = [
  "Engineering",
  "Human Resources",
  "Marketing",
  "Sales",
  "Finance",
  "Operations",
  "IT Support",
  "Customer Success",
  "Product Management",
  "Design",
] as const;

export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  SICK: "Sick leave",
  CASUAL: "Casual leave",
  ANNUAL: "Annual leave",
};

export type AuditTone = "success" | "warning" | "danger" | "info" | "neutral";

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  EMPLOYEE_CREATED: "Employee created",
  EMPLOYEE_UPDATED: "Employee updated",
  EMPLOYEE_DEACTIVATED: "Employee deactivated",
  EMPLOYEE_PASSWORD_RESET: "Password reset",
  SALARY_UPDATED: "Salary updated",
  LEAVE_APPROVED: "Leave approved",
  LEAVE_REJECTED: "Leave rejected",
  LEAVE_REOPENED: "Leave reopened",
  PAYSLIP_CREATED: "Payslip created",
  ADMIN_LOGIN: "Admin sign-in",
  PASSWORD_CHANGED: "Password changed",
  EMPLOYEE_INVITED: "Invitation sent",
};

export const AUDIT_ACTION_TONES: Record<AuditAction, AuditTone> = {
  EMPLOYEE_CREATED: "success",
  EMPLOYEE_UPDATED: "info",
  EMPLOYEE_DEACTIVATED: "danger",
  EMPLOYEE_PASSWORD_RESET: "warning",
  SALARY_UPDATED: "info",
  LEAVE_APPROVED: "success",
  LEAVE_REJECTED: "danger",
  LEAVE_REOPENED: "warning",
  PAYSLIP_CREATED: "info",
  ADMIN_LOGIN: "neutral",
  PASSWORD_CHANGED: "warning",
  EMPLOYEE_INVITED: "info",
};

export const AUDIT_ACTIONS = Object.keys(AUDIT_ACTION_LABELS) as AuditAction[];

export const AUDIT_FIELD_LABELS: Record<string, string> = {
  firstName: "First name",
  lastName: "Last name",
  email: "Email",
  phone: "Phone",
  position: "Position",
  department: "Department",
  joinDate: "Join date",
  employmentStatus: "Employment status",
  role: "Role",
  basicSalary: "Basic salary",
  allowances: "Allowances",
  deductions: "Deductions",
  netSalary: "Net salary",
  month: "Month",
  year: "Year",
  status: "Status",
};
