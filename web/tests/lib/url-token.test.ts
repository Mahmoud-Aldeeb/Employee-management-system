import { describe, expect, it } from "vitest";
import { readTokenFromHash } from "@/lib/url-token";

describe("readTokenFromHash", () => {
  it("reads the token with or without the leading hash", () => {
    expect(readTokenFromHash("#token=abc-123_XYZ")).toBe("abc-123_XYZ");
    expect(readTokenFromHash("token=abc")).toBe("abc");
  });

  it("decodes encoded characters", () => {
    expect(readTokenFromHash("#token=a%2Fb")).toBe("a/b");
  });

  it("returns an empty string when there is no token", () => {
    expect(readTokenFromHash("")).toBe("");
    expect(readTokenFromHash("#other=1")).toBe("");
  });
});
