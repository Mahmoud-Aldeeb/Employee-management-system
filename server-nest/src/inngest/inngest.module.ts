import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Attendance,
  AttendanceSchema,
} from '../attendance/schemas/attendance.schema.js';
import { DemoModule } from '../demo/demo.module.js';
import {
  Employee,
  EmployeeSchema,
} from '../employees/schemas/employee.schema.js';
import {
  LeaveApplication,
  LeaveApplicationSchema,
} from '../leave/schemas/leave-application.schema.js';
import { MailModule } from '../mail/mail.module.js';
import { InngestFunctionsService } from './inngest-functions.service.js';
import { InngestService } from './inngest.service.js';
import { NotificationsModule } from '../notifications/notifications.module.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Employee.name, schema: EmployeeSchema },
      { name: Attendance.name, schema: AttendanceSchema },
      { name: LeaveApplication.name, schema: LeaveApplicationSchema },
    ]),
    MailModule,
    DemoModule,
    NotificationsModule,
  ],
  providers: [InngestService, InngestFunctionsService],
  exports: [InngestService, InngestFunctionsService],
})
export class InngestModule {}
