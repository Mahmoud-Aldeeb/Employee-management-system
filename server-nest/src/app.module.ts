import { AuditModule } from './audit/audit.module.js';

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { envValidation } from './config/env.validation.js';
import { UsersModule } from './users/users.module.js';
import { AuthModule } from './auth/auth.module.js';
import { EmployeesModule } from './employees/employees.module.js';
import { ProfileModule } from './profile/profile.module.js';
import { AttendanceModule } from './attendance/attendance.module.js';
import { DashboardModule } from './dashboard/dashboard.module.js';
import { LeaveModule } from './leave/leave.module.js';
import { PayslipsModule } from './payslips/payslips.module.js';
import { AnalyticsModule } from './analytics/analytics.module.js';
import { DemoModule } from './demo/demo.module.js';
import { HealthModule } from './health/health.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidation,
      ignoreEnvFile: process.env.NODE_ENV === 'test',
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.getOrThrow<string>('MONGODB_URL'),
      }),
    }),

    UsersModule,
    AuthModule,
    EmployeesModule,
    ProfileModule,
    AttendanceModule,
    DashboardModule,
    LeaveModule,
    PayslipsModule,
    AnalyticsModule,
    DemoModule,
    HealthModule,
    AuditModule,
  ],
})
export class AppModule {}
