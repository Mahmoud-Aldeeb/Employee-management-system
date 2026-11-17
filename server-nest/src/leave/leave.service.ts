import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import type { JwtPayload } from '../auth/strategies/jwt.strategy.js';
import { LeaveStatus } from '../common/enums/leave-status.enum.js';
import { Role } from '../common/enums/role.enum.js';
import { cairoDay } from '../common/utils/cairo-time.js';
import { EmployeesService } from '../employees/employees.service.js';
import type { Employee } from '../employees/schemas/employee.schema.js';
import { InngestService } from '../inngest/inngest.service.js';
import { CreateLeaveDto } from './dto/create-leave.dto.js';
import { LeaveApplication } from './schemas/leave-application.schema.js';

type PopulatedEmployee = Employee & { _id: unknown };

@Injectable()
export class LeaveService {
  private readonly logger = new Logger(LeaveService.name);

  constructor(
    @InjectModel(LeaveApplication.name)
    private readonly leaveModel: Model<LeaveApplication>,
    private readonly employees: EmployeesService,
    private readonly inngest: InngestService,
  ) {}

  async create(userId: string, dto: CreateLeaveDto) {
    const employee = await this.employees.findByUserId(userId);
    if (!employee) throw new NotFoundException('Employee not found');
    if (employee.isDeleted) {
      throw new ForbiddenException(
        'Your account is deactivated, You cannot apply for leave.',
      );
    }

    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    const today = cairoDay();

    if (startDate <= today || endDate <= today) {
      throw new BadRequestException('Leave dates must be in the future');
    }
    if (endDate < startDate) {
      throw new BadRequestException('End date cannot be before start date');
    }

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
      }));
      return { success: true, data };
    }

    const employee = await this.employees.findByUserId(user.id);
    if (!employee) throw new NotFoundException('Employee not found');

    const leaves = await this.leaveModel
      .find({ employeeId: employee._id })
      .sort({ createdAt: -1 })
      .exec();

    return {
      data: leaves,
      employee: { ...employee.toObject(), id: String(employee._id) },
    };
  }

  async updateStatus(id: string, status: LeaveStatus) {
    const leave = await this.leaveModel
      .findByIdAndUpdate(id, { status }, { returnDocument: 'after' })
      .exec();
    if (!leave) throw new NotFoundException('Leave application not found');
    return { success: true, data: leave };
  }
}
