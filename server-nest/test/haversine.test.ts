import { describe, expect, it } from 'vitest';
import { distanceMeters } from '../src/attendance/geo/haversine.js';

describe('distanceMeters', () => {
  it('is zero for the same point', () => {
    expect(
      distanceMeters(
        { latitude: 30, longitude: 31 },
        { latitude: 30, longitude: 31 },
      ),
    ).toBe(0);
  });

  it('measures one degree of latitude as about 111.2 km', () => {
    const meters = distanceMeters(
      { latitude: 30, longitude: 31 },
      { latitude: 31, longitude: 31 },
    );

    expect(Math.abs(meters - 111_195)).toBeLessThan(1);
  });

  it('shrinks a degree of longitude with the latitude', () => {
    const meters = distanceMeters(
      { latitude: 30, longitude: 31 },
      { latitude: 30, longitude: 31.001 },
    );

    expect(meters).toBeCloseTo(96.3, 0);
  });

  it('is symmetric', () => {
    const a = { latitude: 30.0444, longitude: 31.2357 };
    const b = { latitude: 30.0626, longitude: 31.2497 };

    expect(distanceMeters(a, b)).toBeCloseTo(distanceMeters(b, a), 6);
  });
});
