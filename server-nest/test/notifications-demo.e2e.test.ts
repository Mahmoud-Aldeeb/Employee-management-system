import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Role } from '../src/common/enums/role.enum.js';
import { DemoService } from '../src/demo/demo.service.js';
import { leaveWindow } from './utils/factories.js';
import { createTestContext } from './utils/test-app.js';

const REAL_ADMIN = { email: 'admin@test.local', password: 'Admin#12345' };

interface NotificationPage {
  total: number;
  unreadCount: number;
}

describe('Notifications in demo mode', () => {
  let ctx: Awaited<ReturnType<typeof createTestContext>>;
  let realAdmin: Awaited<ReturnType<typeof ctx.login>>;
  let demoAdmin: ReturnType<typeof request.agent>;
  let demoEmployee: ReturnType<typeof request.agent>;

  const pageOf = async (agent: typeof demoAdmin) => {
    const res = await agent.get('/api/notifications');
    expect(res.status).toBe(200);
    return res.body as NotificationPage;
  };

  const signInAsDemo = async (role: 'admin' | 'employee') => {
    const agent = request.agent(ctx.server);
    const res = await agent.post('/api/demo/login').send({ role });
    expect(res.status).toBe(200);
    return agent;
  };

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

  it('seeds realistic notifications for the demo accounts', async () => {
    expect(await pageOf(demoAdmin)).toMatchObject({ total: 4, unreadCount: 3 });
    expect(await pageOf(demoEmployee)).toMatchObject({
      total: 2,
      unreadCount: 1,
    });
    expect(await pageOf(realAdmin)).toMatchObject({ total: 0, unreadCount: 0 });
  });

  it('keeps demo activity away from real admins', async () => {
    const window = leaveWindow(40, 2);
    const res = await demoEmployee.post('/api/leave').send({
      type: 'ANNUAL',
      startDate: window.start,
      endDate: window.end,
      reason: 'Demo trip',
    });
    expect(res.status).toBe(201);

    expect(await pageOf(demoAdmin)).toMatchObject({ total: 5, unreadCount: 4 });
    expect(await pageOf(realAdmin)).toMatchObject({ total: 0, unreadCount: 0 });
  });

  it('restores the seeded notifications when the demo resets', async () => {
    await ctx.app.get(DemoService, { strict: false }).reset();

    const freshAdmin = await signInAsDemo('admin');

    expect(await pageOf(freshAdmin)).toMatchObject({
      total: 4,
      unreadCount: 3,
    });
    expect(await pageOf(realAdmin)).toMatchObject({ total: 0, unreadCount: 0 });
  });
});
