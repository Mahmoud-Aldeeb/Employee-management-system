import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Attendance,
  AttendanceSchema,
} from '../attendance/schemas/attendance.schema.js';
import { AuthModule } from '../auth/auth.module.js';
import {
  Employee,
  EmployeeSchema,
} from '../employees/schemas/employee.schema.js';
import {
  LeaveApplication,
  LeaveApplicationSchema,
} from '../leave/schemas/leave-application.schema.js';
import { Payslip, PayslipSchema } from '../payslips/schemas/payslip.schema.js';
import { Salary, SalarySchema } from '../salaries/schemas/salary.schema.js';
import {
  AuthSession,
  AuthSessionSchema,
} from '../sessions/schemas/auth-session.schema.js';
import { User, UserSchema } from '../users/schemas/user.schema.js';
import { UsersModule } from '../users/users.module.js';
import { DemoDataStore } from './demo-data.store.js';
import { DemoModeGuard } from './demo-mode.guard.js';
import { DemoController } from './demo.controller.js';
import { DemoService } from './demo.service.js';
import { AuditModule } from '../audit/audit.module.js';
import { AuditLog, AuditLogSchema } from '../audit/schemas/audit-log.schema.js';
import {
  Notification,
  NotificationSchema,
} from '../notifications/schemas/notification.schema.js';
import {
  Workplace,
  WorkplaceSchema,
} from '../workplaces/schemas/workplace.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Employee.name, schema: EmployeeSchema },
      { name: Salary.name, schema: SalarySchema },
      { name: Attendance.name, schema: AttendanceSchema },
      { name: LeaveApplication.name, schema: LeaveApplicationSchema },
      { name: Payslip.name, schema: PayslipSchema },
      { name: AuthSession.name, schema: AuthSessionSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
      { name: Notification.name, schema: NotificationSchema },
      { name: Workplace.name, schema: WorkplaceSchema },
    ]),
    UsersModule,
    AuthModule,
    AuditModule,
  ],
  controllers: [DemoController],
  providers: [DemoService, DemoDataStore, DemoModeGuard],
  exports: [DemoService],
})
export class DemoModule {}
