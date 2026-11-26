import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { ClientSession, Model, Types } from 'mongoose';
import { isDemoEmail } from '../demo/demo.constants.js';
import { UsersService } from '../users/users.service.js';
import type { NotificationContent } from './notification.types.js';
import { Notification } from './schemas/notification.schema.js';

type RecipientId = string | Types.ObjectId;

const INSERT_BATCH_SIZE = 500;

@Injectable()
export class NotificationPublisher {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<Notification>,
    private readonly users: UsersService,
  ) {}

  async notify(
    recipients: RecipientId[],
    content: NotificationContent,
    session?: ClientSession,
  ) {
    const unique = [...new Set(recipients.map(String))];

    for (let start = 0; start < unique.length; start += INSERT_BATCH_SIZE) {
      const batch = unique.slice(start, start + INSERT_BATCH_SIZE);
      await this.notificationModel.insertMany(
        batch.map((userId) => ({ userId, ...content })),
        { session, ordered: false },
      );
    }
  }

  async notifyAdmins(
    content: NotificationContent,
    scope: { demo: boolean },
    session?: ClientSession,
  ) {
    const admins = await this.users.findAdmins();
    const recipients = admins
      .filter((admin) => isDemoEmail(admin.email) === scope.demo)
      .map((admin) => admin._id);

    await this.notify(recipients, content, session);
  }
}
