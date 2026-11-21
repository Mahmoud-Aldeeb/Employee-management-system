import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model, Types } from 'mongoose';
import { LeaveStatus } from '../common/enums/leave-status.enum.js';
import { cairoDay } from '../common/utils/cairo-time.js';
import { LeaveApplication } from './schemas/leave-application.schema.js';
import { countWorkingDays, type DateRange } from './policy/leave-calendar.js';
import {
  computeBalance,
  findBookingProblem,
  type LeaveRequestInput,
} from './policy/leave-balance.js';
import { LEAVE_POLICY, type LeavePolicy } from './policy/leave-policy.js';

interface BookableEmployee {
  _id: Types.ObjectId;
  joinDate: Date;
}

@Injectable()
export class LeaveBalanceService {
  constructor(
    @InjectModel(LeaveApplication.name)
    private readonly leaveModel: Model<LeaveApplication>,
    @Inject(LEAVE_POLICY) private readonly policy: LeavePolicy,
  ) {}

  async getBalance(
    employee: BookableEmployee,
    year: number = cairoDay().getUTCFullYear(),
  ) {
    const leaves = await this.loadBooked(employee._id);

    return computeBalance({
      joinDate: employee.joinDate,
      year,
      leaves,
      policy: this.policy,
    });
  }

  async assertCanBook(
    employee: BookableEmployee,
    request: LeaveRequestInput,
    excludeLeaveId?: string,
  ) {
    const existing = await this.loadBooked(employee._id, excludeLeaveId);
    const problem = findBookingProblem(request, {
      joinDate: employee.joinDate,
      existing,
      policy: this.policy,
    });

    if (problem) throw new BadRequestException(problem);
  }

  workingDays(range: DateRange) {
    return countWorkingDays(range, this.policy);
  }

  private loadBooked(employeeId: Types.ObjectId, excludeLeaveId?: string) {
    return this.leaveModel
      .find({
        employeeId,
        status: { $in: [LeaveStatus.APPROVED, LeaveStatus.PENDING] },
        ...(excludeLeaveId ? { _id: { $ne: excludeLeaveId } } : {}),
      })
      .select('type status startDate endDate')
      .lean()
      .exec();
  }
}
