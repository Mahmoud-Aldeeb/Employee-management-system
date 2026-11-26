import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AccountFunctions } from '../src/inngest/account-functions.service.js';
import { DEMO_ADMIN_EMAIL } from '../src/demo/demo.constants.js';
import { employeePayload } from './utils/factories.js';
import { createTestContext } from './utils/test-app.js';

describe('Invitations in demo mode', () => {
  let ctx: Awaited<ReturnType<typeof createTestContext>>;

  beforeAll(async () => {
    ctx = await createTestContext({ demoMode: true });
  });

  afterAll(async () => {
    await ctx.close();
  });

  it('asks the demo admin to set a password instead of inviting', async () => {
    const admin = request.agent(ctx.server);
    expect(
      (await admin.post('/api/demo/login').send({ role: 'admin' })).status,
    ).toBe(200);

    const res = await admin
      .post('/api/employees')
      .send(employeePayload('demo.invite@test.local', { password: undefined }));

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invitations are disabled in demo mode');
  });

  it('never sends reset links to demo accounts', async () => {
    const accounts = ctx.app.get(AccountFunctions, { strict: false });

    expect(await accounts.findResetTarget(DEMO_ADMIN_EMAIL)).toBeNull();
  });
});
