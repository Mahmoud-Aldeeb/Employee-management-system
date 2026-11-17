import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { Attendance } from '../attendance/schemas/attendance.schema.js';
import { AttendanceStatus } from '../common/enums/attendance-status.enum.js';
import { LeaveStatus } from '../common/enums/leave-status.enum.js';
import { cairoDay, cairoMonthRange } from '../common/utils/cairo-time.js';
import { Employee } from '../employees/schemas/employee.schema.js';
import { LeaveApplication } from '../leave/schemas/leave-application.schema.js';

const DAY_MS = 24 * 60 * 60 * 1000;

interface DailyRow {
  _id: string;
  count: number;
  avgWorkingHours: number | null;
  lateCount: number;
}

interface WeeklyRow {
  _id: number;
  year: number;
  avgHours: number | null;
  totalDays: number;
}

interface CountRow {
  _id: string;
  count: number;
}

interface DepartmentRow {
  _id: string | null;
  attendanceCount: number;
}

const round1 = (value: number | null | undefined) =>
  Number((value ?? 0).toFixed(1));

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(Attendance.name)
    private readonly attendanceModel: Model<Attendance>,
    @InjectModel(LeaveApplication.name)
    private readonly leaveModel: Model<LeaveApplication>,
    @InjectModel(Employee.name) private readonly employeeModel: Model<Employee>,
  ) {}

  async getAnalytics() {
    const today = cairoDay();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * DAY_MS);
    const { start: monthStart } = cairoMonthRange();

    const [
      monthlyAttendance,
      leaveBreakdown,
      weeklyHours,
      departmentAttendance,
      leaveTypeBreakdown,
      totalActive,
      todayAttendance,
    ] = await Promise.all([
      this.attendanceModel
        .aggregate<DailyRow>([
          { $match: { date: { $gte: thirtyDaysAgo } } },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
              count: { $sum: 1 },
              avgWorkingHours: { $avg: '$workingHours' },
              lateCount: {
                $sum: {
                  $cond: [{ $eq: ['$status', AttendanceStatus.LATE] }, 1, 0],
                },
              },
            },
          },
          { $sort: { _id: 1 } },
        ])
        .exec(),
      this.leaveModel
        .aggregate<CountRow>([
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ])
        .exec(),
      this.attendanceModel
        .aggregate<WeeklyRow>([
          {
            $match: { workingHours: { $gt: 0 }, date: { $gte: thirtyDaysAgo } },
          },
          {
            $group: {
              _id: { $isoWeek: '$date' },
              year: { $first: { $isoWeekYear: '$date' } },
              avgHours: { $avg: '$workingHours' },
              totalDays: { $sum: 1 },
            },
          },
          { $sort: { year: 1, _id: 1 } },
          { $limit: 8 },
        ])
        .exec(),
      this.attendanceModel
        .aggregate<DepartmentRow>([
          { $match: { date: { $gte: monthStart } } },
          {
            $lookup: {
              from: 'employees',
              localField: 'employeeId',
              foreignField: '_id',
              as: 'employee',
            },
          },
          { $unwind: '$employee' },
          {
            $group: {
              _id: '$employee.department',
              attendanceCount: { $sum: 1 },
            },
          },
          { $sort: { attendanceCount: -1 } },
          { $limit: 10 },
        ])
        .exec(),
      this.leaveModel
        .aggregate<CountRow>([{ $group: { _id: '$type', count: { $sum: 1 } } }])
        .exec(),
      this.employeeModel.countDocuments({ isDeleted: false }),
      this.attendanceModel.countDocuments({ date: today }),
    ]);

    const leaveStats: Record<LeaveStatus, number> = {
      [LeaveStatus.PENDING]: 0,
      [LeaveStatus.APPROVED]: 0,
      [LeaveStatus.REJECTED]: 0,
    };
    for (const row of leaveBreakdown) {
      if (row._id in leaveStats) leaveStats[row._id as LeaveStatus] = row.count;
    }

    return {
      success: true,
      data: {
        monthlyAttendance: monthlyAttendance.map((row) => ({
          date: row._id,
          count: row.count,
          avgWorkingHours: round1(row.avgWorkingHours),
          lateCount: row.lateCount,
        })),
        leaveStats,
        weeklyHours: weeklyHours.map((row) => ({
          week: `Wk ${row._id}`,
          avgHours: round1(row.avgHours),
          days: row.totalDays,
        })),
        departmentAttendance: departmentAttendance.map((row) => ({
          department: row._id || 'Unknown',
          count: row.attendanceCount,
        })),
        leaveTypeBreakdown: leaveTypeBreakdown.map((row) => ({
          type: row._id,
          count: row.count,
        })),
        summary: {
          totalActiveEmployees: totalActive,
          todayAttendanceCount: todayAttendance,
          attendanceRate:
            totalActive > 0
              ? Math.round((todayAttendance / totalActive) * 100)
              : 0,
        },
      },
    };
  }
}
