import { describe, expect, it } from "vitest";
import { formatTimestamp } from "@/lib/timestamps";

describe("formatTimestamp", () => {
  it("shows Cairo time in winter", () => {
    expect(formatTimestamp("2026-01-15T22:30:00.000Z")).toEqual({
      date: "16 Jan 2026",
      time: "00:30",
    });
  });

  it("follows daylight saving time in summer", () => {
    expect(formatTimestamp("2026-07-15T21:30:00.000Z")).toEqual({
      date: "16 Jul 2026",
      time: "00:30",
    });
  });
});
