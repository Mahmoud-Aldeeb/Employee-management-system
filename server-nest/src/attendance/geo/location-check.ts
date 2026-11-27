import { distanceMeters, type Coordinates } from './haversine.js';

export const MAX_READING_AGE_MS = 120_000;
export const MAX_ACCURACY_M = 200;
export const MAX_TOLERANCE_M = 100;

export interface LocationSample extends Coordinates {
  accuracy: number;
  capturedAt: number;
}

export interface WorkplaceZone extends Coordinates {
  name: string;
  radiusMeters: number;
}

export type LocationVerdict =
  | { kind: 'INSIDE'; zone: WorkplaceZone; distanceMeters: number }
  | { kind: 'OUTSIDE'; zone: WorkplaceZone; distanceMeters: number }
  | { kind: 'LOW_ACCURACY' }
  | { kind: 'STALE' };

export function evaluateLocation(
  sample: LocationSample,
  zones: WorkplaceZone[],
  now: Date,
): LocationVerdict {
  if (zones.length === 0) {
    throw new Error('At least one work location is required');
  }
  if (Math.abs(now.getTime() - sample.capturedAt) > MAX_READING_AGE_MS) {
    return { kind: 'STALE' };
  }
  if (sample.accuracy > MAX_ACCURACY_M) {
    return { kind: 'LOW_ACCURACY' };
  }

  const tolerance = Math.min(sample.accuracy, MAX_TOLERANCE_M);
  const nearest = zones
    .map((zone) => {
      const distance = distanceMeters(sample, zone);
      return { zone, distance, slack: distance - zone.radiusMeters };
    })
    .reduce((best, candidate) =>
      candidate.slack < best.slack ? candidate : best,
    );
  const rounded = Math.round(nearest.distance);

  return nearest.slack <= tolerance
    ? { kind: 'INSIDE', zone: nearest.zone, distanceMeters: rounded }
    : { kind: 'OUTSIDE', zone: nearest.zone, distanceMeters: rounded };
}
