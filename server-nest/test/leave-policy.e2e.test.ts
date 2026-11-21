import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Role } from '../src/common/enums/role.enum.js';
import { workingDaysByYear } from '../src/leave/policy/leave-calendar.js';
import { EGYPT_LEAVE_POLICY } from '../src/leave/policy/leave-policy.js';
import { employeePayload, leaveWindow } from './utils/factories.js';
import { createTestContext } from './utils/test-app.js';

const ADMIN = { email: 'admin@test.local', password: 'Admin#12345' };
const SARA = employeePayload('sara.policy@test.local', {
  firstName: 'Sara',
  lastName: 'Ali',
});
const NEWBIE = employeePayload('newbie.policy@test.local', {
  firstName: 'New',
  lastName: 'Hire',
  joinDate: new Date().toISOString().slice(0, 10),
});

const addDays = (isoDay: string, days: number) =>
  new Date(new Date(`${isoDay}T00:00:00.000Z`).getTime() + days * 86_400_000)
    .toISOString()
    .slice(0, 10);

describe('Leave policy', () => {
  let ctx: Awaited<ReturnType<typeof createTestContext>>;
  let admin: Awaited<ReturnType<typeof ctx.login>>;
  let sara: Awaited<ReturnType<typeof ctx.login>>;
  let newbie: Awaited<ReturnType<typeof ctx.login>>;

  const book = (
    agent: typeof sara,
    type: string,
    window: { start: string; end: string },
    reason = 'Policy test',
  ) =>
    agent
      .post('/api/leave')
      .send({ type, startDate: window.start, endDate: window.end, reason });

  beforeAll(async () => {
    ctx = await createTestContext();
    await ctx.createUser(ADMIN.email, ADMIN.password, Role.ADMIN);
    admin = await ctx.login(ADMIN.email, ADMIN.password, 'admin');
    await admin.post('/api/employees').send(SARA);
    await admin.post('/api/employees').send(NEWBIE);
    sara = await ctx.login(SARA.email, SARA.password, 'employee');
    newbie = await ctx.login(NEWBIE.email, NEWBIE.password, 'employee');
  });

  afterAll(async () => {
    await ctx.close();
  });

  it('shows the statutory balance of an employee with no leave yet', async () => {
    const res = await sara.get('/api/leave/balance');

    expect(res.status).toBe(200);
    expect([15, 21]).toContain(res.body.entitlement);
    expect(res.body.remaining).toBe(res.body.entitlement);
    expect(res.body.casual).toMatchObject({ limit: 7, remaining: 7 });
    expect(res.body.annualAvailableFrom).toEqual(expect.any(String));
  });

  it('has no balance for an account without an employee record', async () => {
    const res = await admin.get('/api/leave/balance');

    expect(res.status).toBe(404);
  });

  it('reserves the requested working days while the request is pending', async () => {
    const window = leaveWindow(3, 2);
    const year = Number(window.start.slice(0, 4));
    const expected =
      workingDaysByYear(
        { startDate: new Date(window.start), endDate: new Date(window.end) },
        EGYPT_LEAVE_POLICY,
      ).get(year) ?? 0;

    const created = await book(sara, 'ANNUAL', window);
    expect(created.status).toBe(201);

    const balance = await sara.get(`/api/leave/balance?year=${year}`);
    expect(balance.body.pending).toBe(expected);
    expect(balance.body.remaining).toBe(balance.body.entitlement - expected);

    const list = await sara.get('/api/leave');
    expect(list.body.data[0].days).toBe(2);
  });

  it('refuses dates that overlap another request', async () => {
    const res = await book(sara, 'SICK', leaveWindow(3, 2));

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('overlap');
  });

  it('limits casual leave to two working days per request', async () => {
    const tooLong = await book(sara, 'CASUAL', leaveWindow(10, 3));
    expect(tooLong.status).toBe(400);
    expect(tooLong.body.error).toContain('limited to 2 working days');

    const fine = await book(sara, 'CASUAL', leaveWindow(20, 2));
    expect(fine.status).toBe(201);
  });

  it('refuses a request larger than the remaining balance', async () => {
    const start = leaveWindow(40, 1).start;

    const res = await book(sara, 'ANNUAL', { start, end: addDays(start, 120) });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Not enough leave balance');
  });

  it('makes annual leave available only after six months of service', async () => {
    const annual = await book(newbie, 'ANNUAL', leaveWindow(30, 1));
    expect(annual.status).toBe(400);
    expect(annual.body.error).toContain(
      'becomes available after 6 months of service',
    );

    const sick = await book(newbie, 'SICK', leaveWindow(30, 1));
    expect(sick.status).toBe(201);
  });

  it('re-checks a rejected request before it can be approved again', async () => {
    const window = leaveWindow(60, 1);
    const first = await book(sara, 'ANNUAL', window, 'First request');
    const firstId = first.body.data._id;

    await admin.patch(`/api/leave/${firstId}`).send({ status: 'REJECTED' });
    const second = await book(sara, 'ANNUAL', window, 'Second request');
    expect(second.status).toBe(201);

    const reopen = await admin
      .patch(`/api/leave/${firstId}`)
      .send({ status: 'APPROVED' });
    expect(reopen.status).toBe(400);
    expect(reopen.body.error).toContain('overlap');

    await admin
      .patch(`/api/leave/${second.body.data._id}`)
      .send({ status: 'REJECTED' });
    const retry = await admin
      .patch(`/api/leave/${firstId}`)
      .send({ status: 'APPROVED' });
    expect(retry.status).toBe(200);
  });

  it('shows working days to admins as well', async () => {
    const res = await admin.get('/api/leave');

    expect(res.status).toBe(200);
    expect(
      res.body.data.every((item: { days: number }) => item.days >= 1),
    ).toBe(true);
  });
});
