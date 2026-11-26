import { AUDIT_FIELD_LABELS } from "@/lib/constants";
import type { AuditChange } from "@/types";

export function formatAuditValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }
  return JSON.stringify(value);
}

export function formatAuditChange({ field, from, to }: AuditChange) {
  const label = AUDIT_FIELD_LABELS[field] ?? field;
  if (from === null || from === undefined) {
    return `${label}: ${formatAuditValue(to)}`;
  }
  return `${label}: ${formatAuditValue(from)} → ${formatAuditValue(to)}`;
}
