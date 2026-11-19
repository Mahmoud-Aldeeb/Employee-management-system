import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Role } from '../src/common/enums/role.enum.js';
import { employeePayload } from './utils/factories.js';
import { createTestContext } from './utils/test-app.js';

const ADMIN = { email: 'admin@test.local', password: 'Admin#12345' };
const SARA = employeePayload('sara.salary@test.local', { firstName: 'Sara' });

describe('Salary', () => {
  let ctx: Awaited<ReturnType<typeof createTestContext>>;
  let admin: Awaited<ReturnType<typeof ctx.login>>;
  let sara: Awaited<ReturnType<typeof ctx.login>>;
  let employeeId: string;

  beforeAll(async () => {
    ctx = await createTestContext();
    await ctx.createUser(ADMIN.email, ADMIN.password, Role.ADMIN);
    admin = await ctx.login(ADMIN.email, ADMIN.password, 'admin');

    const created = await admin.post('/api/employees').send(SARA);
    employeeId = created.body.employee._id;
    sara = await ctx.login(SARA.email, SARA.password, 'employee');
  });

  afterAll(async () => {
    await ctx.close();
  });

  it('shows the salary set at creation to the employee', async () => {
    const res = await sara.get('/api/profile/salary');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      basicSalary: 5000,
      allowances: 500,
      deductions: 200,
      netSalary: 5300,
    });
  });

  it('lists the salary in the admin employee list', async () => {
    const res = await admin.get('/api/employees');
    const row = res.body.find(
      (employee: { id: string }) => employee.id === employeeId,
    );

    expect(row.basicSalary).toBe(5000);
  });

  it('reflects an admin update immediately for the employee', async () => {
    const update = await admin
      .put(`/api/employees/${employeeId}`)
      .send({ basicSalary: 6000 });
    expect(update.status).toBe(200);

    const salary = await sara.get('/api/profile/salary');
    expect(salary.body.netSalary).toBe(6300);
    expect(salary.body.updatedAt).toBeTruthy();

    const dashboard = await sara.get('/api/dashboard');
    expect(dashboard.body.salary.netSalary).toBe(6300);
  });

  it('creates a payslip from the current salary when amounts are omitted', async () => {
    const res = await admin
      .post('/api/payslips')
      .send({ employeeId, month: 10, year: 2026 });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ basicSalary: 6000, netSalary: 6300 });
  });

  it('keeps issued payslips unchanged when the salary changes later', async () => {
    await admin.put(`/api/employees/${employeeId}`).send({ basicSalary: 7000 });

    const payslips = await sara.get('/api/payslips');
    const october = payslips.body.data.find(
      (payslip: { month: number }) => payslip.month === 10,
    );
    expect(october.netSalary).toBe(6300);

    const current = await sara.get('/api/profile/salary');
    expect(current.body.netSalary).toBe(7300);
  });
});
