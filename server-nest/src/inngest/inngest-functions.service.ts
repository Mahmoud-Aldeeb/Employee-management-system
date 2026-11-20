import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { Attendance } from '../attendance/schemas/attendance.schema.js';
import { AttendanceStatus } from '../common/enums/attendance-status.enum.js';
import { DayType } from '../common/enums/day-type.enum.js';
import { EmploymentStatus } from '../common/enums/employment-status.enum.js';
import { LeaveStatus } from '../common/enums/leave-status.enum.js';
import {
  cairoDay,
  formatCairoDate,
  formatCairoTime,
} from '../common/utils/cairo-time.js';
import { Employee } from '../employees/schemas/employee.schema.js';
import { LeaveApplication } from '../leave/schemas/leave-application.schema.js';
import {
  attendanceReminderEmail,
  checkOutReminderEmail,
  leaveReminderEmail,
} from '../mail/email-templates.js';
import { MailService } from '../mail/mail.service.js';
import { InngestService } from './inngest.service.js';
import { DemoService } from '../demo/demo.service.js';

const HOUR_MS = 60 * 60 * 1000;

@Injectable()
export class InngestFunctionsService {
  constructor(
    @InjectModel(Employee.name) private readonly employeeModel: Model<Employee>,
    @InjectModel(Attendance.name)
    private readonly attendanceModel: Model<Attendance>,
    @InjectModel(LeaveApplication.name)
    private readonly leaveModel: Model<LeaveApplication>,
    private readonly inngest: InngestService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
    private readonly demo: DemoService,
  ) {}

  getFunctions() {
    return [
      this.autoCheckOut(),
      this.leaveApplicationReminder(),
      this.attendanceReminderCron(),
      this.demoReset(),
    ];
  }

  private autoCheckOut() {
    return this.inngest.client.createFunction(
      { id: 'auto-check-out', triggers: [{ event: 'employee/check-out' }] },
      async ({ event, step }) => {
        const { employeeId, attendanceId } = event.data as {
          employeeId: string;
          attendanceId: string;
        };

        await step.sleep('wait-9-hours', '9h');

        const reminderSent = await step.run(
          'send-check-out-reminder',
          async () => {
            const attendance = await this.attendanceModel
              .findById(attendanceId)
              .lean()
              .exec();
            if (!attendance || attendance.checkOut || !attendance.checkIn)
              return false;

            const employee = await this.employeeModel
              .findById(employeeId)
              .lean()
              .exec();
            if (!employee) return false;

            const { subject, html } = checkOutReminderEmail({
              firstName: employee.firstName,
              department: employee.department ?? 'No Department',
              checkInTime: formatCairoTime(attendance.checkIn),
            });
            await this.mail.send({ to: employee.email, subject, html });
            return true;
          },
        );

        if (!reminderSent) return { reminderSent: false };

        await step.sleep('wait-1-hour', '1h');

        await step.run('auto-check-out', async () => {
          const attendance = await this.attendanceModel
            .findById(attendanceId)
            .exec();
          if (!attendance || attendance.checkOut || !attendance.checkIn) return;

          attendance.checkOut = new Date(
            attendance.checkIn.getTime() + 4 * HOUR_MS,
          );
          attendance.workingHours = 4;
          attendance.dayType = DayType.HALF_DAY;
          attendance.status = AttendanceStatus.LATE;
          await attendance.save();
        });

        return { reminderSent: true };
      },
    );
  }

  private leaveApplicationReminder() {
    return this.inngest.client.createFunction(
      {
        id: 'leave-application-reminder',
        triggers: [{ event: 'leave/pending' }],
      },
      async ({ event, step }) => {
        const { leaveApplicationId } = event.data as {
          leaveApplicationId: string;
        };

        await step.sleep('wait-24-hours', '24h');

        await step.run('remind-admin', async () => {
          const adminEmail = this.config.get<string>('ADMIN_EMAIL');
          if (!adminEmail) return;

          const leave = await this.leaveModel
            .findById(leaveApplicationId)
            .lean()
            .exec();
          if (!leave || leave.status !== LeaveStatus.PENDING) return;

          const employee = await this.employeeModel
            .findById(leave.employeeId)
            .lean()
            .exec();
          const { subject, html } = leaveReminderEmail({
            department: employee?.department ?? 'No Department',
            startDate: formatCairoDate(leave.startDate),
          });
          await this.mail.send({ to: adminEmail, subject, html });
        });
      },
    );
  }

  private attendanceReminderCron() {
    return this.inngest.client.createFunction(
      {
        id: 'attendance-reminder-cron',
        triggers: [{ cron: 'TZ=Africa/Cairo 30 11 * * *' }],
      },
      async ({ step }) => {
        const absent = await step.run('find-absent-employees', async () => {
          const today = cairoDay();

          const [employees, leaves, attendances] = await Promise.all([
            this.employeeModel
              .find({
                isDeleted: false,
                employmentStatus: EmploymentStatus.ACTIVE,
              })
              .lean()
              .exec(),
            this.leaveModel
              .find({
                status: LeaveStatus.APPROVED,
                startDate: { $lte: today },
                endDate: { $gte: today },
              })
              .lean()
              .exec(),
            this.attendanceModel.find({ date: today }).lean().exec(),
          ]);

          const unavailable = new Set([
            ...leaves.map((leave) => String(leave.employeeId)),
            ...attendances.map((attendance) => String(attendance.employeeId)),
          ]);

          return employees
            .filter((employee) => !unavailable.has(String(employee._id)))
            .map((employee) => ({
              firstName: employee.firstName,
              email: employee.email,
              department: employee.department ?? 'No Department',
            }));
        });

        if (absent.length > 0) {
          await step.run('send-reminder-emails', async () => {
            await Promise.allSettled(
              absent.map((employee) => {
                const { subject, html } = attendanceReminderEmail({
                  firstName: employee.firstName,
                  department: employee.department,
                });
                return this.mail.send({ to: employee.email, subject, html });
              }),
            );
          });
        }

        return { absent: absent.length };
      },
    );
  }

  private demoReset() {
    return this.inngest.client.createFunction(
      { id: 'demo-reset', triggers: [{ cron: 'TZ=Africa/Cairo 0 3 * * *' }] },
      async ({ step }) => {
        if (!this.demo.isEnabled()) return { skipped: true };

        const summary = await step.run('reset-demo-data', () =>
          this.demo.reset(),
        );
        return { skipped: false, ...summary };
      },
    );
  }
}
