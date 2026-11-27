import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Role } from '../src/common/enums/role.enum.js';
import { DemoService } from '../src/demo/demo.service.js';
import { createTestContext } from './utils/test-app.js';

const REAL_ADMIN = { email: 'admin@test.local', password: 'Admin#12345' };

interface WorkplaceRow {
  name: string;
}

describe('Work locations in demo mode', () => {
  let ctx: Awaited<ReturnType<typeof createTestContext>>;
  let realAdmin: Awaited<ReturnType<typeof ctx.login>>;
  let demoAdmin: ReturnType<typeof request.agent>;
  let demoEmployee: ReturnType<typeof request.agent>;

  const signInAsDemo = async (role: 'admin' | 'employee') => {
    const agent = request.agent(ctx.server);
    expect((await agent.post('/api/demo/login').send({ role })).status).toBe(
      200,
    );
    return agent;
  };

  const namesFor = async (agent: typeof demoAdmin) =>
    ((await agent.get('/api/workplaces')).body as WorkplaceRow[]).map(
      (row) => row.name,
    );

  beforeAll(async () => {
    ctx = await createTestContext({ demoMode: true });
    await ctx.createUser(REAL_ADMIN.email, REAL_ADMIN.password, Role.ADMIN);
    realAdmin = await ctx.login(REAL_ADMIN.email, REAL_ADMIN.password, 'admin');
    demoAdmin = await signInAsDemo('admin');
    demoEmployee = await signInAsDemo('employee');
  });

  afterAll(async () => {
    await ctx.close();
  });

  it('shows demo visitors their own locations and real admins none of them', async () => {
    expect(await namesFor(demoAdmin)).toEqual(['Cairo HQ']);
    expect(await namesFor(realAdmin as unknown as typeof demoAdmin)).toEqual(
      [],
    );
  });

  it('does not restrict demo employees', async () => {
    const policy = await demoEmployee.get('/api/attendance/policy');
    expect(policy.body.locationRequired).toBe(false);

    const res = await demoEmployee.post('/api/attendance');

    expect(res.status).toBe(200);
    expect(res.body.data.checkInLocation).toBeNull();
  });

  it('clears the demo locations added by visitors when the demo resets', async () => {
    await demoAdmin
      .post('/api/workplaces')
      .send({ name: 'Visitor Office', latitude: 30.1, longitude: 31.3 });
    expect(await namesFor(demoAdmin)).toEqual(['Cairo HQ', 'Visitor Office']);

    await ctx.app.get(DemoService, { strict: false }).reset();

    expect(await namesFor(await signInAsDemo('admin'))).toEqual(['Cairo HQ']);
  });
});
