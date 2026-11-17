import type { AttendanceRecord, DayType } from "@/types";

const DAY_TYPE_STYLES: Record<DayType, string> = {
  "Full Day": "badge-success",
  "Three Quarter Day": "bg-blue-100 text-blue-700",
  "Half Day": "badge-warning",
  "Short Day": "badge-danger",
};

export function getWorkingHoursDisplay(record: AttendanceRecord) {
  const ongoing =
    record.workingHours === null && record.checkIn && !record.checkOut;
  const hours = ongoing
    ? (Date.now() - new Date(record.checkIn as string).getTime()) / 3_600_000
    : record.workingHours;

  if (hours === null) return "—";

  const totalMinutes = Math.round(hours * 60);
  const label = `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`;
  return ongoing ? `${label} (ongoing)` : label;
}

export function getDayTypeDisplay(record: AttendanceRecord) {
  if (record.dayType) {
    return {
      label: record.dayType,
      className: DAY_TYPE_STYLES[record.dayType],
    };
  }
  if (record.checkIn && !record.checkOut) {
    return { label: "In Progress", className: "bg-indigo-100 text-indigo-700" };
  }
  return null;
}
