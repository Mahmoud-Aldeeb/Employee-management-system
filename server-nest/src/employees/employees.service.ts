import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import bcrypt from 'bcrypt';
import type { Connection, Model } from 'mongoose';
import { EmploymentStatus } from '../common/enums/employment-status.enum.js';
import { Role } from '../common/enums/role.enum.js';
import {
  SalariesService,
  toSalaryView,
  type SalaryAmounts,
} from '../salaries/salaries.service.js';
import { SessionsService } from '../sessions/sessions.service.js';
import { UsersService } from '../users/users.service.js';
import { CreateEmployeeDto } from './dto/create-employee.dto.js';
import { UpdateEmployeeDto } from './dto/update-employee.dto.js';
import { Employee, type EmployeeDocument } from './schemas/employee.schema.js';

interface PopulatedUser {
  email: string;
  role: Role;
}

@Injectable()
export class EmployeesService {
  constructor(
    @InjectModel(Employee.name) private readonly employeeModel: Model<Employee>,
    @InjectConnection() private readonly connection: Connection,
    private readonly users: UsersService,
    private readonly salaries: SalariesService,
    private readonly sessions: SessionsService,
  ) {}

  async findAll(department?: string) {
    const filter = department ? { department } : {};
    const employees = await this.employeeModel
      .find(filter)
      .sort({ createdAt: -1 })
      .populate<{ userId: PopulatedUser | null }>('userId', 'email role')
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
          ? { email: employee.userId.email, role: employee.userId.role }
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

  async create(dto: CreateEmployeeDto) {
    const hashed = await bcrypt.hash(dto.password, 10);
    const session = await this.connection.startSession();
    let employee: EmployeeDocument | undefined;

    try {
      await session.withTransaction(async () => {
        const user = await this.users.create(
          {
            email: dto.email,
            password: hashed,
            role: dto.role ?? Role.EMPLOYEE,
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
        await this.salaries.upsert(
          created._id,
          {
            basicSalary: dto.basicSalary ?? 0,
            allowances: dto.allowances ?? 0,
            deductions: dto.deductions ?? 0,
          },
          session,
        );
        employee = created;
      });
    } catch (error) {
      throw this.mapError(error);
    } finally {
      await session.endSession();
    }

    return employee;
  }

  async update(id: string, dto: UpdateEmployeeDto) {
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
    if (password) userChanges.password = await bcrypt.hash(password, 10);

    const session = await this.connection.startSession();
    try {
      await session.withTransaction(async () => {
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
      });
    } catch (error) {
      throw this.mapError(error);
    } finally {
      await session.endSession();
    }

    if (role || password) {
      await this.sessions.revokeAllForUser(employee.userId.toString());
    }

    return { success: true };
  }

  async remove(id: string) {
    const result = await this.employeeModel
      .updateOne(
        { _id: id },
        { isDeleted: true, employmentStatus: EmploymentStatus.INACTIVE },
      )
      .exec();
    if (result.matchedCount === 0)
      throw new NotFoundException('Employee not found');
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
