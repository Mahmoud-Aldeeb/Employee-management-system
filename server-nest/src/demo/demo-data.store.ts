import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { ClientSession, Model } from 'mongoose';
import { Attendance } from '../attendance/schemas/attendance.schema.js';
import { Employee } from '../employees/schemas/employee.schema.js';
import { LeaveApplication } from '../leave/schemas/leave-application.schema.js';
import { Payslip } from '../payslips/schemas/payslip.schema.js';
import { Salary } from '../salaries/schemas/salary.schema.js';
import { AuthSession } from '../sessions/schemas/auth-session.schema.js';
import { User } from '../users/schemas/user.schema.js';
import type { DemoDataset } from './demo-dataset.js';
import { DEMO_EMAIL_PATTERN } from './demo.constants.js';
import { AuditLog } from '../audit/schemas/audit-log.schema.js';
import { Notification } from '../notifications/schemas/notification.schema.js';
import { Workplace } from '../workplaces/schemas/workplace.schema.js';

@Injectable()
export class DemoDataStore {
  constructor(
    @InjectModel(User.name) private readonly users: Model<User>,
    @InjectModel(Employee.name) private readonly employees: Model<Employee>,
    @InjectModel(Salary.name) private readonly salaries: Model<Salary>,
    @InjectModel(Attendance.name)
    private readonly attendance: Model<Attendance>,
    @InjectModel(LeaveApplication.name)
    private readonly leaves: Model<LeaveApplication>,
    @InjectModel(Payslip.name) private readonly payslips: Model<Payslip>,
    @InjectModel(AuthSession.name)
    private readonly authSessions: Model<AuthSession>,
    @InjectModel(AuditLog.name) private readonly auditLogs: Model<AuditLog>,
    @InjectModel(Notification.name)
    private readonly notifications: Model<Notification>,
    @InjectModel(Workplace.name)
    private readonly workplaces: Model<Workplace>,
  ) {}

  async clear(session: ClientSession) {
    const users = await this.users
      .find({ email: DEMO_EMAIL_PATTERN })
      .select('_id')
      .session(session)
      .lean()
      .exec();
    const userIds = users.map((user) => user._id);

    const employees = await this.employees
      .find({ userId: { $in: userIds } })
      .select('_id')
      .session(session)
      .lean()
      .exec();
    const employeeIds = employees.map((employee) => employee._id);
    const ownedByEmployee = { employeeId: { $in: employeeIds } };

    await this.attendance.deleteMany(ownedByEmployee, { session });
    await this.leaves.deleteMany(ownedByEmployee, { session });
    await this.payslips.deleteMany(ownedByEmployee, { session });
    await this.salaries.deleteMany(ownedByEmployee, { session });
    await this.employees.deleteMany({ _id: { $in: employeeIds } }, { session });
    await this.authSessions.deleteMany(
      { userId: { $in: userIds } },
      { session },
    );
    await this.auditLogs.deleteMany({ isDemo: true }, { session });
    await this.notifications.deleteMany(
      { userId: { $in: userIds } },
      { session },
    );

    await this.workplaces.deleteMany({ isDemo: true }, { session });

    await this.users.deleteMany({ _id: { $in: userIds } }, { session });
  }

  async insert(dataset: DemoDataset, session: ClientSession) {
    await this.users.insertMany(dataset.users, { session });
    await this.employees.insertMany(dataset.employees, { session });
    await this.salaries.insertMany(dataset.salaries, { session });
    await this.attendance.insertMany(dataset.attendance, { session });
    await this.leaves.insertMany(dataset.leaves, { session });
    await this.payslips.insertMany(dataset.payslips, { session });
    await this.auditLogs.insertMany(dataset.auditLogs, { session });
    await this.notifications.insertMany(dataset.notifications, { session });
    await this.workplaces.insertMany(dataset.workplaces, { session });
  }
}
