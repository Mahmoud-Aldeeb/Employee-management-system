import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from '../users/users.module.js';
import { EmployeesController } from './employees.controller.js';
import { EmployeesService } from './employees.service.js';
import { Employee, EmployeeSchema } from './schemas/employee.schema.js';
import { SalariesModule } from '../salaries/salaries.module.js';
import { SessionsModule } from '../sessions/sessions.module.js';
import { AuditModule } from '../audit/audit.module.js';
import { InngestClientModule } from '../inngest/inngest-client.module.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Employee.name, schema: EmployeeSchema },
    ]),
    UsersModule,
    SalariesModule,
    SessionsModule,
    AuditModule,
    InngestClientModule,
  ],
  controllers: [EmployeesController],
  providers: [EmployeesService],
  exports: [EmployeesService],
})
export class EmployeesModule {}
