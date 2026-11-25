import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EmployeesModule } from '../employees/employees.module.js';
import { PayslipsController } from './payslips.controller.js';
import { PayslipsService } from './payslips.service.js';
import { Payslip, PayslipSchema } from './schemas/payslip.schema.js';
import { SalariesModule } from '../salaries/salaries.module.js';
import { AuditModule } from '../audit/audit.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Payslip.name, schema: PayslipSchema }]),
    EmployeesModule,
    SalariesModule,
    AuditModule,
    NotificationsModule,
  ],
  controllers: [PayslipsController],
  providers: [PayslipsService],
})
export class PayslipsModule {}
