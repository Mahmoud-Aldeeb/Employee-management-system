import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Attendance,
  AttendanceSchema,
} from '../attendance/schemas/attendance.schema.js';
import {
  Employee,
  EmployeeSchema,
} from '../employees/schemas/employee.schema.js';
import {
  LeaveApplication,
  LeaveApplicationSchema,
} from '../leave/schemas/leave-application.schema.js';
import { Payslip, PayslipSchema } from '../payslips/schemas/payslip.schema.js';
import { SalariesModule } from '../salaries/salaries.module.js';
import { Salary, SalarySchema } from '../salaries/schemas/salary.schema.js';
import { AdminDashboardService } from './admin-dashboard.service.js';
import { DashboardController } from './dashboard.controller.js';
import { DashboardService } from './dashboard.service.js';
import { EmployeeDashboardService } from './employee-dashboard.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Employee.name, schema: EmployeeSchema },
      { name: Attendance.name, schema: AttendanceSchema },
      { name: LeaveApplication.name, schema: LeaveApplicationSchema },
      { name: Payslip.name, schema: PayslipSchema },
      { name: Salary.name, schema: SalarySchema },
    ]),
    SalariesModule,
  ],
  controllers: [DashboardController],
  providers: [
    DashboardService,
    AdminDashboardService,
    EmployeeDashboardService,
  ],
})
export class DashboardModule {}
