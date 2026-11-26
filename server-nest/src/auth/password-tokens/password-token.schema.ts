import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { type HydratedDocument } from 'mongoose';
import { PasswordTokenPurpose } from './password-token-purpose.js';

export type PasswordTokenDocument = HydratedDocument<PasswordToken>;

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class PasswordToken {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  userId!: mongoose.Types.ObjectId;

  @Prop({ type: String, enum: PasswordTokenPurpose, required: true })
  purpose!: PasswordTokenPurpose;

  @Prop({ required: true, unique: true })
  tokenHash!: string;

  @Prop({ type: Date, required: true })
  expiresAt!: Date;

  createdAt!: Date;
}

export const PasswordTokenSchema = SchemaFactory.createForClass(PasswordToken);
PasswordTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
PasswordTokenSchema.index({ userId: 1, purpose: 1 });
