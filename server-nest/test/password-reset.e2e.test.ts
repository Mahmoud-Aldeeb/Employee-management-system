import { getModelToken } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PasswordTokenPurpose } from '../src/auth/password-tokens/password-token-purpose.js';
import { PasswordToken } from '../src/auth/password-tokens/password-token.schema.js';
import { PasswordTokensService } from '../src/auth/password-tokens/password-tokens.service.js';
import { Role } from '../src/common/enums/role.enum.js';
import { AccountFunctions } from '../src/inngest/account-functions.service.js';
import { UsersService } from '../src/users/users.service.js';
import { createTestContext, type SentMail } from './utils/test-app.js';

const MAIN = { email: 'forgetful@test.local', password: 'Forgot#12345' };
const REPLACED = { email: 'replaced@test.local', password: 'Replaced#12345' };
const FRESH = { email: 'fresh@test.local', password: 'Fresh#12345' };
const NEW_PASSWORD = 'Brand#New12345';
const INVALID = 'This link is invalid or has expired';

describe('Password reset', () => {
  let ctx: Awaited<ReturnType<typeof createTestContext>>;
  let accounts: AccountFunctions;
  let tokens: PasswordTokensService;

  const tokenIn = (mail: SentMail) =>
    decodeURIComponent(/#token=([^"<\s]+)/.exec(mail.html)?.[1] ?? '');

  const loginRaw = (email: string, password: string) =>
    request(ctx.server).post('/api/auth/login').send({ email, password });

  const postReset = (body: Record<string, unknown>) =>
    request(ctx.server).post('/api/auth/reset-password').send(body);

  const sendReset = async (email: string) => {
    const target = await accounts.findResetTarget(email);
    await accounts.sendResetEmail(target!);
    return tokenIn(ctx.mails.at(-1)!);
  };

  const userIdOf = async (email: string) =>
    (await ctx.app.get(UsersService, { strict: false }).findByEmail(email))!.id;

  beforeAll(async () => {
    ctx = await createTestContext();
    for (const account of [MAIN, REPLACED, FRESH]) {
      await ctx.createUser(account.email, account.password, Role.EMPLOYEE);
    }
    accounts = ctx.app.get(AccountFunctions, { strict: false });
    tokens = ctx.app.get(PasswordTokensService, { strict: false });
  });

  afterAll(async () => {
    await ctx.close();
  });

  it('answers the same way for known and unknown emails and queues the job', async () => {
    const known = await request(ctx.server)
      .post('/api/auth/forgot-password')
      .send({ email: MAIN.email });
    const unknown = await request(ctx.server)
      .post('/api/auth/forgot-password')
      .send({ email: 'nobody@test.local' });

    expect(known.status).toBe(200);
    expect(unknown.status).toBe(200);
    expect(known.body).toEqual({ success: true });
    expect(unknown.body).toEqual(known.body);

    const queued = ctx.events
      .filter((event) => event.name === 'auth/password-reset.requested')
      .map((event) => event.data.email);
    expect(queued).toEqual(
      expect.arrayContaining([MAIN.email, 'nobody@test.local']),
    );
  });

  it('rejects a request without a valid email', async () => {
    const res = await request(ctx.server)
      .post('/api/auth/forgot-password')
      .send({ email: 'not-an-email' });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('email must be an email');
  });

  it('emails a link only to real accounts', async () => {
    expect(await accounts.findResetTarget('nobody@test.local')).toBeNull();

    const target = await accounts.findResetTarget(MAIN.email);
    expect(target).toMatchObject({ email: MAIN.email, firstName: 'there' });

    await accounts.sendResetEmail(target!);
    const mail = ctx.mails.at(-1)!;

    expect(mail.to).toBe(MAIN.email);
    expect(mail.subject).toBe('Reset your EMS password');
    expect(mail.html).toContain('/reset-password#token=');
  });

  it('finds the account whatever the capitalization of the email', async () => {
    const target = await accounts.findResetTarget('Forgetful@TEST.local');

    expect(target).toMatchObject({ email: MAIN.email });
  });

  it('applies a cooldown after a link was sent', async () => {
    const userId = await userIdOf(FRESH.email);
    expect(await accounts.isResetCoolingDown(userId)).toBe(false);

    await sendReset(FRESH.email);

    expect(await accounts.isResetCoolingDown(userId)).toBe(true);
  });

  it('sets the new password, signs out every device and consumes the link', async () => {
    const device = await loginRaw(MAIN.email, MAIN.password);
    const refresh = (device.headers['set-cookie'] as unknown as string[])
      .find((cookie) => cookie.startsWith('refresh_token='))!
      .split(';')[0];
    const token = await sendReset(MAIN.email);

    const done = await postReset({ token, newPassword: NEW_PASSWORD });
    expect(done.status).toBe(200);
    expect(done.body).toEqual({ success: true, portal: 'employee' });

    expect((await loginRaw(MAIN.email, MAIN.password)).status).toBe(401);
    expect((await loginRaw(MAIN.email, NEW_PASSWORD)).status).toBe(200);
    expect(
      (
        await request(ctx.server)
          .post('/api/auth/refresh')
          .set('Cookie', refresh)
      ).status,
    ).toBe(401);

    const reused = await postReset({ token, newPassword: 'Another#12345' });
    expect(reused.status).toBe(400);
    expect(reused.body.error).toBe(INVALID);
  });

  it('lets a newer link replace the older one', async () => {
    const older = await sendReset(REPLACED.email);
    const newer = await sendReset(REPLACED.email);

    expect(
      (await postReset({ token: older, newPassword: NEW_PASSWORD })).status,
    ).toBe(400);
    expect(
      (await postReset({ token: newer, newPassword: NEW_PASSWORD })).status,
    ).toBe(200);
  });

  it('rejects expired, unknown and badly formed requests', async () => {
    const userId = await userIdOf(FRESH.email);
    const model = ctx.app.get<Model<PasswordToken>>(
      getModelToken(PasswordToken.name),
      {
        strict: false,
      },
    );
    const expired = await tokens.issue(userId, PasswordTokenPurpose.RESET);
    await model.updateMany(
      { userId },
      { expiresAt: new Date(Date.now() - 1_000) },
    );

    const late = await postReset({ token: expired, newPassword: NEW_PASSWORD });
    expect(late.status).toBe(400);
    expect(late.body.error).toBe(INVALID);

    const unknown = await postReset({
      token: 'x'.repeat(43),
      newPassword: NEW_PASSWORD,
    });
    expect(unknown.status).toBe(400);
    expect(unknown.body.error).toBe(INVALID);

    expect(
      (await postReset({ token: 'x'.repeat(43), newPassword: 'short' })).status,
    ).toBe(400);
    expect(
      (await postReset({ token: 'x'.repeat(43), newPassword: 'a'.repeat(73) }))
        .status,
    ).toBe(400);
    expect((await postReset({ newPassword: NEW_PASSWORD })).status).toBe(400);
  });
});
