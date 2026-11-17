import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Role } from '../src/common/enums/role.enum.js';
import { dateFromNow, employeePayload } from './utils/factories.js';
import { createTestContext } from './utils/test-app.js';

const ADMIN = { email: 'admin@test.local', password: 'Admin#12345' };
const SARA = employeePayload('sara@test.local');

describe('Attendance and leave', () => {
  let ctx: Awaited<ReturnType<typeof createTestContext>>;
  let admin: Awaited<ReturnType<typeof ctx.login>>;
  let sara: Awaited<ReturnType<typeof ctx.login>>;
  let leaveId: string;

  beforeAll(async () => {
    ctx = await createTestContext();
    await ctx.createUser(ADMIN.email, ADMIN.password, Role.ADMIN);
    admin = await ctx.login(ADMIN.email, ADMIN.password, 'admin');
    await admin.post('/api/employees').send(SARA);
    sara = await ctx.login(SARA.email, SARA.password, 'employee');
  });

  afterAll(async () => {
    await ctx.close();
  });

  describe('attendance', () => {
    it('checks in, then checks out, and stays checked out', async () => {
      const checkIn = await sara.post('/api/attendance');
      expect(checkIn.status).toBe(200);
      expect(checkIn.body.type).toBe('CHECK_IN');
      expect(checkIn.body.data.checkIn).toBeTruthy();
      expect(checkIn.body.data.checkOut).toBeNull();
      expect(
        ctx.events.some((event) => event.name === 'employee/check-out'),
      ).toBe(true);

      const checkOut = await sara.post('/api/attendance');
      expect(checkOut.body.type).toBe('CHECK_OUT');
      expect(checkOut.body.data.checkOut).toBeTruthy();
      expect(checkOut.body.data.dayType).toBe('Short Day');

      const again = await sara.post('/api/attendance');
      expect(again.body.type).toBe('CHECK_OUT');
      expect(again.body.data.checkOut).toBe(checkOut.body.data.checkOut);
    });

    it('returns the history of the current employee', async () => {
      const res = await sara.get('/api/attendance');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.employee.isDeleted).toBe(false);
    });

    it('validates the limit parameter', async () => {
      const res = await sara.get('/api/attendance?limit=0');

      expect(res.status).toBe(400);
    });

    it('does not let a user without an employee record check in', async () => {
      const res = await admin.post('/api/attendance');

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Employee not found');
    });
  });

  describe('leave', () => {
    it('creates a leave request and schedules the reminder', async () => {
      const res = await sara.post('/api/leave').send({
        type: 'ANNUAL',
        startDate: dateFromNow(3),
        endDate: dateFromNow(4),
        reason: 'Family trip',
      });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('PENDING');
      expect(ctx.events.some((event) => event.name === 'leave/pending')).toBe(
        true,
      );
      leaveId = res.body.data._id;
    });

    it('rejects invalid leave requests', async () => {
      const past = await sara.post('/api/leave').send({
        type: 'SICK',
        startDate: dateFromNow(-2),
        endDate: dateFromNow(-1),
        reason: 'Too late',
      });
      expect(past.status).toBe(400);
      expect(past.body.error).toBe('Leave dates must be in the future');

      const reversed = await sara.post('/api/leave').send({
        type: 'SICK',
        startDate: dateFromNow(6),
        endDate: dateFromNow(5),
        reason: 'Backwards',
      });
      expect(reversed.status).toBe(400);
      expect(reversed.body.error).toBe('End date cannot be before start date');

      const badType = await sara.post('/api/leave').send({
        type: 'VACATION',
        startDate: dateFromNow(3),
        endDate: dateFromNow(4),
        reason: 'Unknown type',
      });
      expect(badType.status).toBe(400);
    });

    it('does not let an employee change a leave status', async () => {
      const res = await sara
        .patch(`/api/leave/${leaveId}`)
        .send({ status: 'APPROVED' });

      expect(res.status).toBe(403);
    });

    it('lets an admin approve a leave request', async () => {
      const res = await admin
        .patch(`/api/leave/${leaveId}`)
        .send({ status: 'APPROVED' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('APPROVED');
    });

    it('validates the status and the leave id', async () => {
      const badStatus = await admin
        .patch(`/api/leave/${leaveId}`)
        .send({ status: 'MAYBE' });
      expect(badStatus.status).toBe(400);

      const invalidId = await admin
        .patch('/api/leave/not-an-id')
        .send({ status: 'APPROVED' });
      expect(invalidId.status).toBe(400);

      const missing = await admin
        .patch('/api/leave/64b7f0c2e1d3a4b5c6d7e8f9')
        .send({ status: 'APPROVED' });
      expect(missing.status).toBe(404);
    });

    it('shows employees their own leaves and admins all of them', async () => {
      const mine = await sara.get('/api/leave');
      expect(mine.status).toBe(200);
      expect(mine.body.data).toHaveLength(1);

      const all = await admin.get('/api/leave?status=APPROVED');
      expect(all.status).toBe(200);
      expect(all.body.data).toHaveLength(1);
      expect(all.body.data[0].employee.firstName).toBe('Test');

      const none = await admin.get('/api/leave?status=REJECTED');
      expect(none.body.data).toHaveLength(0);
    });
  });
});
