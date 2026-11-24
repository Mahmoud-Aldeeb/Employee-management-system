import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { ClientSession, Model } from 'mongoose';
import type { JwtPayload } from '../auth/strategies/jwt.strategy.js';
import { isDemoEmail } from '../demo/demo.constants.js';
import { buildAuditFilter } from './audit-filter.js';
import type { AuditAction, AuditChange, AuditEvent } from './audit.types.js';
import type { ListAuditLogsQueryDto } from './dto/list-audit-logs-query.dto.js';
import { AuditLog } from './schemas/audit-log.schema.js';

export interface AuditLogView {
  id: string;
  action: AuditAction;
  actorId: string;
  actorEmail: string;
  targetId: string | null;
  targetLabel: string;
  changes: AuditChange[];
  createdAt: Date;
}

export interface AuditLogPage {
  data: AuditLogView[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

function toDocument(event: AuditEvent) {
  return {
    action: event.action,
    actorId: event.actor.id,
    actorEmail: event.actor.email,
    targetId: event.targetId ? String(event.targetId) : undefined,
    targetLabel: event.targetLabel ?? '',
    changes: event.changes ?? [],
    isDemo: isDemoEmail(event.actor.email),
  };
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectModel(AuditLog.name) private readonly auditModel: Model<AuditLog>,
  ) {}

  async record(events: AuditEvent | AuditEvent[], session?: ClientSession) {
    const list = Array.isArray(events) ? events : [events];
    if (list.length === 0) return;

    await this.auditModel.insertMany(list.map(toDocument), { session });
  }

  async recordBestEffort(event: AuditEvent) {
    try {
      await this.record(event);
    } catch (error) {
      this.logger.warn(
        `Failed to record audit event ${event.action}: ${String(error)}`,
      );
    }
  }

  async list(
    query: ListAuditLogsQueryDto,
    viewer: JwtPayload,
  ): Promise<AuditLogPage> {
    const filter = buildAuditFilter(query, isDemoEmail(viewer.email));
    const { page, limit } = query;

    const [logs, total] = await Promise.all([
      this.auditModel
        .find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec(),
      this.auditModel.countDocuments(filter).exec(),
    ]);

    return {
      data: logs.map((log) => ({
        id: String(log._id),
        action: log.action,
        actorId: String(log.actorId),
        actorEmail: log.actorEmail,
        targetId: log.targetId ? String(log.targetId) : null,
        targetLabel: log.targetLabel,
        changes: log.changes,
        createdAt: log.createdAt,
      })),
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }
}
