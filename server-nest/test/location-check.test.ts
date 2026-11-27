import { describe, expect, it } from 'vitest';
import {
  evaluateLocation,
  type LocationSample,
  type WorkplaceZone,
} from '../src/attendance/geo/location-check.js';

const NOW = new Date('2026-11-26T08:00:00.000Z');
const OFFICE: WorkplaceZone = {
  name: 'Main Office',
  latitude: 30,
  longitude: 31,
  radiusMeters: 150,
};
const BRANCH: WorkplaceZone = {
  name: 'Branch',
  latitude: 30,
  longitude: 31.01,
  radiusMeters: 150,
};

const sample = (
  longitudeOffset: number,
  overrides: Partial<LocationSample> = {},
): LocationSample => ({
  latitude: 30,
  longitude: 31 + longitudeOffset,
  accuracy: 10,
  capturedAt: NOW.getTime(),
  ...overrides,
});

describe('evaluateLocation', () => {
  it('accepts a reading at the office', () => {
    expect(evaluateLocation(sample(0), [OFFICE], NOW)).toEqual({
      kind: 'INSIDE',
      zone: OFFICE,
      distanceMeters: 0,
    });
  });

  it('accepts a reading inside the radius and reports the distance', () => {
    expect(evaluateLocation(sample(0.001), [OFFICE], NOW)).toMatchObject({
      kind: 'INSIDE',
      distanceMeters: 96,
    });
  });

  it('refuses a reading outside the radius', () => {
    expect(evaluateLocation(sample(0.002), [OFFICE], NOW)).toMatchObject({
      kind: 'OUTSIDE',
      distanceMeters: 193,
    });
  });

  it('gives the benefit of the doubt up to the reported accuracy', () => {
    expect(
      evaluateLocation(sample(0.002, { accuracy: 100 }), [OFFICE], NOW).kind,
    ).toBe('INSIDE');
  });

  it('never gives more than 100 meters of tolerance', () => {
    expect(
      evaluateLocation(sample(0.004, { accuracy: 190 }), [OFFICE], NOW).kind,
    ).toBe('OUTSIDE');
  });

  it('does not trust a reading that is too imprecise', () => {
    expect(
      evaluateLocation(sample(0, { accuracy: 250 }), [OFFICE], NOW),
    ).toEqual({ kind: 'LOW_ACCURACY' });
  });

  it('rejects a stale or future reading', () => {
    const old = evaluateLocation(
      sample(0, { capturedAt: NOW.getTime() - 180_000 }),
      [OFFICE],
      NOW,
    );
    const future = evaluateLocation(
      sample(0, { capturedAt: NOW.getTime() + 180_000 }),
      [OFFICE],
      NOW,
    );

    expect(old).toEqual({ kind: 'STALE' });
    expect(future).toEqual({ kind: 'STALE' });
  });

  it('uses the nearest of several locations', () => {
    expect(
      evaluateLocation(sample(0.011), [OFFICE, BRANCH], NOW),
    ).toMatchObject({
      kind: 'INSIDE',
      zone: BRANCH,
    });
  });

  it('requires at least one location', () => {
    expect(() => evaluateLocation(sample(0), [], NOW)).toThrow(
      'At least one work location is required',
    );
  });
});
