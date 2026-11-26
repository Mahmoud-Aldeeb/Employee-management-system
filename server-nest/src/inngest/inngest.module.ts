import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Attendance,
  AttendanceSchema,
} from '../attendance/schemas/attendance.schema.js';
import { PasswordTokensModule } from '../auth/password-tokens/password-tokens.module.js';
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
import { NotificationsModule } from '../notifications/notifications.module.js';
import { UsersModule } from '../users/users.module.js';
import { AccountFunctions } from './account-functions.service.js';
import { InngestClientModule } from './inngest-client.module.js';
import { InngestFunctionsService } from './inngest-functions.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Employee.name, schema: EmployeeSchema },
      { name: Attendance.name, schema: AttendanceSchema },
      { name: LeaveApplication.name, schema: LeaveApplicationSchema },
    ]),
    InngestClientModule,
    MailModule,
    DemoModule,
    NotificationsModule,
    PasswordTokensModule,
    UsersModule,
  ],
  providers: [InngestFunctionsService, AccountFunctions],
  exports: [InngestClientModule, InngestFunctionsService],
})
export class InngestModule {}
