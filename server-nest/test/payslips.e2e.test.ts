import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Role } from '../src/common/enums/role.enum.js';
import { employeePayload } from './utils/factories.js';
import { createTestContext } from './utils/test-app.js';

const ADMIN = { email: 'admin@test.local', password: 'Admin#12345' };
const ALICE = employeePayload('alice@test.local');
const BOB = employeePayload('bob@test.local');

describe('Payslips', () => {
  let ctx: Awaited<ReturnType<typeof createTestContext>>;
  let admin: Awaited<ReturnType<typeof ctx.login>>;
  let alice: Awaited<ReturnType<typeof ctx.login>>;
  let bob: Awaited<ReturnType<typeof ctx.login>>;
  let aliceEmployeeId: string;
  let alicePayslipId: string;

  beforeAll(async () => {
    ctx = await createTestContext();
    await ctx.createUser(ADMIN.email, ADMIN.password, Role.ADMIN);
    admin = await ctx.login(ADMIN.email, ADMIN.password, 'admin');

    const aliceRes = await admin.post('/api/employees').send(ALICE);
    aliceEmployeeId = aliceRes.body.employee._id;
    await admin.post('/api/employees').send(BOB);

    alice = await ctx.login(ALICE.email, ALICE.password, 'employee');
    bob = await ctx.login(BOB.email, BOB.password, 'employee');
  });

  afterAll(async () => {
    await ctx.close();
  });

  const payslipFor = (overrides: Record<string, unknown> = {}) => ({
    employeeId: aliceEmployeeId,
    month: 11,
    year: 2026,
    basicSalary: 5000,
    allowances: 500,
    deductions: 200,
    ...overrides,
  });

  it('lets only admins create payslips', async () => {
    const res = await alice.post('/api/payslips').send(payslipFor());

    expect(res.status).toBe(403);
  });

  it('calculates the net salary on the server', async () => {
    const res = await admin
      .post('/api/payslips')
      .send(payslipFor({ netSalary: 999999 }));
    expect(res.status).toBe(400);

    const ok = await admin.post('/api/payslips').send(payslipFor());
    expect(ok.status).toBe(201);
    expect(ok.body.data.netSalary).toBe(5300);
    alicePayslipId = ok.body.data._id;
  });

  it('rejects a duplicate payslip for the same month', async () => {
    const res = await admin.post('/api/payslips').send(payslipFor());

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('already exists');
  });

  it('validates the payload and the employee', async () => {
    const badMonth = await admin
      .post('/api/payslips')
      .send(payslipFor({ month: 13 }));
    expect(badMonth.status).toBe(400);

    const unknownEmployee = await admin
      .post('/api/payslips')
      .send(payslipFor({ employeeId: '64b7f0c2e1d3a4b5c6d7e8f9', month: 10 }));
    expect(unknownEmployee.status).toBe(404);
  });

  it('accepts a payslip with a zero basic salary', async () => {
    const res = await admin
      .post('/api/payslips')
      .send(
        payslipFor({ month: 9, basicSalary: 0, allowances: 0, deductions: 0 }),
      );

    expect(res.status).toBe(201);
    expect(res.body.data.netSalary).toBe(0);
  });

  it('shows an employee only their own payslips', async () => {
    const aliceList = await alice.get('/api/payslips');
    expect(aliceList.status).toBe(200);
    expect(aliceList.body.data.length).toBeGreaterThan(0);

    const bobList = await bob.get('/api/payslips');
    expect(bobList.status).toBe(200);
    expect(bobList.body.data).toHaveLength(0);

    const adminList = await admin.get('/api/payslips');
    expect(adminList.body.data.length).toBe(aliceList.body.data.length);
  });

  it("does not let an employee read someone else's payslip", async () => {
    const own = await alice.get(`/api/payslips/${alicePayslipId}`);
    expect(own.status).toBe(200);
    expect(own.body.netSalary).toBe(5300);

    const foreign = await bob.get(`/api/payslips/${alicePayslipId}`);
    expect(foreign.status).toBe(404);

    const asAdmin = await admin.get(`/api/payslips/${alicePayslipId}`);
    expect(asAdmin.status).toBe(200);

    const anonymous = await request(ctx.server).get(
      `/api/payslips/${alicePayslipId}`,
    );
    expect(anonymous.status).toBe(401);
  });
});
