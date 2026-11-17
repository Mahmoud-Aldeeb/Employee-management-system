import { describe, expect, it } from "vitest";
import { addDaysToKey, cairoDateKey, dayFromKey, dayKey } from "@/lib/dates";

describe("cairoDateKey", () => {
  it("uses the Cairo calendar day, not the UTC one", () => {
    expect(cairoDateKey(new Date("2026-11-15T21:59:00Z"))).toBe("2026-11-15");
    expect(cairoDateKey(new Date("2026-11-15T22:30:00Z"))).toBe("2026-11-16");
  });

  it("follows daylight saving time in summer", () => {
    expect(cairoDateKey(new Date("2026-07-15T21:30:00Z"))).toBe("2026-07-16");
  });
});

describe("addDaysToKey", () => {
  it("moves across month boundaries", () => {
    expect(addDaysToKey("2026-11-30", 1)).toBe("2026-12-01");
    expect(addDaysToKey("2026-03-01", -1)).toBe("2026-02-28");
  });
});

describe("dayKey and dayFromKey", () => {
  it("keeps the stored calendar day regardless of the time zone", () => {
    expect(dayKey("2026-11-16T00:00:00.000Z")).toBe("2026-11-16");

    const date = dayFromKey("2026-11-16T00:00:00.000Z");
    expect([date.getFullYear(), date.getMonth(), date.getDate()]).toEqual([
      2026, 10, 16,
    ]);
  });
});
