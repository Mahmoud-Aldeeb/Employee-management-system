import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Role } from '../../common/enums/role.enum.js';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  email!: string;

  @Prop({ required: true, select: false })
  password!: string;

  @Prop({ type: String, enum: Role, default: Role.EMPLOYEE })
  role!: Role;

  @Prop({ type: String, select: false, default: null })
  refreshTokenHash?: string | null;
}

export const UserSchema = SchemaFactory.createForClass(User);
