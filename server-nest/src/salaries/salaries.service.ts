import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { ClientSession, Model, Types } from 'mongoose';
import { Salary } from './schemas/salary.schema.js';

export interface SalaryAmounts {
  basicSalary: number;
  allowances: number;
  deductions: number;
}

export interface SalaryView extends SalaryAmounts {
  netSalary: number;
  updatedAt: Date | null;
}

export function toSalaryView(
  salary: (SalaryAmounts & { updatedAt?: Date }) | null,
): SalaryView {
  const basicSalary = salary?.basicSalary ?? 0;
  const allowances = salary?.allowances ?? 0;
  const deductions = salary?.deductions ?? 0;

  return {
    basicSalary,
    allowances,
    deductions,
    netSalary: basicSalary + allowances - deductions,
    updatedAt: salary?.updatedAt ?? null,
  };
}

@Injectable()
export class SalariesService {
  constructor(
    @InjectModel(Salary.name) private readonly salaryModel: Model<Salary>,
  ) {}

  async getForEmployee(employeeId: string | Types.ObjectId) {
    const salary = await this.salaryModel.findOne({ employeeId }).lean().exec();
    return toSalaryView(salary);
  }

  async mapForEmployees(employeeIds: Array<string | Types.ObjectId>) {
    const salaries = await this.salaryModel
      .find({ employeeId: { $in: employeeIds } })
      .lean()
      .exec();

    return new Map(
      salaries.map(
        (salary) => [String(salary.employeeId), toSalaryView(salary)] as const,
      ),
    );
  }

  async upsert(
    employeeId: string | Types.ObjectId,
    amounts: Partial<SalaryAmounts>,
    session?: ClientSession,
  ) {
    if (Object.keys(amounts).length === 0) return;

    await this.salaryModel
      .updateOne({ employeeId }, { $set: amounts }, { upsert: true, session })
      .exec();
  }
}
