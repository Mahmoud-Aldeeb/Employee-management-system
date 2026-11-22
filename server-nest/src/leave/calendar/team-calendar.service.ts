import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model, Types } from 'mongoose';
import type { JwtPayload } from '../../auth/strategies/jwt.strategy.js';
import { LeaveStatus } from '../../common/enums/leave-status.enum.js';
import { Role } from '../../common/enums/role.enum.js';
import { cairoDay } from '../../common/utils/cairo-time.js';
import { EmployeesService } from '../../employees/employees.service.js';
import { TeamCalendarQueryDto } from '../dto/team-calendar-query.dto.js';
import { LEAVE_POLICY, type LeavePolicy } from '../policy/leave-policy.js';
import { LeaveApplication } from '../schemas/leave-application.schema.js';
import {
  buildTeamCalendar,
  currentMonthKey,
  monthRange,
  type CalendarLeave,
  type CalendarViewer,
} from './team-calendar.builder.js';

interface PopulatedEmployee {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  department?: string;
  isDeleted: boolean;
}

interface VisibilityClause {
  status: LeaveStatus | { $in: LeaveStatus[] };
  employeeId?: Types.ObjectId | { $in: Types.ObjectId[] };
}

const LIVE_STATUSES = [LeaveStatus.APPROVED, LeaveStatus.PENDING];

@Injectable()
export class TeamCalendarService {
  constructor(
    @InjectModel(LeaveApplication.name)
    private readonly leaveModel: Model<LeaveApplication>,
    private readonly employees: EmployeesService,
    @Inject(LEAVE_POLICY) private readonly policy: LeavePolicy,
  ) {}

  async getCalendar(user: JwtPayload, query: TeamCalendarQueryDto) {
    const today = cairoDay();
    const month = query.month ?? currentMonthKey(today);

    if (user.role === Role.ADMIN) {
      const clauses = await this.adminClauses(query.department);
      return this.render(
        month,
        today,
        { isAdmin: true, employeeId: null },
        clauses,
      );
    }

    const employee = await this.employees.findByUserId(user.id);
    if (!employee) throw new NotFoundException('Employee not found');

    const clauses = await this.employeeClauses(
      employee._id,
      employee.department,
    );
    return this.render(
      month,
      today,
      { isAdmin: false, employeeId: String(employee._id) },
      clauses,
    );
  }

  private async adminClauses(department?: string): Promise<VisibilityClause[]> {
    if (!department) return [{ status: { $in: LIVE_STATUSES } }];

    const ids = await this.employees.findActiveIdsByDepartment(department);
    return [{ employeeId: { $in: ids }, status: { $in: LIVE_STATUSES } }];
  }

  private async employeeClauses(
    employeeId: Types.ObjectId,
    department?: string,
  ): Promise<VisibilityClause[]> {
    const clauses: VisibilityClause[] = [
      { employeeId, status: { $in: LIVE_STATUSES } },
    ];

    if (department) {
      const ids = await this.employees.findActiveIdsByDepartment(department);
      clauses.push({ employeeId: { $in: ids }, status: LeaveStatus.APPROVED });
    }

    return clauses;
  }

  private async render(
    month: string,
    today: Date,
    viewer: CalendarViewer,
    clauses: VisibilityClause[],
  ) {
    const { start, end } = monthRange(month);

    const leaves = await this.leaveModel
      .find({
        startDate: { $lte: end },
        endDate: { $gte: start },
        $or: clauses,
      })
      .populate<{ employeeId: PopulatedEmployee | null }>(
        'employeeId',
        'firstName lastName department isDeleted',
      )
      .lean()
      .exec();

    const calendarLeaves = leaves.flatMap((leave): CalendarLeave[] => {
      const employee = leave.employeeId;
      if (!employee || employee.isDeleted) return [];

      return [
        {
          id: String(leave._id),
          employeeId: String(employee._id),
          employeeName: `${employee.firstName} ${employee.lastName}`,
          department: employee.department ?? null,
          type: leave.type,
          status: leave.status,
          startDate: leave.startDate,
          endDate: leave.endDate,
        },
      ];
    });

    return buildTeamCalendar({
      month,
      today,
      leaves: calendarLeaves,
      viewer,
      policy: this.policy,
    });
  }
}
