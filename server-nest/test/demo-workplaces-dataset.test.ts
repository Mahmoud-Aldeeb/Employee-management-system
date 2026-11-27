import { describe, expect, it } from 'vitest';
import { buildDemoDataset } from '../src/demo/demo-dataset.js';
import {
  MAX_RADIUS_M,
  MIN_RADIUS_M,
} from '../src/workplaces/schemas/workplace.schema.js';

const dataset = buildDemoDataset({
  now: new Date('2026-11-21T10:00:00.000Z'),
  passwordHash: 'hash',
});

describe('demo work locations', () => {
  it('seeds one active location flagged as demo data', () => {
    expect(dataset.workplaces).toHaveLength(1);
    expect(dataset.workplaces[0]).toMatchObject({
      name: 'Cairo HQ',
      isActive: true,
      isDemo: true,
    });
  });

  it('uses a valid position and radius', () => {
    const [workplace] = dataset.workplaces;

    expect(Math.abs(workplace.latitude)).toBeLessThanOrEqual(90);
    expect(Math.abs(workplace.longitude)).toBeLessThanOrEqual(180);
    expect(workplace.radiusMeters).toBeGreaterThanOrEqual(MIN_RADIUS_M);
    expect(workplace.radiusMeters).toBeLessThanOrEqual(MAX_RADIUS_M);
  });
});
