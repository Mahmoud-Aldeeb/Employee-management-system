import { afterEach, describe, expect, it } from "vitest";
import { LocationRequestError, requestPosition } from "@/lib/geolocation";
import {
  removeGeolocation,
  stubPosition,
  stubPositionError,
} from "../utils/geolocation";

afterEach(removeGeolocation);

describe("requestPosition", () => {
  it("returns the reading together with the time the device took it", async () => {
    const spy = stubPosition();

    await expect(requestPosition()).resolves.toEqual({
      latitude: 30.0444,
      longitude: 31.2357,
      accuracy: 12,
      capturedAt: 1_700_000_000_000,
    });
    expect(spy).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
      {
        enableHighAccuracy: true,
        timeout: 12_000,
        maximumAge: 0,
      },
    );
  });

  it("lets the caller shorten the wait", async () => {
    const spy = stubPosition();

    await requestPosition({ timeout: 5_000 });

    expect(spy.mock.calls[0][2]).toEqual({
      enableHighAccuracy: true,
      timeout: 5_000,
      maximumAge: 0,
    });
  });

  it.each([
    [1, "PERMISSION_DENIED"],
    [2, "UNAVAILABLE"],
    [3, "TIMEOUT"],
    [99, "UNAVAILABLE"],
  ])("maps the device error %i to %s", async (code, reason) => {
    stubPositionError(code);

    const failure = await requestPosition().catch((error: unknown) => error);

    expect(failure).toBeInstanceOf(LocationRequestError);
    expect(failure).toMatchObject({ reason });
  });

  it("reports a browser without geolocation", async () => {
    await expect(requestPosition()).rejects.toMatchObject({
      reason: "UNSUPPORTED",
    });
  });
});
