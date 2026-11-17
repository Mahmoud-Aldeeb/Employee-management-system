import { afterEach, describe, expect, it, vi } from "vitest";
import { getDayTypeDisplay, getWorkingHoursDisplay } from "@/lib/attendance";
import type { AttendanceRecord } from "@/types";

const base: AttendanceRecord = {
  _id: "a1",
  employeeId: "e1",
  date: "2026-11-16T00:00:00.000Z",
  checkIn: null,
  checkOut: null,
  status: "PRESENT",
  workingHours: null,
  dayType: null,
};

afterEach(() => {
  vi.useRealTimers();
});

describe("getWorkingHoursDisplay", () => {
  it("formats stored hours as hours and minutes", () => {
    expect(getWorkingHoursDisplay({ ...base, workingHours: 7.5 })).toBe(
      "7h 30m",
    );
    expect(getWorkingHoursDisplay({ ...base, workingHours: 8 })).toBe("8h 0m");
  });

  it("computes live hours while still checked in", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-16T12:00:00Z"));

    const record = { ...base, checkIn: "2026-11-16T10:30:00Z" };

    expect(getWorkingHoursDisplay(record)).toBe("1h 30m (ongoing)");
  });

  it("shows a dash when nothing was recorded", () => {
    expect(getWorkingHoursDisplay(base)).toBe("—");
  });
});

describe("getDayTypeDisplay", () => {
  it("maps each day type to its badge style", () => {
    expect(getDayTypeDisplay({ ...base, dayType: "Full Day" })).toEqual({
      label: "Full Day",
      className: "badge-success",
    });
    expect(
      getDayTypeDisplay({ ...base, dayType: "Short Day" })?.className,
    ).toBe("badge-danger");
  });

  it("reports an open day as in progress", () => {
    const record = { ...base, checkIn: "2026-11-16T08:00:00Z" };

    expect(getDayTypeDisplay(record)?.label).toBe("In Progress");
  });

  it("returns null when there is nothing to show", () => {
    expect(getDayTypeDisplay(base)).toBeNull();
  });
});
