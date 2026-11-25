import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { type HydratedDocument } from 'mongoose';
import { NotificationType } from '../notification.types.js';

export const NOTIFICATION_RETENTION_SECONDS = 90 * 24 * 60 * 60;

export type NotificationDocument = HydratedDocument<Notification>;

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class Notification {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  userId!: mongoose.Types.ObjectId;

  @Prop({ type: String, enum: NotificationType, required: true })
  type!: NotificationType;

  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  message!: string;

  @Prop({ required: true })
  link!: string;

  @Prop({ type: Date, default: null })
  readAt!: Date | null;

  createdAt!: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
NotificationSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: NOTIFICATION_RETENTION_SECONDS },
);
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, readAt: 1 });
