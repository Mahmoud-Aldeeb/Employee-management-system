import { Module } from '@nestjs/common';
import { EmployeesModule } from '../employees/employees.module.js';
import { ProfileController } from './profile.controller.js';

@Module({
  imports: [EmployeesModule],
  controllers: [ProfileController],
})
export class ProfileModule {}
