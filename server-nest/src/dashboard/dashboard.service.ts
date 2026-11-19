import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { Attendance } from '../attendance/schemas/attendance.schema.js';
import type { JwtPayload } from '../auth/strategies/jwt.strategy.js';
import { DEPARTMENTS } from '../common/constants/departments.js';
import { LeaveStatus } from '../common/enums/leave-status.enum.js';
import { Role } from '../common/enums/role.enum.js';
import { cairoDay, cairoMonthRange } from '../common/utils/cairo-time.js';
import { Employee } from '../employees/schemas/employee.schema.js';
import { LeaveApplication } from '../leave/schemas/leave-application.schema.js';
import { Payslip } from '../payslips/schemas/payslip.schema.js';
import { SalariesService } from '../salaries/salaries.service.js';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Employee.name) private readonly employeeModel: Model<Employee>,
    @InjectModel(Attendance.name)
    private readonly attendanceModel: Model<Attendance>,
    @InjectModel(LeaveApplication.name)
    private readonly leaveModel: Model<LeaveApplication>,
    @InjectModel(Payslip.name) private readonly payslipModel: Model<Payslip>,
    private readonly salaries: SalariesService,
  ) {}

  getDashboard(user: JwtPayload) {
    return user.role === Role.ADMIN
      ? this.adminDashboard()
      : this.employeeDashboard(user.id);
  }

  private async adminDashboard() {
    const [totalEmployees, todayAttendance, pendingLeaves] = await Promise.all([
      this.employeeModel.countDocuments({ isDeleted: { $ne: true } }),
      this.attendanceModel.countDocuments({ date: cairoDay() }),
      this.leaveModel.countDocuments({ status: LeaveStatus.PENDING }),
    ]);

    return {
      role: Role.ADMIN,
      totalEmployees,
      totalDepartments: DEPARTMENTS.length,
      todayAttendance,
      pendingLeaves,
    };
  }

  private async employeeDashboard(userId: string) {
    const employee = await this.employeeModel.findOne({ userId }).lean().exec();
    if (!employee) throw new NotFoundException('Employee not found');

    const { start, end } = cairoMonthRange();
    const [currentMonthAttendance, pendingLeaves, latestPayslip, salary] =
      await Promise.all([
        this.attendanceModel.countDocuments({
          employeeId: employee._id,
          date: { $gte: start, $lt: end },
        }),
        this.leaveModel.countDocuments({
          employeeId: employee._id,
          status: LeaveStatus.PENDING,
        }),
        this.payslipModel
          .findOne({ employeeId: employee._id })
          .sort({ createdAt: -1 })
          .lean()
          .exec(),
        this.salaries.getForEmployee(employee._id),
      ]);

    return {
      role: Role.EMPLOYEE,
      employee: { ...employee, id: String(employee._id) },
      currentMonthAttendance,
      pendingLeaves,
      latestPayslip: latestPayslip
        ? { ...latestPayslip, id: String(latestPayslip._id) }
        : null,
      salary,
    };
  }
}
