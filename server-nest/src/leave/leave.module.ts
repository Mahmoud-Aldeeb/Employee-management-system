import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EmployeesModule } from '../employees/employees.module.js';
import { InngestModule } from '../inngest/inngest.module.js';
import { LeaveController } from './leave.controller.js';
import { LeaveService } from './leave.service.js';
import {
  LeaveApplication,
  LeaveApplicationSchema,
} from './schemas/leave-application.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LeaveApplication.name, schema: LeaveApplicationSchema },
    ]),
    EmployeesModule,
    InngestModule,
  ],
  controllers: [LeaveController],
  providers: [LeaveService],
})
export class LeaveModule {}
