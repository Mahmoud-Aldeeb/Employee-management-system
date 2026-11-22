import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Role } from '../src/common/enums/role.enum.js';
import { cairoDay } from '../src/common/utils/cairo-time.js';
import { employeePayload, leaveWindow } from './utils/factories.js';
import { createTestContext } from './utils/test-app.js';

interface CalendarEntry {
  employeeName: string;
  status: string;
  type: string | null;
  isMine: boolean;
}

interface CalendarDay {
  date: string;
  isToday: boolean;
  entries: CalendarEntry[];
}

const ADMIN = { email: 'admin@test.local', password: 'Admin#12345' };
const SARA = employeePayload('sara.cal@test.local', {
  firstName: 'Sara',
  lastName: 'Ali',
  department: 'Design',
});
const OMAR = employeePayload('omar.cal@test.local', {
  firstName: 'Omar',
  lastName: 'Nabil',
  department: 'Design',
});
const MONA = employeePayload('mona.cal@test.local', {
  firstName: 'Mona',
  lastName: 'Hassan',
  department: 'Design',
});
const LINA = employeePayload('lina.cal@test.local', {
  firstName: 'Lina',
  lastName: 'Sami',
  department: 'Sales',
});

const window = leaveWindow(3, 2);
const month = window.start.slice(0, 7);

describe('Team calendar', () => {
  let ctx: Awaited<ReturnType<typeof createTestContext>>;
  let admin: Awaited<ReturnType<typeof ctx.login>>;
  let sara: Awaited<ReturnType<typeof ctx.login>>;
  let omar: Awaited<ReturnType<typeof ctx.login>>;
  let lina: Awaited<ReturnType<typeof ctx.login>>;
  let monaLeaveId: string;

  const entriesOnStart = (body: { days: CalendarDay[] }) =>
    body.days.find((item) => item.date === window.start)?.entries ?? [];
  const names = (entries: CalendarEntry[]) =>
    entries.map((entry) => entry.employeeName);

  const requestLeave = async (agent: typeof sara) => {
    const res = await agent
      .post('/api/leave')
      .send({
        type: 'ANNUAL',
        startDate: window.start,
        endDate: window.end,
        reason: 'Calendar test',
      });
    expect(res.status).toBe(201);
    return res.body.data._id as string;
  };

  beforeAll(async () => {
    ctx = await createTestContext();
    await ctx.createUser(ADMIN.email, ADMIN.password, Role.ADMIN);
    admin = await ctx.login(ADMIN.email, ADMIN.password, 'admin');

    for (const person of [SARA, OMAR, MONA, LINA]) {
      expect((await admin.post('/api/employees').send(person)).status).toBe(
        201,
      );
    }
    sara = await ctx.login(SARA.email, SARA.password, 'employee');
    omar = await ctx.login(OMAR.email, OMAR.password, 'employee');
    const mona = await ctx.login(MONA.email, MONA.password, 'employee');
    lina = await ctx.login(LINA.email, LINA.password, 'employee');

    await requestLeave(sara);
    const omarLeaveId = await requestLeave(omar);
    monaLeaveId = await requestLeave(mona);
    const linaLeaveId = await requestLeave(lina);

    await admin.patch(`/api/leave/${omarLeaveId}`).send({ status: 'APPROVED' });
    await admin.patch(`/api/leave/${linaLeaveId}`).send({ status: 'APPROVED' });
  });

  afterAll(async () => {
    await ctx.close();
  });

  it('requires authentication', async () => {
    const res = await request(ctx.server).get('/api/leave/calendar');

    expect(res.status).toBe(401);
  });

  it('shows admins every live leave with its type and a summary', async () => {
    const { status, body } = await admin.get(
      `/api/leave/calendar?month=${month}`,
    );

    expect(status).toBe(200);
    expect(body.month).toBe(month);
    expect(names(entriesOnStart(body))).toEqual([
      'Lina Sami',
      'Mona Hassan',
      'Omar Nabil',
      'Sara Ali',
    ]);
    expect(entriesOnStart(body).every((entry) => entry.type === 'ANNUAL')).toBe(
      true,
    );
    expect(
      entriesOnStart(body).find((entry) => entry.employeeName === 'Mona Hassan')
        ?.status,
    ).toBe('PENDING');
    expect(body.summary).toMatchObject({ employeesOut: 4, pendingLeaves: 2 });
  });

  it('lets admins filter by department', async () => {
    const { body } = await admin.get(
      `/api/leave/calendar?month=${month}&department=Sales`,
    );

    expect(names(entriesOnStart(body))).toEqual(['Lina Sami']);
    expect(body.summary.employeesOut).toBe(1);
  });

  it('shows an employee their own leave and the approved leave of their department only', async () => {
    const { body } = await sara.get(`/api/leave/calendar?month=${month}`);
    const entries = entriesOnStart(body);

    expect(names(entries)).toEqual(['Omar Nabil', 'Sara Ali']);
    expect(
      entries.find((entry) => entry.employeeName === 'Sara Ali'),
    ).toMatchObject({
      type: 'ANNUAL',
      status: 'PENDING',
      isMine: true,
    });
    expect(
      entries.find((entry) => entry.employeeName === 'Omar Nabil'),
    ).toMatchObject({
      type: null,
      status: 'APPROVED',
      isMine: false,
    });
  });

  it('never shows a colleague pending leave', async () => {
    const { body } = await omar.get(`/api/leave/calendar?month=${month}`);

    expect(names(entriesOnStart(body))).toEqual(['Omar Nabil']);
  });

  it('ignores the department filter for employees', async () => {
    const { body } = await sara.get(
      `/api/leave/calendar?month=${month}&department=Sales`,
    );

    expect(names(entriesOnStart(body))).toEqual(['Omar Nabil', 'Sara Ali']);
  });

  it('keeps departments apart', async () => {
    const { body } = await lina.get(`/api/leave/calendar?month=${month}`);

    expect(names(entriesOnStart(body))).toEqual(['Lina Sami']);
  });

  it('defaults to the current month in Cairo with exactly one day marked as today', async () => {
    const { body } = await admin.get('/api/leave/calendar');
    const expected = cairoDay().toISOString().slice(0, 7);

    expect(body.month).toBe(expected);
    expect(body.days.filter((item: CalendarDay) => item.isToday)).toHaveLength(
      1,
    );
  });

  it('gives navigation keys across a year boundary', async () => {
    const { body } = await admin.get('/api/leave/calendar?month=2026-12');

    expect(body.previousMonth).toBe('2026-11');
    expect(body.nextMonth).toBe('2027-01');
    expect(body.days).toHaveLength(31);
  });

  it('validates the query', async () => {
    for (const query of ['month=2026-13', 'month=abc', 'department=Nowhere']) {
      const res = await admin.get(`/api/leave/calendar?${query}`);
      expect(res.status, query).toBe(400);
    }
  });

  it('has no calendar for an employee account without an employee record', async () => {
    await ctx.createUser('ghost@test.local', 'Ghost#12345', Role.EMPLOYEE);
    const ghost = await ctx.login('ghost@test.local', 'Ghost#12345');

    const res = await ghost.get('/api/leave/calendar');

    expect(res.status).toBe(404);
  });

  it('drops a rejected leave from every calendar', async () => {
    await admin.patch(`/api/leave/${monaLeaveId}`).send({ status: 'REJECTED' });

    const { body } = await admin.get(`/api/leave/calendar?month=${month}`);

    expect(names(entriesOnStart(body))).toEqual([
      'Lina Sami',
      'Omar Nabil',
      'Sara Ali',
    ]);
    expect(body.summary.pendingLeaves).toBe(1);
  });
});
