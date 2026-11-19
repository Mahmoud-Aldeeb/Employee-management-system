import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { type HydratedDocument } from 'mongoose';

export type SalaryDocument = HydratedDocument<Salary>;

@Schema({ timestamps: true })
export class Salary {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
    unique: true,
  })
  employeeId!: mongoose.Types.ObjectId;

  @Prop({ type: Number, default: 0, min: 0 })
  basicSalary!: number;

  @Prop({ type: Number, default: 0, min: 0 })
  allowances!: number;

  @Prop({ type: Number, default: 0, min: 0 })
  deductions!: number;
}

export const SalarySchema = SchemaFactory.createForClass(Salary);
