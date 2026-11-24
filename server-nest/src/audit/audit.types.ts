import type { Types } from 'mongoose';
import type { JwtPayload } from '../auth/strategies/jwt.strategy.js';

export enum AuditAction {
  EMPLOYEE_CREATED = 'EMPLOYEE_CREATED',
  EMPLOYEE_UPDATED = 'EMPLOYEE_UPDATED',
  EMPLOYEE_DEACTIVATED = 'EMPLOYEE_DEACTIVATED',
  EMPLOYEE_PASSWORD_RESET = 'EMPLOYEE_PASSWORD_RESET',
  SALARY_UPDATED = 'SALARY_UPDATED',
  LEAVE_APPROVED = 'LEAVE_APPROVED',
  LEAVE_REJECTED = 'LEAVE_REJECTED',
  LEAVE_REOPENED = 'LEAVE_REOPENED',
  PAYSLIP_CREATED = 'PAYSLIP_CREATED',
  ADMIN_LOGIN = 'ADMIN_LOGIN',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
}

export interface AuditChange {
  field: string;
  from: unknown;
  to: unknown;
}

export interface AuditEvent {
  action: AuditAction;
  actor: JwtPayload;
  targetId?: string | Types.ObjectId;
  targetLabel?: string;
  changes?: AuditChange[];
}
