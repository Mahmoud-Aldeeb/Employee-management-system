import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { type HydratedDocument } from 'mongoose';
import { AttendanceStatus } from '../../common/enums/attendance-status.enum.js';
import { DayType } from '../../common/enums/day-type.enum.js';

export type AttendanceDocument = HydratedDocument<Attendance>;

@Schema({ timestamps: true })
export class Attendance {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
  })
  employeeId!: mongoose.Types.ObjectId;

  @Prop({ type: Date, required: true })
  date!: Date;

  @Prop({ type: Date, default: null })
  checkIn!: Date | null;

  @Prop({ type: Date, default: null })
  checkOut!: Date | null;

  @Prop({
    type: String,
    enum: AttendanceStatus,
    default: AttendanceStatus.PRESENT,
  })
  status!: AttendanceStatus;

  @Prop({ type: Number, default: null })
  workingHours!: number | null;

  @Prop({
    type: String,
    enum: [...Object.values(DayType), null],
    default: null,
  })
  dayType!: DayType | null;
}

export const AttendanceSchema = SchemaFactory.createForClass(Attendance);
AttendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });
