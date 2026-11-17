import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EmployeesModule } from '../employees/employees.module.js';
import { PayslipsController } from './payslips.controller.js';
import { PayslipsService } from './payslips.service.js';
import { Payslip, PayslipSchema } from './schemas/payslip.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Payslip.name, schema: PayslipSchema }]),
    EmployeesModule,
  ],
  controllers: [PayslipsController],
  providers: [PayslipsService],
})
export class PayslipsModule {}
