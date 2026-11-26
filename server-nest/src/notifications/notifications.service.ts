import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import type { ListNotificationsQueryDto } from './dto/list-notifications-query.dto.js';
import type { NotificationPage } from './notification.types.js';
import { Notification } from './schemas/notification.schema.js';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<Notification>,
  ) {}

  async list(
    userId: string,
    query: ListNotificationsQueryDto,
  ): Promise<NotificationPage> {
    const { page, limit, unread } = query;
    const filter = { userId, ...(unread ? { readAt: null } : {}) };

    const [rows, total, unreadCount] = await Promise.all([
      this.notificationModel
        .find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec(),
      this.notificationModel.countDocuments(filter).exec(),
      this.countUnread(userId),
    ]);

    return {
      data: rows.map((row) => ({
        id: String(row._id),
        type: row.type,
        title: row.title,
        message: row.message,
        link: row.link,
        readAt: row.readAt,
        createdAt: row.createdAt,
      })),
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      unreadCount,
    };
  }

  async unreadCount(userId: string) {
    return { count: await this.countUnread(userId) };
  }

  async markRead(userId: string, id: string) {
    const result = await this.notificationModel
      .updateOne(
        { _id: id, userId, readAt: null },
        { $set: { readAt: new Date() } },
      )
      .exec();

    if (result.matchedCount === 0) {
      const owned = await this.notificationModel.exists({ _id: id, userId });
      if (!owned) throw new NotFoundException('Notification not found');
    }

    return { success: true };
  }

  async markAllRead(userId: string) {
    const result = await this.notificationModel
      .updateMany({ userId, readAt: null }, { $set: { readAt: new Date() } })
      .exec();

    return { success: true, updated: result.modifiedCount };
  }

  private countUnread(userId: string) {
    return this.notificationModel
      .countDocuments({ userId, readAt: null })
      .exec();
  }
}
