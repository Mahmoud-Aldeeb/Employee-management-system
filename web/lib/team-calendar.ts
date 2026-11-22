import { format } from "date-fns";
import { LEAVE_TYPE_LABELS } from "@/lib/constants";
import { dayFromKey } from "@/lib/dates";
import type { TeamCalendarEntry } from "@/types";

export function monthTitle(month: string) {
  return format(dayFromKey(`${month}-01`), "MMMM yyyy");
}

export function dayTitle(date: string) {
  return format(dayFromKey(date), "EEEE, MMM dd");
}

export function entryKind(entry: TeamCalendarEntry) {
  const kind = entry.type ? LEAVE_TYPE_LABELS[entry.type] : "On leave";

  return entry.status === "PENDING" ? `${kind} (pending)` : kind;
}

export function describeEntry(entry: TeamCalendarEntry) {
  return `${entry.employeeName} · ${entryKind(entry)}`;
}
