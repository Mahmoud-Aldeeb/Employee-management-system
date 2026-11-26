import { getModelToken } from '@nestjs/mongoose';
import { Types, type Model } from 'mongoose';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Role } from '../src/common/enums/role.enum.js';
import { Notification } from '../src/notifications/schemas/notification.schema.js';
import { employeePayload, leaveWindow } from './utils/factories.js';
import { createTestContext } from './utils/test-app.js';
import { absenceReminderContent } from '../src/notifications/notification-content.js';
import { NotificationPublisher } from '../src/notifications/notification-publisher.service.js';
import { NotificationType } from '../src/notifications/notification.types.js';

const ADMIN = { email: 'admin@test.local', password: 'Admin#12345' };
const SECOND_ADMIN = { email: 'admin2@test.local', password: 'Admin#67890' };
const SARA = employeePayload('sara@test.local', {
  firstName: 'Sara',
  lastName: 'Ali',
});

interface NotificationRow {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string;
  readAt: string | null;
}

interface NotificationPage {
  data: NotificationRow[];
  page: number;
  total: number;
  totalPages: number;
  unreadCount: number;
}

describe('Notifications', () => {
  let ctx: Awaited<ReturnType<typeof createTestContext>>;
  let admin: Awaited<ReturnType<typeof ctx.login>>;
  let secondAdmin: Awaited<ReturnType<typeof ctx.login>>;
  let sara: Awaited<ReturnType<typeof ctx.login>>;
  let employeeId: string;
  let leaveId: string;

  const listFor = async (agent: typeof admin, query = '') => {
    const res = await agent.get(`/api/notifications${query}`);
    expect(res.status).toBe(200);
    return res.body as NotificationPage;
  };

  const unreadOf = async (agent: typeof admin) => {
    const res = await agent.get('/api/notifications/unread-count');
    expect(res.status).toBe(200);
    return res.body.count as number;
  };

  beforeAll(async () => {
    ctx = await createTestContext();
    await ctx.createUser(ADMIN.email, ADMIN.password, Role.ADMIN);
    await ctx.createUser(SECOND_ADMIN.email, SECOND_ADMIN.password, Role.ADMIN);
    admin = await ctx.login(ADMIN.email, ADMIN.password, 'admin');
    secondAdmin = await ctx.login(
      SECOND_ADMIN.email,
      SECOND_ADMIN.password,
      'admin',
    );

    const created = await admin.post('/api/employees').send(SARA);
    employeeId = created.body.employee._id;
    sara = await ctx.login(SARA.email, SARA.password, 'employee');
  });

  afterAll(async () => {
    await ctx.close();
  });

  it('requires authentication', async () => {
    expect((await request(ctx.server).get('/api/notifications')).status).toBe(
      401,
    );
    expect(
      (await request(ctx.server).get('/api/notifications/unread-count')).status,
    ).toBe(401);
  });

  it('starts empty', async () => {
    expect(await unreadOf(admin)).toBe(0);
    expect(await unreadOf(sara)).toBe(0);
  });

  it('tells every admin about a new leave request', async () => {
    const window = leaveWindow();
    const res = await sara.post('/api/leave').send({
      type: 'ANNUAL',
      startDate: window.start,
      endDate: window.end,
      reason: 'Family trip',
    });
    expect(res.status).toBe(201);
    leaveId = res.body.data._id;

    for (const agent of [admin, secondAdmin]) {
      const page = await listFor(agent);
      expect(page.unreadCount).toBe(1);
      expect(page.data[0]).toMatchObject({
        type: 'LEAVE_REQUESTED',
        title: 'New leave request',
        link: '/leave',
        readAt: null,
      });
      expect(page.data[0].message).toContain('Sara Ali');
      expect(page.data[0].message).toContain('annual');
    }
    expect(await unreadOf(sara)).toBe(0);
  });

  it('tells the employee about each real status change', async () => {
    const approve = await admin
      .patch(`/api/leave/${leaveId}`)
      .send({ status: 'APPROVED' });
    expect(approve.status).toBe(200);
    await admin.patch(`/api/leave/${leaveId}`).send({ status: 'APPROVED' });

    const afterApproval = await listFor(sara);
    expect(afterApproval.total).toBe(1);
    expect(afterApproval.data[0]).toMatchObject({
      type: 'LEAVE_DECIDED',
      title: 'Leave approved',
    });

    await admin.patch(`/api/leave/${leaveId}`).send({ status: 'REJECTED' });

    const afterRejection = await listFor(sara);
    expect(afterRejection.total).toBe(2);
    expect(afterRejection.data[0].title).toBe('Leave rejected');
  });

  it('tells the employee about a new payslip', async () => {
    const res = await admin
      .post('/api/payslips')
      .send({ employeeId, month: 10, year: 2026 });
    expect(res.status).toBe(201);

    const page = await listFor(sara, '?unread=true');
    const payslip = page.data.find((row) => row.type === 'PAYSLIP_ISSUED');

    expect(payslip?.message).toContain('10/2026');
    expect(payslip?.link).toBe('/payslips');
  });

  it('keeps notifications private to their owner', async () => {
    const [first] = (await listFor(sara)).data;

    const stolen = await admin.patch(`/api/notifications/${first.id}/read`);
    expect(stolen.status).toBe(404);
    expect(
      (await listFor(sara)).data.find((row) => row.id === first.id)?.readAt,
    ).toBeNull();

    const invalid = await sara.patch('/api/notifications/not-an-id/read');
    expect(invalid.status).toBe(400);
    expect(invalid.body.error).toBe('Invalid id');

    const missing = await sara.patch(
      '/api/notifications/64b7f0c2e1d3a4b5c6d7e8f9/read',
    );
    expect(missing.status).toBe(404);
  });

  it('marks one notification as read and stays idempotent', async () => {
    const before = await unreadOf(sara);
    const [first] = (await listFor(sara)).data;

    expect(
      (await sara.patch(`/api/notifications/${first.id}/read`)).status,
    ).toBe(200);
    expect(await unreadOf(sara)).toBe(before - 1);

    expect(
      (await sara.patch(`/api/notifications/${first.id}/read`)).status,
    ).toBe(200);
    expect(await unreadOf(sara)).toBe(before - 1);
    expect((await listFor(sara)).data[0].readAt).not.toBeNull();
  });

  it('filters unread notifications and paginates', async () => {
    const unread = await listFor(sara, '?unread=true');
    expect(unread.data.every((row) => row.readAt === null)).toBe(true);
    expect(unread.total).toBe(unread.unreadCount);

    const second = await listFor(sara, '?limit=1&page=2');
    expect(second.data).toHaveLength(1);
    expect(second.page).toBe(2);
    expect(second.totalPages).toBe(second.total);

    expect((await sara.get('/api/notifications?unread=maybe')).status).toBe(
      400,
    );
    expect((await sara.get('/api/notifications?limit=51')).status).toBe(400);
  });

  it('marks everything as read without touching other users', async () => {
    const res = await sara.post('/api/notifications/read-all');
    expect(res.status).toBe(200);

    expect(await unreadOf(sara)).toBe(0);
    expect((await listFor(sara, '?unread=true')).total).toBe(0);
    expect(await unreadOf(admin)).toBe(1);
    expect(await unreadOf(secondAdmin)).toBe(1);
  });

  it('expires entries after 90 days', async () => {
    const model = ctx.app.get<Model<Notification>>(
      getModelToken(Notification.name),
      {
        strict: false,
      },
    );
    const indexes = await model.collection.indexes();

    expect(
      indexes.some((index) => index.expireAfterSeconds === 90 * 24 * 60 * 60),
    ).toBe(true);
  });

  it('fans out to many recipients in batches and ignores duplicates', async () => {
    const publisher = ctx.app.get(NotificationPublisher, { strict: false });
    const model = ctx.app.get<Model<Notification>>(
      getModelToken(Notification.name),
      {
        strict: false,
      },
    );
    const recipients = Array.from(
      { length: 1_200 },
      () => new Types.ObjectId(),
    );

    await publisher.notify(
      [...recipients, recipients[0]],
      absenceReminderContent(),
    );

    expect(
      await model.countDocuments({
        type: NotificationType.ATTENDANCE_REMINDER,
      }),
    ).toBe(1_200);
  });
});
