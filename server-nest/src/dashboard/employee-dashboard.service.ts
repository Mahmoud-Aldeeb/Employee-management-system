import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { Attendance } from '../attendance/schemas/attendance.schema.js';
import { AttendanceStatus } from '../common/enums/attendance-status.enum.js';
import { LeaveStatus } from '../common/enums/leave-status.enum.js';
import { Role } from '../common/enums/role.enum.js';
import { cairoDay, cairoMonthRange } from '../common/utils/cairo-time.js';
import { Employee } from '../employees/schemas/employee.schema.js';
import { LeaveBalanceService } from '../leave/leave-balance.service.js';
import { LeaveApplication } from '../leave/schemas/leave-application.schema.js';
import { Payslip } from '../payslips/schemas/payslip.schema.js';
import { SalariesService } from '../salaries/salaries.service.js';

@Injectable()
export class EmployeeDashboardService {
  constructor(
    @InjectModel(Employee.name) private readonly employeeModel: Model<Employee>,
    @InjectModel(Attendance.name)
    private readonly attendanceModel: Model<Attendance>,
    @InjectModel(LeaveApplication.name)
    private readonly leaveModel: Model<LeaveApplication>,
    @InjectModel(Payslip.name) private readonly payslipModel: Model<Payslip>,
    private readonly salaries: SalariesService,
    private readonly leaveBalances: LeaveBalanceService,
  ) {}

  async getDashboard(userId: string) {
    const employee = await this.employeeModel.findOne({ userId }).lean().exec();
    if (!employee) throw new NotFoundException('Employee not found');

    const today = cairoDay();
    const { start: monthStart, end: monthEnd } = cairoMonthRange();

    const [
      monthRecords,
      todayRecord,
      pendingLeaves,
      upcomingLeave,
      payslip,
      salary,
      leaveBalance,
    ] = await Promise.all([
      this.attendanceModel
        .find({
          employeeId: employee._id,
          date: { $gte: monthStart, $lt: monthEnd },
        })
        .select('status')
        .lean()
        .exec(),
      this.attendanceModel
        .findOne({ employeeId: employee._id, date: today })
        .lean()
        .exec(),
      this.leaveModel.countDocuments({
        employeeId: employee._id,
        status: LeaveStatus.PENDING,
      }),
      this.leaveModel
        .findOne({
          employeeId: employee._id,
          status: LeaveStatus.APPROVED,
          endDate: { $gte: today },
        })
        .sort({ startDate: 1 })
        .select('type startDate endDate')
        .lean()
        .exec(),
      this.payslipModel
        .findOne({ employeeId: employee._id })
        .sort({ createdAt: -1 })
        .lean()
        .exec(),
      this.salaries.getForEmployee(employee._id),
      this.leaveBalances.getBalance(employee),
    ]);

    return {
      role: Role.EMPLOYEE,
      employee: { ...employee, id: String(employee._id) },
      salary,
      latestPayslip: payslip ? { ...payslip, id: String(payslip._id) } : null,
      currentMonthAttendance: monthRecords.length,
      lateThisMonth: monthRecords.filter(
        (record) => record.status === AttendanceStatus.LATE,
      ).length,
      pendingLeaves,
      todayRecord,
      leaveBalance,
      upcomingLeave: upcomingLeave
        ? {
            type: upcomingLeave.type,
            startDate: upcomingLeave.startDate,
            endDate: upcomingLeave.endDate,
          }
        : null,
    };
  }
}
