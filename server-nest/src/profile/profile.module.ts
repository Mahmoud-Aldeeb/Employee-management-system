import { Module } from '@nestjs/common';
import { EmployeesModule } from '../employees/employees.module.js';
import { ProfileController } from './profile.controller.js';
import { SalariesModule } from '../salaries/salaries.module.js';

@Module({
  imports: [EmployeesModule, SalariesModule],
  controllers: [ProfileController],
})
export class ProfileModule {}
