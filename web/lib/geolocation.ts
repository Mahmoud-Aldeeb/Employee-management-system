export interface DeviceLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  capturedAt: number;
}

export type LocationFailure =
  | "PERMISSION_DENIED"
  | "UNAVAILABLE"
  | "TIMEOUT"
  | "UNSUPPORTED";

export class LocationRequestError extends Error {
  constructor(readonly reason: LocationFailure) {
    super(reason);
    this.name = "LocationRequestError";
  }
}

const PERMISSION_DENIED = 1;
const TIMEOUT = 3;

const DEFAULT_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 12_000,
  maximumAge: 0,
};

function reasonOf(failure: GeolocationPositionError): LocationFailure {
  if (failure.code === PERMISSION_DENIED) return "PERMISSION_DENIED";
  if (failure.code === TIMEOUT) return "TIMEOUT";
  return "UNAVAILABLE";
}

export function requestPosition(
  overrides: PositionOptions = {},
): Promise<DeviceLocation> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new LocationRequestError("UNSUPPORTED"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          capturedAt: position.timestamp,
        }),
      (failure) => reject(new LocationRequestError(reasonOf(failure))),
      { ...DEFAULT_OPTIONS, ...overrides },
    );
  });
}
