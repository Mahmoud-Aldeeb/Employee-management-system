const formatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Africa/Cairo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

function cairoParts(date: Date) {
  const values: Record<string, number> = {};
  for (const part of formatter.formatToParts(date)) {
    if (part.type !== 'literal') values[part.type] = Number(part.value);
  }
  return {
    year: values.year,
    month: values.month,
    day: values.day,
    hour: values.hour,
    minute: values.minute,
  };
}

export function cairoDay(date: Date = new Date()) {
  const { year, month, day } = cairoParts(date);
  return new Date(Date.UTC(year, month - 1, day));
}

export function cairoMinutesOfDay(date: Date = new Date()) {
  const { hour, minute } = cairoParts(date);
  return hour * 60 + minute;
}

export function cairoMonthRange(date: Date = new Date()) {
  const { year, month } = cairoParts(date);
  return {
    start: new Date(Date.UTC(year, month - 1, 1)),
    end: new Date(Date.UTC(year, month, 1)),
  };
}

const timeFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Africa/Cairo',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Africa/Cairo',
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

export function formatCairoTime(date: Date) {
  return timeFormatter.format(date);
}

export function formatCairoDate(date: Date) {
  return dateFormatter.format(date);
}

function cairoOffsetMs(instant: Date) {
  const { year, month, day, hour, minute } = cairoParts(instant);
  return Date.UTC(year, month - 1, day, hour, minute) - instant.getTime();
}

export function cairoDayStart(day: Date) {
  const utcMidnight = day.getTime();
  const guess = utcMidnight - cairoOffsetMs(new Date(utcMidnight));
  return new Date(utcMidnight - cairoOffsetMs(new Date(guess)));
}
