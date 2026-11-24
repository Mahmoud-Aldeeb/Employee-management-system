import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { JwtPayload } from '../auth/strategies/jwt.strategy.js';
import { LeaveStatus } from '../common/enums/leave-status.enum.js';
import { Role } from '../common/enums/role.enum.js';
import { EmployeesService } from '../employees/employees.service.js';
import type { Employee } from '../employees/schemas/employee.schema.js';
import { InngestService } from '../inngest/inngest.service.js';
import { CreateLeaveDto } from './dto/create-leave.dto.js';
import { LeaveBalanceService } from './leave-balance.service.js';
import { startOfUtcDay } from './policy/leave-calendar.js';
import { LeaveApplication } from './schemas/leave-application.schema.js';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import type { Connection, Model } from 'mongoose';
import { AuditAction } from '../audit/audit.types.js';
import { AuditService } from '../audit/audit.service.js';
import { withTransaction } from '../common/utils/with-transaction.js';
import { fullName } from '../employees/employee-name.js';
import { cairoDay, formatCairoDate } from '../common/utils/cairo-time.js';

type PopulatedEmployee = Employee & { _id: unknown };

const LEAVE_ACTIONS: Record<LeaveStatus, AuditAction> = {
  [LeaveStatus.PENDING]: AuditAction.LEAVE_REOPENED,
  [LeaveStatus.APPROVED]: AuditAction.LEAVE_APPROVED,
  [LeaveStatus.REJECTED]: AuditAction.LEAVE_REJECTED,
};

@Injectable()
export class LeaveService {
  private readonly logger = new Logger(LeaveService.name);

  constructor(
    @InjectModel(LeaveApplication.name)
    private readonly leaveModel: Model<LeaveApplication>,
    @InjectConnection() private readonly connection: Connection,
    private readonly employees: EmployeesService,
    private readonly balances: LeaveBalanceService,
    private readonly inngest: InngestService,
    private readonly audit: AuditService,
  ) {}

  async create(userId: string, dto: CreateLeaveDto) {
    const employee = await this.employees.findByUserId(userId);
    if (!employee) throw new NotFoundException('Employee not found');
    if (employee.isDeleted) {
      throw new ForbiddenException(
        'Your account is deactivated, You cannot apply for leave.',
      );
    }

    const startDate = startOfUtcDay(new Date(dto.startDate));
    const endDate = startOfUtcDay(new Date(dto.endDate));
    const today = cairoDay();

    if (startDate <= today || endDate <= today) {
      throw new BadRequestException('Leave dates must be in the future');
    }
    if (endDate < startDate) {
      throw new BadRequestException('End date cannot be before start date');
    }

    await this.balances.assertCanBook(employee, {
      type: dto.type,
      startDate,
      endDate,
    });

    const leave = await this.leaveModel.create({
      employeeId: employee._id,
      type: dto.type,
      startDate,
      endDate,
      reason: dto.reason,
      status: LeaveStatus.PENDING,
    });

    try {
      await this.inngest.send('leave/pending', {
        leaveApplicationId: String(leave._id),
      });
    } catch (error) {
      this.logger.warn(`Failed to schedule leave reminder: ${String(error)}`);
    }

    return { success: true, data: leave };
  }

  async findAll(user: JwtPayload, status?: LeaveStatus) {
    if (user.role === Role.ADMIN) {
      const leaves = await this.leaveModel
        .find(status ? { status } : {})
        .populate<{ employeeId: PopulatedEmployee | null }>('employeeId')
        .sort({ createdAt: -1 })
        .lean()
        .exec();

      const data = leaves.map((leave) => ({
        ...leave,
        id: String(leave._id),
        employee: leave.employeeId,
        employeeId: leave.employeeId ? String(leave.employeeId._id) : undefined,
        days: this.balances.workingDays(leave),
      }));
      return { success: true, data };
    }

    const employee = await this.employees.findByUserId(user.id);
    if (!employee) throw new NotFoundException('Employee not found');

    const leaves = await this.leaveModel
      .find({ employeeId: employee._id })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    return {
      data: leaves.map((leave) => ({
        ...leave,
        id: String(leave._id),
        days: this.balances.workingDays(leave),
      })),
      employee: { ...employee.toObject(), id: String(employee._id) },
    };
  }

  async getBalance(userId: string, year?: number) {
    const employee = await this.employees.findByUserId(userId);
    if (!employee) throw new NotFoundException('Employee not found');

    return this.balances.getBalance(employee, year);
  }

  async updateStatus(id: string, status: LeaveStatus, actor: JwtPayload) {
    const leave = await this.leaveModel.findById(id).exec();
    if (!leave) throw new NotFoundException('Leave application not found');

    const previous = leave.status;
    if (previous === status) return { success: true, data: leave };

    const employee = await this.employees.findById(String(leave.employeeId));
    if (employee && previous === LeaveStatus.REJECTED) {
      await this.balances.assertCanBook(
        employee,
        {
          type: leave.type,
          startDate: leave.startDate,
          endDate: leave.endDate,
        },
        id,
      );
    }

    const owner = employee ? fullName(employee) : 'Unknown employee';
    const period = `${formatCairoDate(leave.startDate)} - ${formatCairoDate(leave.endDate)}`;

    await withTransaction(this.connection, async (session) => {
      leave.status = status;
      await leave.save({ session });
      await this.audit.record(
        {
          action: LEAVE_ACTIONS[status],
          actor,
          targetId: leave._id,
          targetLabel: `${owner} (${period})`,
          changes: [{ field: 'status', from: previous, to: status }],
        },
        session,
      );
    });

    return { success: true, data: leave };
  }
}
