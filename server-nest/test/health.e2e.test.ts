import request from 'supertest';
import type { Connection } from 'mongoose';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { HealthService } from '../src/health/health.service.js';
import { createTestContext } from './utils/test-app.js';

function serviceWith(connection: unknown) {
  return new HealthService(connection as Connection);
}

describe('Health', () => {
  let ctx: Awaited<ReturnType<typeof createTestContext>>;

  beforeAll(async () => {
    ctx = await createTestContext();
  });

  afterAll(async () => {
    await ctx.close();
  });

  it('answers 200 without authentication when the database is reachable', async () => {
    const res = await request(ctx.server).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.checks).toEqual({ database: 'up' });
    expect(res.body.uptimeSeconds).toBeGreaterThanOrEqual(0);
  });

  it('reports a degraded state when the ping fails', async () => {
    const failing = serviceWith({
      db: { command: () => Promise.reject(new Error('connection lost')) },
    });

    expect(await failing.check()).toMatchObject({
      status: 'degraded',
      checks: { database: 'down' },
    });
  });

  it('reports a degraded state when there is no database handle', async () => {
    expect(await serviceWith({ db: undefined }).check()).toMatchObject({
      status: 'degraded',
      checks: { database: 'down' },
    });
  });
});
