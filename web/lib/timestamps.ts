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

export function formatTimestamp(iso: string) {
  const instant = Date.parse(iso);
  return {
    date: dateFormatter.format(instant),
    time: timeFormatter.format(instant),
  };
}
