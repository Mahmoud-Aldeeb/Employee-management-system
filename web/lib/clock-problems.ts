import { getErrorCode, getErrorMessage } from "@/lib/errors";
import { LocationRequestError, type LocationFailure } from "@/lib/geolocation";

export interface ClockProblem {
  title: string;
  detail: string;
}

const DEVICE_PROBLEMS: Record<LocationFailure, ClockProblem> = {
  PERMISSION_DENIED: {
    title: "Location access is blocked",
    detail:
      "Allow location for this site in your browser settings, then try again.",
  },
  UNAVAILABLE: {
    title: "Your location is unavailable",
    detail: "Turn on GPS or Wi-Fi, then try again.",
  },
  TIMEOUT: {
    title: "Finding your location took too long",
    detail: "Move near a window or outdoors and try again.",
  },
  UNSUPPORTED: {
    title: "This browser cannot share a location",
    detail: "Open the app on your phone or in an up-to-date browser.",
  },
};

const SERVER_TITLES: Record<string, string> = {
  LOCATION_REQUIRED: "Location access is required",
  LOCATION_LOW_ACCURACY: "Your location is not precise enough",
  LOCATION_STALE: "Your device clock looks wrong",
  OUTSIDE_WORKPLACE: "You are not at a work location",
};

export function describeClockError(error: unknown): ClockProblem {
  if (error instanceof LocationRequestError) {
    return DEVICE_PROBLEMS[error.reason];
  }

  const code = getErrorCode(error);
  return {
    title: (code && SERVER_TITLES[code]) || "Could not record your attendance",
    detail: getErrorMessage(error),
  };
}
