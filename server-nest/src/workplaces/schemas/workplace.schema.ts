import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

export const DEFAULT_RADIUS_M = 150;
export const MIN_RADIUS_M = 50;
export const MAX_RADIUS_M = 2000;

export type WorkplaceDocument = HydratedDocument<Workplace>;

@Schema({ timestamps: true })
export class Workplace {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ type: Number, required: true, min: -90, max: 90 })
  latitude!: number;

  @Prop({ type: Number, required: true, min: -180, max: 180 })
  longitude!: number;

  @Prop({
    type: Number,
    default: DEFAULT_RADIUS_M,
    min: MIN_RADIUS_M,
    max: MAX_RADIUS_M,
  })
  radiusMeters!: number;

  @Prop({ default: true })
  isActive!: boolean;

  @Prop({ default: false })
  isDemo!: boolean;
}

export const WorkplaceSchema = SchemaFactory.createForClass(Workplace);
WorkplaceSchema.index({ isDemo: 1, name: 1 }, { unique: true });
