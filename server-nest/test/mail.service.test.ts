import type { ConfigService } from '@nestjs/config';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MailService } from '../src/mail/mail.service.js';

const { sendMail } = vi.hoisted(() => ({ sendMail: vi.fn() }));

vi.mock('nodemailer', () => ({
  default: { createTransport: () => ({ sendMail }) },
}));

const BASE = {
  SMTP_HOST: 'smtp.test',
  SMTP_PORT: 587,
  SMTP_USER: 'user',
  SMTP_PASS: 'pass',
  SENDER_EMAIL: 'ems@test.local',
};

const message = { subject: 'Hello', html: '<p>Hi</p>' };

function createService(values: Record<string, unknown>) {
  const config = {
    get: (key: string) => values[key],
  } as unknown as ConfigService;
  return new MailService(config);
}

describe('MailService', () => {
  beforeEach(() => {
    sendMail.mockReset();
    sendMail.mockResolvedValue({ messageId: 'm-1' });
  });

  it('sends every kind of email outside demo mode', async () => {
    const service = createService({ ...BASE, DEMO_MODE: false });

    await service.send({ to: 'sara@company.com', ...message, kind: 'account' });
    await service.send({
      to: 'sara@company.com',
      ...message,
      kind: 'reminder',
    });

    expect(sendMail).toHaveBeenCalledTimes(2);
    expect(sendMail).toHaveBeenCalledWith({
      from: 'ems@test.local',
      to: 'sara@company.com',
      ...message,
    });
  });

  it('keeps sending account emails in demo mode', async () => {
    const service = createService({ ...BASE, DEMO_MODE: true });

    await service.send({ to: 'sara@company.com', ...message, kind: 'account' });

    expect(sendMail).toHaveBeenCalledTimes(1);
  });

  it('skips reminders in demo mode', async () => {
    const service = createService({ ...BASE, DEMO_MODE: true });

    await service.send({
      to: 'sara@company.com',
      ...message,
      kind: 'reminder',
    });

    expect(sendMail).not.toHaveBeenCalled();
  });

  it('never emails demo addresses', async () => {
    const service = createService({ ...BASE, DEMO_MODE: false });

    await service.send({
      to: 'admin@demo.example.com',
      ...message,
      kind: 'account',
    });

    expect(sendMail).not.toHaveBeenCalled();
  });

  it('fails loudly when the sender address is missing', async () => {
    const service = createService({ ...BASE, SENDER_EMAIL: undefined });

    await expect(
      service.send({ to: 'sara@company.com', ...message, kind: 'account' }),
    ).rejects.toThrow('SENDER_EMAIL is not configured');
  });
});
