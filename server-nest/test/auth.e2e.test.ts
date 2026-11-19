import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Role } from '../src/common/enums/role.enum.js';
import { createTestContext } from './utils/test-app.js';

const ADMIN = { email: 'admin@test.local', password: 'Admin#12345' };
const EMPLOYEE = { email: 'employee@test.local', password: 'Employee#12345' };
const CHANGER = { email: 'changer@test.local', password: 'Changer#12345' };

describe('Auth', () => {
  let ctx: Awaited<ReturnType<typeof createTestContext>>;

  const loginRaw = (body: Record<string, unknown>) =>
    request(ctx.server).post('/api/auth/login').send(body);

  const cookiesOf = (res: request.Response) =>
    (res.headers['set-cookie'] ?? []) as unknown as string[];

  const refreshCookieOf = (res: request.Response) =>
    cookiesOf(res)
      .find((cookie) => cookie.startsWith('refresh_token='))!
      .split(';')[0];

  beforeAll(async () => {
    ctx = await createTestContext();
    await ctx.createUser(ADMIN.email, ADMIN.password, Role.ADMIN);
    await ctx.createUser(EMPLOYEE.email, EMPLOYEE.password, Role.EMPLOYEE);
    await ctx.createUser(CHANGER.email, CHANGER.password, Role.EMPLOYEE);
  });

  afterAll(async () => {
    await ctx.close();
  });

  it('logs in and sets httpOnly cookies without returning a token in the body', async () => {
    const res = await loginRaw({ ...ADMIN, role_type: 'admin' });

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ email: ADMIN.email, role: 'ADMIN' });
    expect(res.body).not.toHaveProperty('token');

    const cookies = cookiesOf(res);
    expect(
      cookies.some(
        (c) => c.startsWith('access_token=') && c.includes('HttpOnly'),
      ),
    ).toBe(true);
    expect(
      cookies.some(
        (c) =>
          c.startsWith('refresh_token=') &&
          c.includes('HttpOnly') &&
          c.includes('Path=/api/auth'),
      ),
    ).toBe(true);
  });

  it('rejects a wrong password', async () => {
    const res = await loginRaw({
      email: ADMIN.email,
      password: 'wrong-password',
    });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid email or password');
  });

  it('returns the same error for an unknown email', async () => {
    const res = await loginRaw({
      email: 'nobody@test.local',
      password: 'whatever123',
    });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid email or password');
  });

  it('rejects an invalid body', async () => {
    const res = await loginRaw({ email: 'not-an-email' });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('email must be an email');
  });

  it('rejects an employee trying to log in through the admin portal', async () => {
    const res = await loginRaw({ ...EMPLOYEE, role_type: 'admin' });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Not authorized as admin');
  });

  it('protects the session endpoint and returns the user after login', async () => {
    const anonymous = await request(ctx.server).get('/api/auth/session');
    expect(anonymous.status).toBe(401);

    const agent = await ctx.login(ADMIN.email, ADMIN.password, 'admin');
    const res = await agent.get('/api/auth/session');

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ email: ADMIN.email, role: 'ADMIN' });
  });

  it('rotates the refresh token so the old one stops working', async () => {
    const loginRes = await loginRaw({ ...ADMIN });
    const oldRefresh = refreshCookieOf(loginRes);

    const first = await request(ctx.server)
      .post('/api/auth/refresh')
      .set('Cookie', oldRefresh);
    expect(first.status).toBe(200);
    expect(first.body.user.email).toBe(ADMIN.email);

    const reused = await request(ctx.server)
      .post('/api/auth/refresh')
      .set('Cookie', oldRefresh);
    expect(reused.status).toBe(401);
  });

  it('revokes the refresh token on logout', async () => {
    const loginRes = await loginRaw({ ...ADMIN });
    const refresh = refreshCookieOf(loginRes);

    const logout = await request(ctx.server)
      .post('/api/auth/logout')
      .set('Cookie', refresh);
    expect(logout.status).toBe(200);

    const afterLogout = await request(ctx.server)
      .post('/api/auth/refresh')
      .set('Cookie', refresh);
    expect(afterLogout.status).toBe(401);
  });

  it('changes the password only with the correct current password', async () => {
    const agent = await ctx.login(CHANGER.email, CHANGER.password);

    const wrongCurrent = await agent.post('/api/auth/change-password').send({
      currentPassword: 'not-the-password',
      newPassword: 'NewPassword#1',
    });
    expect(wrongCurrent.status).toBe(400);
    expect(wrongCurrent.body.error).toBe('Current password is incorrect');

    const tooShort = await agent
      .post('/api/auth/change-password')
      .send({ currentPassword: CHANGER.password, newPassword: 'short' });
    expect(tooShort.status).toBe(400);

    const ok = await agent.post('/api/auth/change-password').send({
      currentPassword: CHANGER.password,
      newPassword: 'NewPassword#1',
    });
    expect(ok.status).toBe(200);

    const oldLogin = await loginRaw({
      email: CHANGER.email,
      password: CHANGER.password,
    });
    expect(oldLogin.status).toBe(401);

    const newLogin = await loginRaw({
      email: CHANGER.email,
      password: 'NewPassword#1',
    });
    expect(newLogin.status).toBe(200);
  });

  it('keeps an independent session for every device', async () => {
    await ctx.createUser(
      'devices.a@test.local',
      'Devices#12345',
      Role.EMPLOYEE,
    );
    const first = await loginRaw({
      email: 'devices.a@test.local',
      password: 'Devices#12345',
    });
    const second = await loginRaw({
      email: 'devices.a@test.local',
      password: 'Devices#12345',
    });

    const refreshFirst = await request(ctx.server)
      .post('/api/auth/refresh')
      .set('Cookie', refreshCookieOf(first));
    const refreshSecond = await request(ctx.server)
      .post('/api/auth/refresh')
      .set('Cookie', refreshCookieOf(second));

    expect(refreshFirst.status).toBe(200);
    expect(refreshSecond.status).toBe(200);
  });

  it('logging out one device leaves the others signed in', async () => {
    await ctx.createUser(
      'devices.b@test.local',
      'Devices#12345',
      Role.EMPLOYEE,
    );
    const phone = await loginRaw({
      email: 'devices.b@test.local',
      password: 'Devices#12345',
    });
    const laptop = await loginRaw({
      email: 'devices.b@test.local',
      password: 'Devices#12345',
    });

    await request(ctx.server)
      .post('/api/auth/logout')
      .set('Cookie', refreshCookieOf(phone));

    const phoneRefresh = await request(ctx.server)
      .post('/api/auth/refresh')
      .set('Cookie', refreshCookieOf(phone));
    const laptopRefresh = await request(ctx.server)
      .post('/api/auth/refresh')
      .set('Cookie', refreshCookieOf(laptop));

    expect(phoneRefresh.status).toBe(401);
    expect(laptopRefresh.status).toBe(200);
  });

  it('revokes every device when the password changes', async () => {
    await ctx.createUser(
      'devices.c@test.local',
      'Devices#12345',
      Role.EMPLOYEE,
    );
    const otherDevice = await loginRaw({
      email: 'devices.c@test.local',
      password: 'Devices#12345',
    });
    const agent = await ctx.login('devices.c@test.local', 'Devices#12345');

    const change = await agent
      .post('/api/auth/change-password')
      .send({
        currentPassword: 'Devices#12345',
        newPassword: 'NewDevices#12345',
      });
    expect(change.status).toBe(200);

    const stale = await request(ctx.server)
      .post('/api/auth/refresh')
      .set('Cookie', refreshCookieOf(otherDevice));
    expect(stale.status).toBe(401);
  });

  it('sets a long-lived session marker cookie for the frontend', async () => {
    const res = await loginRaw({ ...ADMIN });

    expect(
      cookiesOf(res).some((cookie) => cookie.startsWith('session_active=')),
    ).toBe(true);
  });
});
