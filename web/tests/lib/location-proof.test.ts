import { describe, expect, it } from "vitest";
import { describeLocationProof, formatDistance } from "@/lib/location-proof";

describe("formatDistance", () => {
  it("uses meters below a kilometer and kilometers above", () => {
    expect(formatDistance(420)).toBe("420 m");
    expect(formatDistance(1100)).toBe("1.1 km");
  });
});

describe("describeLocationProof", () => {
  it("describes a position at the work location", () => {
    expect(
      describeLocationProof({
        status: "INSIDE",
        workplaceName: "Main Office",
        distanceMeters: 96,
        accuracyMeters: 10,
      }),
    ).toBe("Main Office · 96 m");
  });

  it("describes a position away from it", () => {
    expect(
      describeLocationProof({
        status: "OUTSIDE",
        workplaceName: "Main Office",
        distanceMeters: 1100,
        accuracyMeters: 10,
      }),
    ).toBe("Away from Main Office · 1.1 km");
  });

  it("says when the position could not be verified", () => {
    expect(
      describeLocationProof({
        status: "UNVERIFIED",
        workplaceName: null,
        distanceMeters: null,
        accuracyMeters: null,
      }),
    ).toBe("Not verified");
  });

  it("returns nothing when no position was recorded", () => {
    expect(describeLocationProof(null)).toBeNull();
    expect(describeLocationProof(undefined)).toBeNull();
  });
});
