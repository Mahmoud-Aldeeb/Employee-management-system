import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { Attendance } from '../attendance/schemas/attendance.schema.js';
import { AttendanceStatus } from '../common/enums/attendance-status.enum.js';
import { LeaveStatus } from '../common/enums/leave-status.enum.js';
import { Role } from '../common/enums/role.enum.js';
import { cairoDay, cairoMonthRange } from '../common/utils/cairo-time.js';
import { Employee } from '../employees/schemas/employee.schema.js';
import { LeaveApplication } from '../leave/schemas/leave-application.schema.js';
import { Salary } from '../salaries/schemas/salary.schema.js';
import {
  buildAttendanceTrend,
  countByDepartment,
  DAY_MS,
  sumNetSalaries,
  toPendingItem,
  toWhosOutItem,
  type EmployeeRef,
  type TrendRow,
} from './dashboard.metrics.js';
import type { AdminDashboard } from './dashboard.types.js';
import { LeaveBalanceService } from '../leave/leave-balance.service.js';

const TREND_DAYS = 7;
const PENDING_LIMIT = 5;
const EMPLOYEE_FIELDS = 'firstName lastName department';

@Injectable()
export class AdminDashboardService {
  constructor(
    @InjectModel(Employee.name) private readonly employeeModel: Model<Employee>,
    @InjectModel(Attendance.name)
    private readonly attendanceModel: Model<Attendance>,
    @InjectModel(LeaveApplication.name)
    private readonly leaveModel: Model<LeaveApplication>,
    @InjectModel(Salary.name) private readonly salaryModel: Model<Salary>,
    private readonly leaveBalances: LeaveBalanceService,
  ) {}

  async getDashboard(): Promise<AdminDashboard> {
    const today = cairoDay();
    const { start: monthStart, end: monthEnd } = cairoMonthRange();
    const trendStart = new Date(today.getTime() - (TREND_DAYS - 1) * DAY_MS);

    const [
      employees,
      todayRecords,
      trendRows,
      pendingLeaves,
      pending,
      outToday,
    ] = await Promise.all([
      this.employeeModel
        .find({ isDeleted: { $ne: true } })
        .select('department joinDate')
        .lean()
        .exec(),
      this.attendanceModel.find({ date: today }).select('status').lean().exec(),
      this.attendanceModel
        .aggregate<TrendRow>([
          { $match: { date: { $gte: trendStart, $lte: today } } },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
              checkedIn: { $sum: 1 },
              late: {
                $sum: {
                  $cond: [{ $eq: ['$status', AttendanceStatus.LATE] }, 1, 0],
                },
              },
            },
          },
        ])
        .exec(),
      this.leaveModel.countDocuments({ status: LeaveStatus.PENDING }),
      this.leaveModel
        .find({ status: LeaveStatus.PENDING })
        .sort({ _id: 1 })
        .limit(PENDING_LIMIT)
        .populate<{ employeeId: EmployeeRef | null }>(
          'employeeId',
          EMPLOYEE_FIELDS,
        )
        .lean()
        .exec(),
      this.leaveModel
        .find({
          status: LeaveStatus.APPROVED,
          startDate: { $lte: today },
          endDate: { $gte: today },
        })
        .sort({ startDate: 1 })
        .populate<{ employeeId: EmployeeRef | null }>(
          'employeeId',
          EMPLOYEE_FIELDS,
        )
        .lean()
        .exec(),
    ]);

    const salaries = await this.salaryModel
      .find({ employeeId: { $in: employees.map((employee) => employee._id) } })
      .lean()
      .exec();

    const totalEmployees = employees.length;
    const departments = countByDepartment(employees);
    const newHires = employees.filter(
      (employee) =>
        employee.joinDate.getTime() >= monthStart.getTime() &&
        employee.joinDate.getTime() < monthEnd.getTime(),
    );

    return {
      role: Role.ADMIN,
      totalEmployees,
      totalDepartments: departments.length,
      newHiresThisMonth: newHires.length,
      todayAttendance: todayRecords.length,
      lateToday: todayRecords.filter(
        (record) => record.status === AttendanceStatus.LATE,
      ).length,
      attendanceRate:
        totalEmployees > 0
          ? Math.min(
              100,
              Math.round((todayRecords.length / totalEmployees) * 100),
            )
          : 0,
      pendingLeaves,
      monthlyPayroll: sumNetSalaries(salaries),
      attendanceTrend: buildAttendanceTrend(trendRows, today, TREND_DAYS),
      departments,
      pendingRequests: pending.map((leave) =>
        toPendingItem(leave, this.leaveBalances.workingDays(leave)),
      ),
      whosOut: outToday.map(toWhosOutItem),
    };
  }
}
