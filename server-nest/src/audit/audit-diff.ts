import type { AuditChange } from './audit.types.js';

function normalize(value: unknown) {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return value ?? null;
}

export function diffFields(
  before: object,
  after: object,
  fields: readonly string[],
): AuditChange[] {
  const previous = before as Record<string, unknown>;
  const next = after as Record<string, unknown>;
  const changes: AuditChange[] = [];

  for (const field of fields) {
    if (next[field] === undefined) continue;
    const from = normalize(previous[field]);
    const to = normalize(next[field]);
    if (from !== to) changes.push({ field, from, to });
  }

  return changes;
}

export function describeValues(values: Record<string, unknown>): AuditChange[] {
  return Object.entries(values).map(([field, value]) => ({
    field,
    from: null,
    to: normalize(value),
  }));
}
