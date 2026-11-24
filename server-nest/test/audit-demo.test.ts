import { getModelToken } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AuditLog } from '../src/audit/schemas/audit-log.schema.js';
import { Role } from '../src/common/enums/role.enum.js';
import { DemoService } from '../src/demo/demo.service.js';
import { createTestContext } from './utils/test-app.js';

const ADMIN = { email: 'admin@test.local', password: 'Admin#12345' };
const DEMO_DOMAIN = '@demo.example.com';

interface AuditPage {
  total: number;
  data: { actorEmail: string }[];
}

describe('Audit log in demo mode', () => {
  let ctx: Awaited<ReturnType<typeof createTestContext>>;
  let auditModel: Model<AuditLog>;

  beforeAll(async () => {
    ctx = await createTestContext({ demoMode: true });
    await ctx.createUser(ADMIN.email, ADMIN.password, Role.ADMIN);
    auditModel = ctx.app.get<Model<AuditLog>>(getModelToken(AuditLog.name), {
      strict: false,
    });
  });

  afterAll(async () => {
    await ctx.close();
  });

  it('shows demo visitors only demo events and real admins only real ones', async () => {
    const demo = request.agent(ctx.server);
    const login = await demo.post('/api/demo/login').send({ role: 'admin' });
    expect(login.status).toBe(200);
    const real = await ctx.login(ADMIN.email, ADMIN.password, 'admin');

    const demoPage = (await demo.get('/api/audit-logs?limit=50'))
      .body as AuditPage;
    const realPage = (await real.get('/api/audit-logs?limit=50'))
      .body as AuditPage;

    expect(demoPage.total).toBeGreaterThan(20);
    expect(
      demoPage.data.every((row) => row.actorEmail.endsWith(DEMO_DOMAIN)),
    ).toBe(true);
    expect(realPage.total).toBe(1);
    expect(realPage.data[0].actorEmail).toBe(ADMIN.email);
  });

  it('restores the seeded history and drops demo activity on reset', async () => {
    expect(
      await auditModel.countDocuments({ isDemo: true, action: 'ADMIN_LOGIN' }),
    ).toBe(1);

    await ctx.app.get(DemoService, { strict: false }).reset();

    expect(
      await auditModel.countDocuments({ isDemo: true, action: 'ADMIN_LOGIN' }),
    ).toBe(0);
    expect(await auditModel.countDocuments({ isDemo: true })).toBeGreaterThan(
      20,
    );
    expect(await auditModel.countDocuments({ isDemo: false })).toBe(1);
  });
});
