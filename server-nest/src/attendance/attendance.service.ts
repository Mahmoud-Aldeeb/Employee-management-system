import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model, Types } from 'mongoose';
import { AttendanceStatus } from '../common/enums/attendance-status.enum.js';
import { DayType } from '../common/enums/day-type.enum.js';
import { cairoDay, cairoMinutesOfDay } from '../common/utils/cairo-time.js';
import { isDuplicateKeyError } from '../common/utils/mongo-errors.js';
import { EmployeesService } from '../employees/employees.service.js';
import { InngestService } from '../inngest/inngest.service.js';
import type { LocationSampleDto } from './dto/clock.dto.js';
import { AttendanceLocationService } from './location/attendance-location.service.js';
import { Attendance, type LocationProof } from './schemas/attendance.schema.js';

const LATE_AFTER_MINUTES = 9 * 60;

@Injectable()
export class AttendanceService {
  private readonly logger = new Logger(AttendanceService.name);
  constructor(
    @InjectModel(Attendance.name)
    private readonly attendanceModel: Model<Attendance>,
    private readonly employees: EmployeesService,
    private readonly inngest: InngestService,
    private readonly location: AttendanceLocationService,
  ) {}

  async clockInOut(userId: string, sample?: LocationSampleDto) {
    const employee = await this.employees.findByUserId(userId);
    if (!employee) throw new NotFoundException('Employee not found');
    if (employee.isDeleted) {
      throw new ForbiddenException(
        'Your account is deactivated. You cannot check in/out.',
      );
    }

    const now = new Date();
    const date = cairoDay(now);
    const existing = await this.attendanceModel
      .findOne({ employeeId: employee._id, date })
      .exec();

    if (!existing) {
      const proof = await this.location.verifyCheckIn(employee, sample, now);
      const attendance = await this.createCheckIn(
        employee._id,
        date,
        now,
        proof,
      );
      await this.scheduleAutoCheckOut(
        String(employee._id),
        String(attendance._id),
      );
      return { success: true, type: 'CHECK_IN', data: attendance };
    }

    if (!existing.checkOut) {
      const hours =
        (now.getTime() - (existing.checkIn ?? now).getTime()) / 3600000;
      const workingHours = Number(hours.toFixed(2));
      existing.checkOut = now;
      existing.workingHours = workingHours;
      existing.dayType = this.dayTypeFor(workingHours);
      existing.checkOutLocation = await this.location.proofForCheckOut(
        employee,
        sample,
        now,
      );
      await existing.save();
    }

    return { success: true, type: 'CHECK_OUT', data: existing };
  }

  async getPolicy(userId: string) {
    const employee = await this.employees.findByUserId(userId);
    if (!employee) throw new NotFoundException('Employee not found');

    const policy = await this.location.policyFor(employee);
    return {
      locationRequired: policy.required,
      workplaces: policy.workplaces.map(({ name, radiusMeters }) => ({
        name,
        radiusMeters,
      })),
    };
  }

  async getHistory(userId: string, limit: number) {
    const employee = await this.employees.findByUserId(userId);
    if (!employee) throw new NotFoundException('Employee not found');

    const history = await this.attendanceModel
      .find({ employeeId: employee._id })
      .sort({ date: -1 })
      .limit(limit)
      .exec();

    return { data: history, employee: { isDeleted: employee.isDeleted } };
  }

  private async createCheckIn(
    employeeId: Types.ObjectId,
    date: Date,
    now: Date,
    proof: LocationProof | null,
  ) {
    try {
      return await this.attendanceModel.create({
        employeeId,
        date,
        checkIn: now,
        status:
          cairoMinutesOfDay(now) > LATE_AFTER_MINUTES
            ? AttendanceStatus.LATE
            : AttendanceStatus.PRESENT,
        checkInLocation: proof,
      });
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw new ConflictException('Attendance already recorded for today');
      }
      throw error;
    }
  }

  private async scheduleAutoCheckOut(employeeId: string, attendanceId: string) {
    try {
      await this.inngest.send('employee/check-out', {
        employeeId,
        attendanceId,
      });
    } catch (error) {
      this.logger.warn(`Failed to schedule auto check-out: ${String(error)}`);
    }
  }

  private dayTypeFor(hours: number) {
    if (hours >= 8) return DayType.FULL_DAY;
    if (hours >= 6) return DayType.THREE_QUARTER_DAY;
    if (hours >= 4) return DayType.HALF_DAY;
    return DayType.SHORT_DAY;
  }
}
