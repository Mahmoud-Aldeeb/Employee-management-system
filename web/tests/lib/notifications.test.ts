import { describe, expect, it } from "vitest";
import { formatBadgeCount, isInternalLink } from "@/lib/notifications";

describe("formatBadgeCount", () => {
  it("prints the count and caps it at 99+", () => {
    expect(formatBadgeCount(3)).toBe("3");
    expect(formatBadgeCount(99)).toBe("99");
    expect(formatBadgeCount(100)).toBe("99+");
  });
});

describe("isInternalLink", () => {
  it("accepts paths inside the app only", () => {
    expect(isInternalLink("/leave")).toBe(true);
    expect(isInternalLink("https://evil.example")).toBe(false);
    expect(isInternalLink("//evil.example")).toBe(false);
    expect(isInternalLink("leave")).toBe(false);
  });
});
