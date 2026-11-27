import { AxiosError, type AxiosResponse } from "axios";
import { describe, expect, it } from "vitest";
import { describeClockError } from "@/lib/clock-problems";
import { LocationRequestError } from "@/lib/geolocation";

function apiError(status: number, data: Record<string, unknown>) {
  return new AxiosError(
    "Request failed",
    "ERR_BAD_REQUEST",
    undefined,
    undefined,
    {
      status,
      statusText: "",
      headers: {},
      config: {},
      data,
    } as AxiosResponse,
  );
}

describe("describeClockError", () => {
  it("explains every device problem", () => {
    expect(
      describeClockError(new LocationRequestError("PERMISSION_DENIED")).title,
    ).toBe("Location access is blocked");
    expect(
      describeClockError(new LocationRequestError("UNAVAILABLE")).title,
    ).toBe("Your location is unavailable");
    expect(describeClockError(new LocationRequestError("TIMEOUT")).title).toBe(
      "Finding your location took too long",
    );
    expect(
      describeClockError(new LocationRequestError("UNSUPPORTED")).title,
    ).toBe("This browser cannot share a location");
  });

  it("keeps the distance the server reported", () => {
    expect(
      describeClockError(
        apiError(403, {
          error: "You are 420 m from Main Office (allowed 150 m).",
          code: "OUTSIDE_WORKPLACE",
        }),
      ),
    ).toEqual({
      title: "You are not at a work location",
      detail: "You are 420 m from Main Office (allowed 150 m).",
    });
  });

  it("titles the other location refusals", () => {
    const title = (code: string) =>
      describeClockError(apiError(422, { error: "x", code })).title;

    expect(title("LOCATION_REQUIRED")).toBe("Location access is required");
    expect(title("LOCATION_LOW_ACCURACY")).toBe(
      "Your location is not precise enough",
    );
    expect(title("LOCATION_STALE")).toBe("Your device clock looks wrong");
  });

  it("falls back to the message for any other error", () => {
    expect(
      describeClockError(
        apiError(409, { error: "Attendance already recorded for today" }),
      ),
    ).toEqual({
      title: "Could not record your attendance",
      detail: "Attendance already recorded for today",
    });
    expect(describeClockError(new Error("boom"))).toEqual({
      title: "Could not record your attendance",
      detail: "boom",
    });
  });
});
