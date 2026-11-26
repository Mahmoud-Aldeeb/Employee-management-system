import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Role } from '../src/common/enums/role.enum.js';
import { AccountFunctions } from '../src/inngest/account-functions.service.js';
import { UsersService } from '../src/users/users.service.js';
import { employeePayload } from './utils/factories.js';
import { createTestContext, type SentMail } from './utils/test-app.js';

const ADMIN = { email: 'admin@test.local', password: 'Admin#12345' };
const CHOSEN = 'Chosen#12345';

interface EmployeeRow {
  id: string;
  email: string;
  user: { invitedAt: string | null } | null;
}

describe('Employee invitations', () => {
  let ctx: Awaited<ReturnType<typeof createTestContext>>;
  let admin: Awaited<ReturnType<typeof ctx.login>>;
  let accounts: AccountFunctions;

  const invitedPayload = (email: string) =>
    employeePayload(email, { password: undefined });

  const tokenIn = (mail: SentMail) =>
    decodeURIComponent(/#token=([^"<\s]+)/.exec(mail.html)?.[1] ?? '');

  const userIdOf = async (email: string) =>
    (await ctx.app.get(UsersService, { strict: false }).findByEmail(email))!.id;

  const inviteEvents = (userId: string) =>
    ctx.events.filter(
      (event) =>
        event.name === 'auth/invite.requested' && event.data.userId === userId,
    );

  const rowOf = async (email: string) => {
    const res = await admin.get('/api/employees');
    return (res.body as EmployeeRow[]).find((row) => row.email === email);
  };

  beforeAll(async () => {
    ctx = await createTestContext();
    await ctx.createUser(ADMIN.email, ADMIN.password, Role.ADMIN);
    admin = await ctx.login(ADMIN.email, ADMIN.password, 'admin');
    accounts = ctx.app.get(AccountFunctions, { strict: false });
  });

  afterAll(async () => {
    await ctx.close();
  });

  it('creates an invited employee who cannot sign in yet', async () => {
    const email = 'invited@test.local';
    const res = await admin.post('/api/employees').send(invitedPayload(email));

    expect(res.status).toBe(201);
    expect(res.body.invite).toBe('QUEUED');
    expect(inviteEvents(await userIdOf(email))).toHaveLength(1);

    const attempt = await request(ctx.server)
      .post('/api/auth/login')
      .send({ email, password: 'Temp#12345' });
    expect(attempt.status).toBe(401);
    expect((await rowOf(email))?.user?.invitedAt).toBeTruthy();
  });

  it('delivers an invitation that lets the employee choose a password', async () => {
    const email = 'activated@test.local';
    await admin.post('/api/employees').send(invitedPayload(email));

    expect(await accounts.sendInvitation(await userIdOf(email))).toBe(true);
    const mail = ctx.mails.at(-1)!;
    expect(mail.to).toBe(email);
    expect(mail.subject).toBe('Welcome to EMS - Set your password');
    expect(mail.html).toContain('/set-password#token=');

    const done = await request(ctx.server)
      .post('/api/auth/reset-password')
      .send({ token: tokenIn(mail), newPassword: CHOSEN });
    expect(done.status).toBe(200);
    expect(done.body).toEqual({ success: true, portal: 'employee' });

    const login = await request(ctx.server)
      .post('/api/auth/login')
      .send({ email, password: CHOSEN, role_type: 'employee' });
    expect(login.status).toBe(200);
    expect((await rowOf(email))?.user?.invitedAt).toBeNull();
  });

  it('lets the admin resend a pending invitation and records it', async () => {
    const email = 'resend@test.local';
    const created = await admin
      .post('/api/employees')
      .send(invitedPayload(email));
    const userId = await userIdOf(email);

    const res = await admin.post(
      `/api/employees/${created.body.employee._id}/invite`,
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, invite: 'QUEUED' });
    expect(inviteEvents(userId)).toHaveLength(2);

    const audit = await admin.get('/api/audit-logs?action=EMPLOYEE_INVITED');
    expect(audit.body.total).toBe(1);
  });

  it('refuses to resend to someone who already has a password', async () => {
    const activated = await rowOf('activated@test.local');

    const res = await admin.post(`/api/employees/${activated!.id}/invite`);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('This employee has already set a password');
  });

  it('still activates the account immediately when a password is given', async () => {
    const email = 'direct@test.local';
    const payload = employeePayload(email);

    const res = await admin.post('/api/employees').send(payload);

    expect(res.status).toBe(201);
    expect(res.body.invite).toBe('NOT_REQUIRED');
    expect(inviteEvents(await userIdOf(email))).toHaveLength(0);
    await expect(
      ctx.login(email, payload.password, 'employee'),
    ).resolves.toBeDefined();
  });
});
