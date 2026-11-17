import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Role } from '../src/common/enums/role.enum.js';
import { employeePayload } from './utils/factories.js';
import { createTestContext } from './utils/test-app.js';

const ADMIN = { email: 'admin@test.local', password: 'Admin#12345' };
const PLAIN = { email: 'plain@test.local', password: 'Plain#12345' };

interface EmployeeRow {
  id: string;
  email: string;
  position: string;
  basicSalary: number;
  isDeleted: boolean;
  employmentStatus: string;
  user: { email: string; role: string } | null;
}

describe('Employees', () => {
  let ctx: Awaited<ReturnType<typeof createTestContext>>;
  let admin: Awaited<ReturnType<typeof ctx.login>>;
  let employeeId: string;

  const employee = employeePayload('ahmed@test.local');

  const listEmployees = async () => {
    const res = await admin.get('/api/employees');
    return res.body as EmployeeRow[];
  };

  beforeAll(async () => {
    ctx = await createTestContext();
    await ctx.createUser(ADMIN.email, ADMIN.password, Role.ADMIN);
    await ctx.createUser(PLAIN.email, PLAIN.password, Role.EMPLOYEE);
    admin = await ctx.login(ADMIN.email, ADMIN.password, 'admin');
  });

  afterAll(async () => {
    await ctx.close();
  });

  it('requires authentication', async () => {
    const anonymous = await ctx
      .login(ADMIN.email, ADMIN.password)
      .then(() => null);
    expect(anonymous).toBeNull();

    const { default: request } = await import('supertest');
    const res = await request(ctx.server).get('/api/employees');
    expect(res.status).toBe(401);
  });

  it('forbids non-admin users', async () => {
    const plain = await ctx.login(PLAIN.email, PLAIN.password, 'employee');
    const res = await plain.get('/api/employees');

    expect(res.status).toBe(403);
  });

  it('creates an employee together with a working login account', async () => {
    const res = await admin.post('/api/employees').send(employee);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.employee.email).toBe(employee.email);
    employeeId = res.body.employee._id;

    const asEmployee = await ctx.login(
      employee.email,
      employee.password,
      'employee',
    );
    const session = await asEmployee.get('/api/auth/session');
    expect(session.body.user.role).toBe('EMPLOYEE');
  });

  it('lists employees with their account role', async () => {
    const rows = await listEmployees();
    const created = rows.find((row) => row.email === employee.email);

    expect(created).toBeDefined();
    expect(created?.id).toBe(employeeId);
    expect(created?.user).toEqual({ email: employee.email, role: 'EMPLOYEE' });
  });

  it('rejects a duplicate email', async () => {
    const res = await admin.post('/api/employees').send(employee);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Email already exists');
  });

  it('validates the payload', async () => {
    const res = await admin
      .post('/api/employees')
      .send(employeePayload('bad', { firstName: '', basicSalary: -5 }));

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('email must be an email');
    expect(res.body.error).toContain('firstName should not be empty');
    expect(res.body.error).toContain('basicSalary must not be less than 0');
  });

  it('rejects unknown fields', async () => {
    const res = await admin
      .post('/api/employees')
      .send(employeePayload('extra@test.local', { isSuperAdmin: true }));

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('should not exist');
  });

  it('updates only the fields that were sent', async () => {
    const res = await admin
      .put(`/api/employees/${employeeId}`)
      .send({ position: 'Senior Developer' });
    expect(res.status).toBe(200);

    const updated = (await listEmployees()).find(
      (row) => row.id === employeeId,
    );
    expect(updated?.position).toBe('Senior Developer');
    expect(updated?.basicSalary).toBe(5000);
  });

  it('changes the password through an update', async () => {
    const res = await admin
      .put(`/api/employees/${employeeId}`)
      .send({ password: 'Another#12345' });
    expect(res.status).toBe(200);

    await expect(
      ctx.login(employee.email, employee.password),
    ).rejects.toThrow();
    await expect(
      ctx.login(employee.email, 'Another#12345'),
    ).resolves.toBeDefined();
  });

  it('validates ids and reports missing employees', async () => {
    const invalid = await admin
      .put('/api/employees/not-an-id')
      .send({ position: 'X' });
    expect(invalid.status).toBe(400);
    expect(invalid.body.error).toBe('Invalid id');

    const missing = await admin
      .put('/api/employees/64b7f0c2e1d3a4b5c6d7e8f9')
      .send({ position: 'X' });
    expect(missing.status).toBe(404);
  });

  it('soft deletes an employee', async () => {
    const res = await admin.delete(`/api/employees/${employeeId}`);
    expect(res.status).toBe(200);

    const deleted = (await listEmployees()).find(
      (row) => row.id === employeeId,
    );
    expect(deleted?.isDeleted).toBe(true);
    expect(deleted?.employmentStatus).toBe('INACTIVE');
  });
});
