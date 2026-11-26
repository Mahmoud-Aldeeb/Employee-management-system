import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { randomBytes } from 'crypto';
import type { Model } from 'mongoose';
import { sha256 } from '../../common/utils/sha256.js';
import {
  PASSWORD_TOKEN_TTL_S,
  PasswordTokenPurpose,
} from './password-token-purpose.js';
import { PasswordToken } from './password-token.schema.js';

@Injectable()
export class PasswordTokensService {
  constructor(
    @InjectModel(PasswordToken.name)
    private readonly tokenModel: Model<PasswordToken>,
  ) {}

  async issue(userId: string, purpose: PasswordTokenPurpose) {
    const token = randomBytes(32).toString('base64url');

    await this.tokenModel.deleteMany({ userId, purpose }).exec();
    await this.tokenModel.create({
      userId,
      purpose,
      tokenHash: sha256(token),
      expiresAt: new Date(Date.now() + PASSWORD_TOKEN_TTL_S[purpose] * 1000),
    });

    return token;
  }

  async consume(token: string) {
    const record = await this.tokenModel
      .findOneAndDelete({
        tokenHash: sha256(token),
        expiresAt: { $gt: new Date() },
      })
      .lean()
      .exec();

    return record
      ? { userId: String(record.userId), purpose: record.purpose }
      : null;
  }

  async revokeAllForUser(userId: string) {
    await this.tokenModel.deleteMany({ userId }).exec();
  }

  async issuedWithin(
    userId: string,
    purpose: PasswordTokenPurpose,
    windowMs: number,
  ) {
    const recent = await this.tokenModel
      .exists({
        userId,
        purpose,
        createdAt: { $gt: new Date(Date.now() - windowMs) },
      })
      .exec();

    return recent !== null;
  }
}
