import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { type HydratedDocument } from 'mongoose';
import { LeaveStatus } from '../../common/enums/leave-status.enum.js';
import { LeaveType } from '../../common/enums/leave-type.enum.js';

export type LeaveApplicationDocument = HydratedDocument<LeaveApplication>;

@Schema({ timestamps: true })
export class LeaveApplication {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
  })
  employeeId!: mongoose.Types.ObjectId;

  @Prop({ type: String, enum: LeaveType, required: true })
  type!: LeaveType;

  @Prop({ type: Date, required: true })
  startDate!: Date;

  @Prop({ type: Date, required: true })
  endDate!: Date;

  @Prop({ required: true })
  reason!: string;

  @Prop({ type: String, enum: LeaveStatus, default: LeaveStatus.PENDING })
  status!: LeaveStatus;
}

export const LeaveApplicationSchema =
  SchemaFactory.createForClass(LeaveApplication);
