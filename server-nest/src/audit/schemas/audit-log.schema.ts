import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { type HydratedDocument } from 'mongoose';
import { AuditAction, type AuditChange } from '../audit.types.js';

export const AUDIT_RETENTION_SECONDS = 180 * 24 * 60 * 60;

export type AuditLogDocument = HydratedDocument<AuditLog>;

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class AuditLog {
  @Prop({ type: String, enum: AuditAction, required: true })
  action!: AuditAction;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  actorId!: mongoose.Types.ObjectId;

  @Prop({ required: true })
  actorEmail!: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId })
  targetId?: mongoose.Types.ObjectId;

  @Prop({ default: '' })
  targetLabel!: string;

  @Prop({ type: [mongoose.Schema.Types.Mixed], default: [] })
  changes!: AuditChange[];

  @Prop({ default: false })
  isDemo!: boolean;

  createdAt!: Date;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
AuditLogSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: AUDIT_RETENTION_SECONDS },
);
AuditLogSchema.index({ isDemo: 1, createdAt: -1 });
