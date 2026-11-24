import { getModelToken } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AuditLog } from '../src/audit/schemas/audit-log.schema.js';
import type { LeaveType } from '../src/common/enums/leave-type.enum.js';
import { Role } from '../src/common/enums/role.enum.js';
import { LeaveApplication } from '../src/leave/schemas/leave-application.schema.js';
import { employeePayload } from './utils/factories.js';
import { createTestContext } from './utils/test-app.js';

const ADMIN = { email: 'admin@test.local', password: 'Admin#12345' };
const PLAIN = { email: 'plain@test.local', password: 'Plain#12345' };
const NEW_PASSWORD = 'Another#12345';

interface AuditRow {
  id: string;
  action: string;
  actorEmail: string;
  targetLabel: string;
  changes: { field: string; from: unknown; to: unknown }[];
  createdAt: string;
}

interface AuditPage {
  data: AuditRow[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

describe('Audit log', () => {
  let ctx: Awaited<ReturnType<typeof createTestContext>>;
  let admin: Awaited<ReturnType<typeof ctx.login>>;
  let employeeId: string;

  const employee = employeePayload('audited@test.local');

  const fetchLogs = async (query = '') => {
    const res = await admin.get(`/api/audit-logs${query}`);
    expect(res.status).toBe(200);
    return res.body as AuditPage;
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

  it('is restricted to admins', async () => {
    const anonymous = await request(ctx.server).get('/api/audit-logs');
    expect(anonymous.status).toBe(401);

    const plain = await ctx.login(PLAIN.email, PLAIN.password, 'employee');
    const forbidden = await plain.get('/api/audit-logs');
    expect(forbidden.status).toBe(403);
  });

  it('records the admin sign-in', async () => {
    const page = await fetchLogs('?action=ADMIN_LOGIN');

    expect(page.total).toBe(1);
    expect(page.data[0].actorEmail).toBe(ADMIN.email);
  });

  it('records an employee creation without any secret', async () => {
    const res = await admin.post('/api/employees').send(employee);
    expect(res.status).toBe(201);
    employeeId = res.body.employee._id;

    const page = await fetchLogs('?action=EMPLOYEE_CREATED');
    expect(page.total).toBe(1);
    expect(page.data[0].actorEmail).toBe(ADMIN.email);
    expect(page.data[0].targetLabel).toContain(String(employee.firstName));
    expect(page.data[0].changes).toContainEqual({
      field: 'email',
      from: null,
      to: employee.email,
    });
    expect(JSON.stringify(page)).not.toContain(employee.password);
  });

  it('records only the fields that really changed', async () => {
    const res = await admin
      .put(`/api/employees/${employeeId}`)
      .send({ position: 'Senior Developer', phone: employee.phone });
    expect(res.status).toBe(200);

    const page = await fetchLogs('?action=EMPLOYEE_UPDATED');
    expect(page.total).toBe(1);
    expect(page.data[0].changes).toEqual([
      { field: 'position', from: employee.position, to: 'Senior Developer' },
    ]);
  });

  it('records nothing when an update changes nothing', async () => {
    const res = await admin
      .put(`/api/employees/${employeeId}`)
      .send({ position: 'Senior Developer' });
    expect(res.status).toBe(200);

    expect((await fetchLogs('?action=EMPLOYEE_UPDATED')).total).toBe(1);
  });

  it('records salary changes as their own event', async () => {
    const res = await admin
      .put(`/api/employees/${employeeId}`)
      .send({ basicSalary: 6500 });
    expect(res.status).toBe(200);

    const salary = await fetchLogs('?action=SALARY_UPDATED');
    expect(salary.total).toBe(1);
    expect(salary.data[0].changes).toEqual([
      { field: 'basicSalary', from: 5000, to: 6500 },
    ]);
    expect((await fetchLogs('?action=EMPLOYEE_UPDATED')).total).toBe(1);
  });

  it('records password resets without storing the password', async () => {
    const res = await admin
      .put(`/api/employees/${employeeId}`)
      .send({ password: NEW_PASSWORD });
    expect(res.status).toBe(200);

    const page = await fetchLogs('?action=EMPLOYEE_PASSWORD_RESET');
    expect(page.total).toBe(1);
    expect(page.data[0].changes).toEqual([]);

    const everything = await fetchLogs('?limit=50');
    expect(JSON.stringify(everything)).not.toContain(NEW_PASSWORD);
  });

  it('records leave decisions once per real status change', async () => {
    const leaveModel = ctx.app.get<Model<LeaveApplication>>(
      getModelToken(LeaveApplication.name),
      { strict: false },
    );
    const leave = await leaveModel.create({
      employeeId,
      type: 'CASUAL' as LeaveType,
      startDate: new Date('2030-03-03'),
      endDate: new Date('2030-03-04'),
      reason: 'Family event',
    });

    const approve = await admin
      .patch(`/api/leave/${leave.id}`)
      .send({ status: 'APPROVED' });
    expect(approve.status).toBe(200);
    const again = await admin
      .patch(`/api/leave/${leave.id}`)
      .send({ status: 'APPROVED' });
    expect(again.status).toBe(200);

    const approved = await fetchLogs('?action=LEAVE_APPROVED');
    expect(approved.total).toBe(1);
    expect(approved.data[0].changes).toEqual([
      { field: 'status', from: 'PENDING', to: 'APPROVED' },
    ]);
    expect(approved.data[0].targetLabel).toContain(String(employee.firstName));

    const reject = await admin
      .patch(`/api/leave/${leave.id}`)
      .send({ status: 'REJECTED' });
    expect(reject.status).toBe(200);

    const rejected = await fetchLogs('?action=LEAVE_REJECTED');
    expect(rejected.total).toBe(1);
    expect(rejected.data[0].changes).toEqual([
      { field: 'status', from: 'APPROVED', to: 'REJECTED' },
    ]);
  });

  it('records payslip creation', async () => {
    const res = await admin
      .post('/api/payslips')
      .send({ employeeId, month: 10, year: 2026 });
    expect(res.status).toBe(201);

    const page = await fetchLogs('?action=PAYSLIP_CREATED');
    expect(page.total).toBe(1);
    expect(page.data[0].targetLabel).toContain('10/2026');
  });

  it('records the deactivation', async () => {
    const res = await admin.delete(`/api/employees/${employeeId}`);
    expect(res.status).toBe(200);

    const page = await fetchLogs('?action=EMPLOYEE_DEACTIVATED');
    expect(page.total).toBe(1);
    expect(page.data[0].changes).toEqual([
      { field: 'employmentStatus', from: 'ACTIVE', to: 'INACTIVE' },
    ]);
  });

  it('filters by search and by date range', async () => {
    const term = String(employee.firstName).toLowerCase();
    const byName = await fetchLogs(`?search=${encodeURIComponent(term)}`);
    expect(byName.total).toBeGreaterThan(0);
    expect(
      byName.data.every((row) =>
        `${row.actorEmail} ${row.targetLabel}`.toLowerCase().includes(term),
      ),
    ).toBe(true);

    const byActor = await fetchLogs(
      `?search=${encodeURIComponent(ADMIN.email)}`,
    );
    expect(byActor.total).toBeGreaterThan(0);
    expect(byActor.data.every((row) => row.actorEmail === ADMIN.email)).toBe(
      true,
    );

    expect((await fetchLogs('?search=no-such-entry')).total).toBe(0);
    expect((await fetchLogs('?from=2999-01-01')).total).toBe(0);
    expect(
      (await fetchLogs('?from=2000-01-01&to=2999-12-31')).total,
    ).toBeGreaterThan(0);
  });
  it('rejects invalid filters', async () => {
    expect((await admin.get('/api/audit-logs?action=NOPE')).status).toBe(400);
    expect((await admin.get('/api/audit-logs?limit=51')).status).toBe(400);
    expect((await admin.get('/api/audit-logs?from=2026-02-31')).status).toBe(
      400,
    );
  });

  it('paginates with the newest events first', async () => {
    const first = await fetchLogs('?limit=2&page=1');
    const second = await fetchLogs('?limit=2&page=2');

    expect(first.data).toHaveLength(2);
    expect(first.totalPages).toBe(Math.ceil(first.total / 2));
    expect(second.page).toBe(2);
    expect(new Date(first.data[0].createdAt).getTime()).toBeGreaterThanOrEqual(
      new Date(first.data[1].createdAt).getTime(),
    );
    expect(second.data.map((row) => row.id)).not.toContain(first.data[0].id);
  });

  it('expires entries after 180 days', async () => {
    const auditModel = ctx.app.get<Model<AuditLog>>(
      getModelToken(AuditLog.name),
      {
        strict: false,
      },
    );
    const indexes = await auditModel.collection.indexes();

    expect(
      indexes.some((index) => index.expireAfterSeconds === 180 * 24 * 60 * 60),
    ).toBe(true);
  });
});
