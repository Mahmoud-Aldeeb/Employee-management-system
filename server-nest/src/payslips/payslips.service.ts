import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import type { JwtPayload } from '../auth/strategies/jwt.strategy.js';
import { Role } from '../common/enums/role.enum.js';
import { isDuplicateKeyError } from '../common/utils/mongo-errors.js';
import { EmployeesService } from '../employees/employees.service.js';
import type { Employee } from '../employees/schemas/employee.schema.js';
import { CreatePayslipDto } from './dto/create-payslip.dto.js';
import { Payslip } from './schemas/payslip.schema.js';

type PopulatedEmployee = Employee & { _id: unknown };

@Injectable()
export class PayslipsService {
  constructor(
    @InjectModel(Payslip.name) private readonly payslipModel: Model<Payslip>,
    private readonly employees: EmployeesService,
  ) {}

  async create(dto: CreatePayslipDto) {
    const employee = await this.employees.findById(dto.employeeId);
    if (!employee) throw new NotFoundException('Employee not found');

    const allowances = dto.allowances ?? 0;
    const deductions = dto.deductions ?? 0;

    try {
      const payslip = await this.payslipModel.create({
        employeeId: employee._id,
        month: dto.month,
        year: dto.year,
        basicSalary: dto.basicSalary,
        allowances,
        deductions,
        netSalary: dto.basicSalary + allowances - deductions,
      });
      return { success: true, data: payslip };
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw new BadRequestException(
          'A payslip for this employee and month already exists',
        );
      }
      throw error;
    }
  }

  async findAll(user: JwtPayload) {
    if (user.role === Role.ADMIN) {
      const payslips = await this.payslipModel
        .find()
        .populate<{ employeeId: PopulatedEmployee | null }>('employeeId')
        .sort({ createdAt: -1 })
        .lean()
        .exec();

      const data = payslips.map((payslip) => ({
        ...payslip,
        id: String(payslip._id),
        employee: payslip.employeeId,
        employeeId: payslip.employeeId ? String(payslip.employeeId._id) : null,
      }));
      return { data };
    }

    const employee = await this.employees.findByUserId(user.id);
    if (!employee) throw new NotFoundException('Employee not found');

    const data = await this.payslipModel
      .find({ employeeId: employee._id })
      .populate('employeeId')
      .sort({ createdAt: -1 })
      .exec();
    return { data };
  }

  async findOne(id: string, user: JwtPayload) {
    const payslip = await this.payslipModel
      .findById(id)
      .populate<{ employeeId: PopulatedEmployee | null }>('employeeId')
      .lean()
      .exec();
    if (!payslip) throw new NotFoundException('Payslip not found');

    if (user.role !== Role.ADMIN) {
      const employee = await this.employees.findByUserId(user.id);
      const isOwner =
        !!employee &&
        !!payslip.employeeId &&
        String(payslip.employeeId._id) === String(employee._id);
      if (!isOwner) throw new NotFoundException('Payslip not found');
    }

    return {
      ...payslip,
      id: String(payslip._id),
      employee: payslip.employeeId,
    };
  }
}
