import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { type Model } from 'mongoose';
import { AuthSession } from './schemas/auth-session.schema.js';

const MAX_SESSIONS_PER_USER = 10;

interface NewSession {
  sid: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  userAgent?: string;
}

@Injectable()
export class SessionsService {
  constructor(
    @InjectModel(AuthSession.name)
    private readonly sessionModel: Model<AuthSession>,
  ) {}

  async create(input: NewSession) {
    await this.sessionModel.create({
      sid: input.sid,
      userId: new mongoose.Types.ObjectId(input.userId),
      tokenHash: input.tokenHash,
      expiresAt: input.expiresAt,
      userAgent: input.userAgent ?? null,
      lastUsedAt: new Date(),
    });
    await this.trim(input.userId);
  }

  findActive(sid: string) {
    return this.sessionModel
      .findOne({ sid, expiresAt: { $gt: new Date() } })
      .exec();
  }

  async rotate(
    sid: string,
    currentHash: string,
    nextHash: string,
    expiresAt: Date,
  ) {
    const previous = await this.sessionModel
      .findOneAndUpdate(
        { sid, tokenHash: currentHash, expiresAt: { $gt: new Date() } },
        { tokenHash: nextHash, expiresAt, lastUsedAt: new Date() },
      )
      .exec();

    return previous !== null;
  }

  async revoke(sid: string) {
    await this.sessionModel.deleteOne({ sid }).exec();
  }

  async revokeAllForUser(userId: string) {
    await this.sessionModel.deleteMany({ userId }).exec();
  }

  private async trim(userId: string) {
    const stale = await this.sessionModel
      .find({ userId })
      .sort({ lastUsedAt: -1 })
      .skip(MAX_SESSIONS_PER_USER)
      .select('_id')
      .lean()
      .exec();

    if (stale.length > 0) {
      await this.sessionModel
        .deleteMany({ _id: { $in: stale.map((item) => item._id) } })
        .exec();
    }
  }
}
