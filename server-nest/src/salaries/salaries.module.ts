import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SalariesService } from './salaries.service.js';
import { Salary, SalarySchema } from './schemas/salary.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Salary.name, schema: SalarySchema }]),
  ],
  providers: [SalariesService],
  exports: [SalariesService],
})
export class SalariesModule {}
