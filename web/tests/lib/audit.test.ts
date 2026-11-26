import { describe, expect, it } from "vitest";
import { formatAuditChange, formatAuditValue } from "@/lib/audit";

describe("formatAuditValue", () => {
  it("shows a dash for empty values", () => {
    expect(formatAuditValue(null)).toBe("—");
    expect(formatAuditValue(undefined)).toBe("—");
    expect(formatAuditValue("")).toBe("—");
  });

  it("prints primitives as they are", () => {
    expect(formatAuditValue(6500)).toBe("6500");
    expect(formatAuditValue("Lead")).toBe("Lead");
    expect(formatAuditValue(false)).toBe("false");
  });
});

describe("formatAuditChange", () => {
  it("shows the old and the new value", () => {
    expect(
      formatAuditChange({ field: "basicSalary", from: 6000, to: 6500 }),
    ).toBe("Basic salary: 6000 → 6500");
  });

  it("shows only the value for something that was just set", () => {
    expect(
      formatAuditChange({ field: "department", from: null, to: "Sales" }),
    ).toBe("Department: Sales");
  });

  it("falls back to the raw field name", () => {
    expect(formatAuditChange({ field: "custom", from: "a", to: "b" })).toBe(
      "custom: a → b",
    );
  });
});
