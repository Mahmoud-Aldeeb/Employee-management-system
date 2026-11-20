import { Injectable } from '@nestjs/common';
import type { JwtPayload } from '../auth/strategies/jwt.strategy.js';
import { Role } from '../common/enums/role.enum.js';
import { AdminDashboardService } from './admin-dashboard.service.js';
import { EmployeeDashboardService } from './employee-dashboard.service.js';

@Injectable()
export class DashboardService {
  constructor(
    private readonly admin: AdminDashboardService,
    private readonly employee: EmployeeDashboardService,
  ) {}

  getDashboard(user: JwtPayload) {
    return user.role === Role.ADMIN
      ? this.admin.getDashboard()
      : this.employee.getDashboard(user.id);
  }
}
