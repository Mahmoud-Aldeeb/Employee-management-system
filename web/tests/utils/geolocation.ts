import { vi } from "vitest";

export interface StubbedPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export const OFFICE_POSITION: StubbedPosition = {
  latitude: 30.0444,
  longitude: 31.2357,
  accuracy: 12,
  timestamp: 1_700_000_000_000,
};

function install(getCurrentPosition: Geolocation["getCurrentPosition"]) {
  Object.defineProperty(navigator, "geolocation", {
    value: { getCurrentPosition },
    configurable: true,
  });
}

export function stubPosition(position: StubbedPosition = OFFICE_POSITION) {
  const getCurrentPosition = vi.fn<Geolocation["getCurrentPosition"]>(
    (onSuccess) => {
      onSuccess({
        coords: {
          latitude: position.latitude,
          longitude: position.longitude,
          accuracy: position.accuracy,
        },
        timestamp: position.timestamp,
      } as GeolocationPosition);
    },
  );
  install(getCurrentPosition);
  return getCurrentPosition;
}

export function stubPositionError(code: number) {
  const getCurrentPosition = vi.fn<Geolocation["getCurrentPosition"]>(
    (_onSuccess, onError) => {
      onError?.({ code, message: "failed" } as GeolocationPositionError);
    },
  );
  install(getCurrentPosition);
  return getCurrentPosition;
}

export function removeGeolocation() {
  Reflect.deleteProperty(navigator, "geolocation");
}
