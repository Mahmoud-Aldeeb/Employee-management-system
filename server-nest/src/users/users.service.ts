import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { ClientSession, Model } from 'mongoose';
import { User } from './schemas/user.schema.js';

type NewUser = Pick<User, 'email' | 'password' | 'role'>;
type UserChanges = Partial<
  Pick<User, 'email' | 'password' | 'role' | 'refreshTokenHash'>
>;

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async create(data: NewUser, session?: ClientSession) {
    const [user] = await this.userModel.create([data], { session });
    return user;
  }

  updateById(id: string, changes: UserChanges, session?: ClientSession) {
    return this.userModel.updateOne({ _id: id }, changes, { session }).exec();
  }

  findByEmailWithPassword(email: string) {
    return this.userModel.findOne({ email }).select('+password').exec();
  }

  findByIdWithPassword(id: string) {
    return this.userModel.findById(id).select('+password').exec();
  }

  findByIdWithRefreshHash(id: string) {
    return this.userModel.findById(id).select('+refreshTokenHash').exec();
  }

  setRefreshTokenHash(id: string, hash: string | null) {
    return this.userModel
      .updateOne({ _id: id }, { refreshTokenHash: hash })
      .exec();
  }

  updatePassword(id: string, hashedPassword: string) {
    return this.userModel
      .updateOne(
        { _id: id },
        { password: hashedPassword, refreshTokenHash: null },
      )
      .exec();
  }
}
