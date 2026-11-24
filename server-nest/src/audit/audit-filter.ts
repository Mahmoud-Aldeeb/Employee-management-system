import { cairoDayStart } from '../common/utils/cairo-time.js';
import type { ListAuditLogsQueryDto } from './dto/list-audit-logs-query.dto.js';

const DAY_MS = 24 * 60 * 60 * 1000;

type AuditFilterInput = Pick<
  ListAuditLogsQueryDto,
  'action' | 'search' | 'from' | 'to'
>;

export function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function buildAuditFilter(query: AuditFilterInput, demo: boolean) {
  const term = query.search?.trim();
  const pattern = term ? new RegExp(escapeRegex(term), 'i') : null;
  const createdAt = {
    ...(query.from ? { $gte: cairoDayStart(new Date(query.from)) } : {}),
    ...(query.to
      ? { $lt: cairoDayStart(new Date(Date.parse(query.to) + DAY_MS)) }
      : {}),
  };

  return {
    isDemo: demo,
    ...(query.action ? { action: query.action } : {}),
    ...(Object.keys(createdAt).length > 0 ? { createdAt } : {}),
    ...(pattern
      ? { $or: [{ actorEmail: pattern }, { targetLabel: pattern }] }
      : {}),
  };
}
