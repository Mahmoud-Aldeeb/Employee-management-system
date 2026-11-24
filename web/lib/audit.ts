import { AUDIT_FIELD_LABELS } from "@/lib/constants";
import type { AuditChange } from "@/types";

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Africa/Cairo",
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Africa/Cairo",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export function formatAuditTimestamp(iso: string) {
  const instant = Date.parse(iso);
  return {
    date: dateFormatter.format(instant),
    time: timeFormatter.format(instant),
  };
}

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
