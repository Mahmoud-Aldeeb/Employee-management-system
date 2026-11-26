import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import type { Connection, Model } from 'mongoose';
import { describeValues, diffFields } from '../audit/audit-diff.js';
import { AuditService } from '../audit/audit.service.js';
import { AuditAction, type AuditEvent } from '../audit/audit.types.js';
import type { JwtPayload } from '../auth/strategies/jwt.strategy.js';
import { EmploymentStatus } from '../common/enums/employment-status.enum.js';
import { Role } from '../common/enums/role.enum.js';
import { withTransaction } from '../common/utils/with-transaction.js';
import { InngestService } from '../inngest/inngest.service.js';
import {
  SalariesService,
  toSalaryView,
  type SalaryAmounts,
} from '../salaries/salaries.service.js';
import { SessionsService } from '../sessions/sessions.service.js';
import { UsersService } from '../users/users.service.js';
import { CreateEmployeeDto } from './dto/create-employee.dto.js';
import { UpdateEmployeeDto } from './dto/update-employee.dto.js';
import { fullName } from './employee-name.js';
import { Employee, type EmployeeDocument } from './schemas/employee.schema.js';

const EMPLOYEE_AUDIT_FIELDS = [
  'firstName',
  'lastName',
  'email',
  'phone',
  'position',
  'department',
  'joinDate',
  'employmentStatus',
] as const;

const SALARY_AUDIT_FIELDS = [
  'basicSalary',
  'allowances',
  'deductions',
] as const;

export type InviteStatus = 'NOT_REQUIRED' | 'QUEUED' | 'FAILED';

interface PopulatedUser {
  email: string;
  role: Role;
  invitedAt: Date | null;
}

interface UpdateAuditInput {
  employeeChanges: object;
  salaryChanges: Partial<SalaryAmounts>;
  role?: Role;
  passwordChanged: boolean;
}

@Injectable()
export class EmployeesService {
  private readonly logger = new Logger(EmployeesService.name);

  constructor(
    @InjectModel(Employee.name) private readonly employeeModel: Model<Employee>,
    @InjectConnection() private readonly connection: Connection,
    private readonly config: ConfigService,
    private readonly users: UsersService,
    private readonly salaries: SalariesService,
    private readonly sessions: SessionsService,
    private readonly audit: AuditService,
    private readonly inngest: InngestService,
  ) {}

  async findAll(department?: string) {
    const filter = department ? { department } : {};
    const employees = await this.employeeModel
      .find(filter)
      .sort({ createdAt: -1 })
      .populate<{ userId: PopulatedUser | null }>(
        'userId',
        'email role invitedAt',
      )
      .lean()
      .exec();

    const salaries = await this.salaries.mapForEmployees(
      employees.map((employee) => employee._id),
    );

    return employees.map((employee) => {
      const salary = salaries.get(String(employee._id)) ?? toSalaryView(null);

      return {
        ...employee,
        id: String(employee._id),
        basicSalary: salary.basicSalary,
        allowances: salary.allowances,
        deductions: salary.deductions,
        user: employee.userId
          ? {
              email: employee.userId.email,
              role: employee.userId.role,
              invitedAt: employee.userId.invitedAt ?? null,
            }
          : null,
      };
    });
  }

  findByUserId(userId: string) {
    return this.employeeModel.findOne({ userId }).exec();
  }

  findById(id: string) {
    return this.employeeModel.findById(id).exec();
  }

  async findActiveIdsByDepartment(department: string) {
    const employees = await this.employeeModel
      .find({ department, isDeleted: { $ne: true } })
      .select('_id')
      .lean()
      .exec();

    return employees.map((employee) => employee._id);
  }

  async create(dto: CreateEmployeeDto, actor: JwtPayload) {
    const invited = dto.password === undefined;
    if (invited && this.config.get<boolean>('DEMO_MODE') === true) {
      throw new BadRequestException(
        'Invitations are disabled in demo mode. Set a password instead.',
      );
    }

    const hashed = await bcrypt.hash(
      dto.password ?? randomBytes(32).toString('hex'),
      10,
    );
    const role = dto.role ?? Role.EMPLOYEE;
    const salary = {
      basicSalary: dto.basicSalary ?? 0,
      allowances: dto.allowances ?? 0,
      deductions: dto.deductions ?? 0,
    };

    let employee: EmployeeDocument;
    try {
      employee = await withTransaction(this.connection, async (session) => {
        const user = await this.users.create(
          {
            email: dto.email,
            password: hashed,
            role,
            invitedAt: invited ? new Date() : null,
          },
          session,
        );
        const [created] = await this.employeeModel.create(
          [
            {
              userId: user._id,
              firstName: dto.firstName,
              lastName: dto.lastName,
              email: dto.email,
              phone: dto.phone,
              position: dto.position,
              department: dto.department ?? 'Engineering',
              joinDate: new Date(dto.joinDate),
              bio: dto.bio ?? '',
            },
          ],
          { session },
        );
        await this.salaries.upsert(created._id, salary, session);
        await this.audit.record(
          {
            action: AuditAction.EMPLOYEE_CREATED,
            actor,
            targetId: created._id,
            targetLabel: fullName(created),
            changes: describeValues({
              email: created.email,
              role,
              position: created.position,
              department: created.department,
              joinDate: created.joinDate,
              ...salary,
            }),
          },
          session,
        );
        return created;
      });
    } catch (error) {
      throw this.mapError(error);
    }

    const invite: InviteStatus = invited
      ? await this.queueInvite(String(employee.userId))
      : 'NOT_REQUIRED';

    return { employee, invite };
  }

