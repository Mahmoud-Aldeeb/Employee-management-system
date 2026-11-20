import { addDays, format, parseISO } from "date-fns";

const cairoFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Africa/Cairo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function cairoDateKey(date: Date = new Date()) {
  return cairoFormatter.format(date);
}

export function addDaysToKey(key: string, days: number) {
  return format(addDays(parseISO(key), days), "yyyy-MM-dd");
}

export function dayKey(value: string) {
  return value.slice(0, 10);
}

export function dayFromKey(value: string) {
  return parseISO(dayKey(value));
}

export function formatDayRange(start: string, end: string) {
  const from = dayFromKey(start);
  const to = dayFromKey(end);

  return dayKey(start) === dayKey(end)
    ? format(from, "MMM dd, yyyy")
    : `${format(from, "MMM dd")} - ${format(to, "MMM dd, yyyy")}`;
}
