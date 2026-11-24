import { getModelToken } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AuditLog } from '../src/audit/schemas/audit-log.schema.js';
import { Role } from '../src/common/enums/role.enum.js';
import { DemoService } from '../src/demo/demo.service.js';
import { createTestContext } from './utils/test-app.js';

const ADMIN = { email: 'admin@test.local', password: 'Admin#12345' };

interface AuditPage {
  total: number;
  data: { actorEmail: string }[];
}

describe('Audit log in demo mode', () => {
  let ctx: Awaited<ReturnType<typeof createTestContext>>;

  beforeAll(async () => {
    ctx = await createTestContext({ demoMode: true });
    await ctx.createUser(ADMIN.email, ADMIN.password, Role.ADMIN);
  });

  afterAll(async () => {
    await ctx.close();
  });

  it('shows demo visitors only demo events and real admins only real ones', async () => {
    const demo = request.agent(ctx.server);
    const login = await demo.post('/api/demo/login').send({ role: 'admin' });
    expect(login.status).toBe(200);
    const real = await ctx.login(ADMIN.email, ADMIN.password, 'admin');

    const demoPage = (await demo.get('/api/audit-logs')).body as AuditPage;
    const realPage = (await real.get('/api/audit-logs')).body as AuditPage;

    expect(demoPage.total).toBe(1);
    expect(demoPage.data[0].actorEmail.endsWith('@demo.example.com')).toBe(
      true,
    );
    expect(realPage.total).toBe(1);
    expect(realPage.data[0].actorEmail).toBe(ADMIN.email);
  });

  it('clears the demo events when the demo data is reset', async () => {
    const auditModel = ctx.app.get<Model<AuditLog>>(
      getModelToken(AuditLog.name),
      {
        strict: false,
      },
    );

    await ctx.app.get(DemoService, { strict: false }).reset();

    expect(await auditModel.countDocuments({ isDemo: true })).toBe(0);
    expect(await auditModel.countDocuments({ isDemo: false })).toBe(1);
  });
});