  async resendInvite(id: string, actor: JwtPayload) {
    const employee = await this.employeeModel.findById(id).exec();
    if (!employee) throw new NotFoundException('Employee not found');
    if (employee.isDeleted) {
      throw new BadRequestException('This employee is deactivated');
    }

    const user = await this.users.findById(employee.userId.toString());
    if (!user?.invitedAt) {
      throw new BadRequestException('This employee has already set a password');
    }

    const invite = await this.queueInvite(user.id);
    if (invite === 'QUEUED') {
      await this.audit.recordBestEffort({
        action: AuditAction.EMPLOYEE_INVITED,
        actor,
        targetId: employee._id,
        targetLabel: fullName(employee),
        changes: [],
      });
    }

    return { success: true, invite };
  }

  async update(id: string, dto: UpdateEmployeeDto, actor: JwtPayload) {
    const employee = await this.employeeModel.findById(id).exec();
    if (!employee) throw new NotFoundException('Employee not found');

    const {
      password,
      role,
      joinDate,
      basicSalary,
      allowances,
      deductions,
      ...fields
    } = dto;
    const employeeChanges = {
      ...fields,
      ...(joinDate ? { joinDate: new Date(joinDate) } : {}),
    };
    const salaryChanges: Partial<SalaryAmounts> = {
      ...(basicSalary !== undefined ? { basicSalary } : {}),
      ...(allowances !== undefined ? { allowances } : {}),
      ...(deductions !== undefined ? { deductions } : {}),
    };

    const userChanges: Parameters<UsersService['updateById']>[1] = {};
    if (dto.email) userChanges.email = dto.email;
    if (role) userChanges.role = role;
    if (password) {
      userChanges.password = await bcrypt.hash(password, 10);
      userChanges.invitedAt = null;
    }

    const events = await this.collectAuditEvents(employee, actor, {
      employeeChanges,
      salaryChanges,
      role,
      passwordChanged: Boolean(password),
    });

    try {
      await withTransaction(this.connection, async (session) => {
        await this.employeeModel
          .updateOne({ _id: id }, employeeChanges, { session })
          .exec();
        if (Object.keys(salaryChanges).length > 0) {
          await this.salaries.upsert(employee._id, salaryChanges, session);
        }
        if (Object.keys(userChanges).length > 0) {
          await this.users.updateById(
            employee.userId.toString(),
            userChanges,
            session,
          );
        }
        await this.audit.record(events, session);
      });
    } catch (error) {
      throw this.mapError(error);
    }

    if (role || password) {
      await this.sessions.revokeAllForUser(employee.userId.toString());
    }

    return { success: true };
  }

  async remove(id: string, actor: JwtPayload) {
    const employee = await this.employeeModel.findById(id).exec();
    if (!employee) throw new NotFoundException('Employee not found');
    if (employee.isDeleted) return { success: true };

    await withTransaction(this.connection, async (session) => {
      await this.employeeModel
        .updateOne(
          { _id: id },
          { isDeleted: true, employmentStatus: EmploymentStatus.INACTIVE },
          { session },
        )
        .exec();
      await this.audit.record(
        {
          action: AuditAction.EMPLOYEE_DEACTIVATED,
          actor,
          targetId: employee._id,
          targetLabel: fullName(employee),
          changes: [
            {
              field: 'employmentStatus',
              from: employee.employmentStatus,
              to: EmploymentStatus.INACTIVE,
            },
          ],
        },
        session,
      );
    });

    return { success: true };
  }

  async updateBio(userId: string, bio: string) {
    const employee = await this.findByUserId(userId);
    if (!employee) throw new NotFoundException('Employee not found');
    if (employee.isDeleted) {
      throw new ForbiddenException(
        'Your account is deactivated. You cannot update your profile.',
      );
    }
    await this.employeeModel.updateOne({ _id: employee._id }, { bio }).exec();
    return { success: true };
  }

  private async queueInvite(userId: string): Promise<InviteStatus> {
    try {
      await this.inngest.send('auth/invite.requested', { userId });
      return 'QUEUED';
    } catch (error) {
      this.logger.warn(`Failed to queue the invitation: ${String(error)}`);
      return 'FAILED';
    }
  }

  private async collectAuditEvents(
    employee: EmployeeDocument,
    actor: JwtPayload,
    input: UpdateAuditInput,
  ) {
    const target = {
      actor,
      targetId: employee._id,
      targetLabel: fullName(employee),
    };
    const events: AuditEvent[] = [];

    const profileChanges = diffFields(
      employee.toObject(),
      input.employeeChanges,
      EMPLOYEE_AUDIT_FIELDS,
    );
    if (input.role) {
      const user = await this.users.findById(employee.userId.toString());
      if (user && user.role !== input.role) {
        profileChanges.push({ field: 'role', from: user.role, to: input.role });
      }
    }
    if (profileChanges.length > 0) {
      events.push({
        action: AuditAction.EMPLOYEE_UPDATED,
        ...target,
        changes: profileChanges,
      });
    }

    if (Object.keys(input.salaryChanges).length > 0) {
      const current = await this.salaries.getForEmployee(employee._id);
      const salaryDiff = diffFields(
        { ...current },
        input.salaryChanges,
        SALARY_AUDIT_FIELDS,
      );
      if (salaryDiff.length > 0) {
        events.push({
          action: AuditAction.SALARY_UPDATED,
          ...target,
          changes: salaryDiff,
        });
      }
    }

    if (input.passwordChanged) {
      events.push({
        action: AuditAction.EMPLOYEE_PASSWORD_RESET,
        ...target,
        changes: [],
      });
    }

    return events;
  }

  private mapError(error: unknown) {
    if (
      typeof error === 'object' &&
      error !== null &&
      (error as { code?: number }).code === 11000
    ) {
      return new BadRequestException('Email already exists');
    }
    return error;
  }
}
