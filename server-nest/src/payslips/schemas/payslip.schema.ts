import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { type HydratedDocument } from 'mongoose';

export type PayslipDocument = HydratedDocument<Payslip>;

@Schema({ timestamps: true })
export class Payslip {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
  })
  employeeId!: mongoose.Types.ObjectId;

  @Prop({ required: true })
  month!: number;

  @Prop({ required: true })
  year!: number;

  @Prop({ required: true })
  basicSalary!: number;

  @Prop({ default: 0 })
  allowances!: number;

  @Prop({ default: 0 })
  deductions!: number;

  @Prop({ required: true })
  netSalary!: number;
}

export const PayslipSchema = SchemaFactory.createForClass(Payslip);
PayslipSchema.index({ employeeId: 1, month: 1, year: 1 }, { unique: true });
