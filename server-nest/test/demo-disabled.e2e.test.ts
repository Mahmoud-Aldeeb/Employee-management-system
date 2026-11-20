import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestContext } from './utils/test-app.js';

describe('Demo mode (disabled)', () => {
  let ctx: Awaited<ReturnType<typeof createTestContext>>;

  beforeAll(async () => {
    ctx = await createTestContext({ demoMode: false });
  });

  afterAll(async () => {
    await ctx.close();
  });

  it('reports that demo mode is off', async () => {
    const res = await request(ctx.server).get('/api/demo/status');

    expect(res.body).toEqual({ enabled: false });
  });

  it('refuses demo logins', async () => {
    const res = await request(ctx.server)
      .post('/api/demo/login')
      .send({ role: 'admin' });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Demo mode is disabled');
  });
});
