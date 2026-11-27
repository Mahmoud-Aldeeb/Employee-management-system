import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EmployeesModule } from '../employees/employees.module.js';
import { InngestModule } from '../inngest/inngest.module.js';
import { WorkplacesModule } from '../workplaces/workplaces.module.js';
import { AttendanceController } from './attendance.controller.js';
import { AttendanceService } from './attendance.service.js';
import { AttendanceLocationService } from './location/attendance-location.service.js';
import { Attendance, AttendanceSchema } from './schemas/attendance.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Attendance.name, schema: AttendanceSchema },
    ]),
    EmployeesModule,
    InngestModule,
    WorkplacesModule,
  ],
  controllers: [AttendanceController],
  providers: [AttendanceService, AttendanceLocationService],
})
export class AttendanceModule {}
