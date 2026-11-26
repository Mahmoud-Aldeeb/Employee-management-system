import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import type { Connection, Model } from 'mongoose';
import { describeValues } from '../audit/audit-diff.js';
import { AuditAction } from '../audit/audit.types.js';
import { AuditService } from '../audit/audit.service.js';
import type { JwtPayload } from '../auth/strategies/jwt.strategy.js';
import { Role } from '../common/enums/role.enum.js';
import { isDuplicateKeyError } from '../common/utils/mongo-errors.js';
import { withTransaction } from '../common/utils/with-transaction.js';
import { fullName } from '../employees/employee-name.js';
import { EmployeesService } from '../employees/employees.service.js';
import type { Employee } from '../employees/schemas/employee.schema.js';
import { SalariesService } from '../salaries/salaries.service.js';
import { CreatePayslipDto } from './dto/create-payslip.dto.js';
import { Payslip } from './schemas/payslip.schema.js';
import { payslipIssuedContent } from '../notifications/notification-content.js';
import { NotificationPublisher } from '../notifications/notification-publisher.service.js';

type PopulatedEmployee = Employee & { _id: unknown };

@Injectable()
export class PayslipsService {
  constructor(
    @InjectModel(Payslip.name) private readonly payslipModel: Model<Payslip>,
    @InjectConnection() private readonly connection: Connection,
    private readonly employees: EmployeesService,
    private readonly salaries: SalariesService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationPublisher,
  ) {}

  async create(dto: CreatePayslipDto, actor: JwtPayload) {
    const employee = await this.employees.findById(dto.employeeId);
    if (!employee) throw new NotFoundException('Employee not found');

    const salary = await this.salaries.getForEmployee(employee._id);
    const basicSalary = dto.basicSalary ?? salary.basicSalary;
    const allowances = dto.allowances ?? salary.allowances ?? 0;
    const deductions = dto.deductions ?? salary.deductions ?? 0;
    const netSalary = basicSalary + allowances - deductions;
    const period = `${String(dto.month).padStart(2, '0')}/${dto.year}`;

    try {
      const payslip = await withTransaction(
        this.connection,
        async (session) => {
          const [created] = await this.payslipModel.create(
            [
              {
                employeeId: employee._id,
                month: dto.month,
                year: dto.year,
                basicSalary,
                allowances,
                deductions,
                netSalary,
              },
            ],
            { session },
          );
          await this.audit.record(
            {
              action: AuditAction.PAYSLIP_CREATED,
              actor,
              targetId: created._id,
              targetLabel: `${fullName(employee)} - ${period}`,
              changes: describeValues({
                month: dto.month,
                year: dto.year,
                basicSalary,
                allowances,
                deductions,
                netSalary,
              }),
            },
            session,
          );
          await this.notifications.notify(
            [employee.userId],
            payslipIssuedContent(period),
            session,
          );
          return created;
        },
      );
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
