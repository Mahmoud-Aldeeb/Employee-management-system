import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  DEMO_ADMIN_EMAIL,
  DEMO_EMPLOYEE_EMAIL,
} from '../src/demo/demo.constants.js';
import { DemoService } from '../src/demo/demo.service.js';
import { createTestContext } from './utils/test-app.js';

describe('Demo mode (enabled)', () => {
  let ctx: Awaited<ReturnType<typeof createTestContext>>;

  const demoAgent = async (role: 'admin' | 'employee') => {
    const agent = request.agent(ctx.server);
    const res = await agent.post('/api/demo/login').send({ role });
    expect(res.status).toBe(200);
    return { agent, res };
  };

  beforeAll(async () => {
    ctx = await createTestContext({ demoMode: true });
  });

  afterAll(async () => {
    await ctx.close();
  });

  it('reports that demo mode is on', async () => {
    const res = await request(ctx.server).get('/api/demo/status');

    expect(res.body).toEqual({ enabled: true });
  });

  it('signs in as the admin and seeds realistic data on first use', async () => {
    const { agent, res } = await demoAgent('admin');

    expect(res.body.user).toMatchObject({
      email: DEMO_ADMIN_EMAIL,
      role: 'ADMIN',
    });
    expect(
      (res.headers['set-cookie'] as unknown as string[]).some((cookie) =>
        cookie.startsWith('session_active='),
      ),
    ).toBe(true);

    const dashboard = await agent.get('/api/dashboard');
    expect(dashboard.body.totalEmployees).toBe(12);
    expect(dashboard.body.pendingLeaves).toBeGreaterThan(0);

    const employees = await agent.get('/api/employees');
    expect(employees.body).toHaveLength(12);
    expect(employees.body[0].basicSalary).toBeGreaterThan(0);
  });

  it('signs in as the employee with salary, history, leaves and payslips', async () => {
    const { agent, res } = await demoAgent('employee');

    expect(res.body.user).toMatchObject({
      email: DEMO_EMPLOYEE_EMAIL,
      role: 'EMPLOYEE',
    });

    const dashboard = await agent.get('/api/dashboard');
    expect(dashboard.body.employee.firstName).toBe('Salma');
    expect(dashboard.body.salary.netSalary).toBeGreaterThan(0);

    const attendance = await agent.get('/api/attendance');
    expect(attendance.body.data.length).toBeGreaterThan(10);

    const leaves = await agent.get('/api/leave');
    expect(
      leaves.body.data.some(
        (leave: { status: string }) => leave.status === 'PENDING',
      ),
    ).toBe(true);

    const payslips = await agent.get('/api/payslips');
    expect(payslips.body.data).toHaveLength(3);
  });

  it('lets the demo employee clock in', async () => {
    const { agent } = await demoAgent('employee');

    const res = await agent.post('/api/attendance');

    expect(res.status).toBe(200);
    expect(res.body.type).toBe('CHECK_IN');
  });

  it('does not allow demo accounts to change their password', async () => {
    const { agent } = await demoAgent('admin');

    const res = await agent
      .post('/api/auth/change-password')
      .send({ currentPassword: 'whatever', newPassword: 'AnotherPass#1' });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Demo accounts cannot change their password');
  });

  it('keeps many demo visitors signed in at the same time', async () => {
    const sessions = await Promise.all(
      Array.from({ length: 12 }, () => demoAgent('admin')),
    );

    for (const { agent } of sessions) {
      const res = await agent.get('/api/auth/session');
      expect(res.status).toBe(200);
    }
  });

  it('restores the original data on reset', async () => {
    const { agent } = await demoAgent('admin');
    const before = await agent.get('/api/employees');
    await agent.delete(`/api/employees/${before.body[0].id}`);

    const afterDelete = await agent.get('/api/employees');
    expect(
      afterDelete.body.filter(
        (employee: { isDeleted: boolean }) => employee.isDeleted,
      ),
    ).toHaveLength(1);

    await ctx.app.get(DemoService).reset();

    const { agent: fresh } = await demoAgent('admin');
    const restored = await fresh.get('/api/employees');
    expect(restored.body).toHaveLength(12);
    expect(
      restored.body.some(
        (employee: { isDeleted: boolean }) => employee.isDeleted,
      ),
    ).toBe(false);
  });
});
