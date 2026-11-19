import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { type HydratedDocument } from 'mongoose';
import { DEPARTMENTS } from '../../common/constants/departments.js';
import { EmploymentStatus } from '../../common/enums/employment-status.enum.js';

export type EmployeeDocument = HydratedDocument<Employee>;

@Schema({ timestamps: true })
export class Employee {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  })
  userId!: mongoose.Types.ObjectId;

  @Prop({ required: true })
  firstName!: string;

  @Prop({ required: true })
  lastName!: string;

  @Prop({ required: true, unique: true })
  email!: string;

  @Prop({ required: true })
  phone!: string;

  @Prop({ required: true })
  position!: string;

  @Prop({
    type: String,
    enum: EmploymentStatus,
    default: EmploymentStatus.ACTIVE,
  })
  employmentStatus!: EmploymentStatus;

  @Prop({ type: Date, required: true })
  joinDate!: Date;

  @Prop({ default: false })
  isDeleted!: boolean;

  @Prop({ default: '' })
  bio!: string;

  @Prop({ type: String, enum: [...DEPARTMENTS] })
  department?: string;
}

export const EmployeeSchema = SchemaFactory.createForClass(Employee);
