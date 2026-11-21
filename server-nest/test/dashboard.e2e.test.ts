import { getModelToken } from '@nestjs/mongoose';
import mongoose, { type Model } from 'mongoose';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { LeaveStatus } from '../src/common/enums/leave-status.enum.js';
import { LeaveType } from '../src/common/enums/leave-type.enum.js';
import { Role } from '../src/common/enums/role.enum.js';
import { cairoDay } from '../src/common/utils/cairo-time.js';
import { LeaveApplication } from '../src/leave/schemas/leave-application.schema.js';
import { leaveWindow, employeePayload } from './utils/factories.js';
import { createTestContext } from './utils/test-app.js';

const ADMIN = { email: 'admin@test.local', password: 'Admin#12345' };
const todayKey = cairoDay().toISOString().slice(0, 10);
const SARA = employeePayload('sara.dash@test.local', {
  firstName: 'Sara',
  lastName: 'Ali',
});
const OMAR = employeePayload('omar.dash@test.local', {
  firstName: 'Omar',
  lastName: 'Nabil',
  department: 'Sales',
  joinDate: todayKey,
});

const SARA_LEAVE = leaveWindow();

describe('Dashboard', () => {
  let ctx: Awaited<ReturnType<typeof createTestContext>>;
  let admin: Awaited<ReturnType<typeof ctx.login>>;
  let sara: Awaited<ReturnType<typeof ctx.login>>;
  let omar: Awaited<ReturnType<typeof ctx.login>>;
  let saraLeaveId: string;

  beforeAll(async () => {
    ctx = await createTestContext();
    await ctx.createUser(ADMIN.email, ADMIN.password, Role.ADMIN);
    admin = await ctx.login(ADMIN.email, ADMIN.password, 'admin');
  });

  afterAll(async () => {
    await ctx.close();
  });

  it('returns zeros and a full seven-day trend for an empty workspace', async () => {
    const res = await admin.get('/api/dashboard');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      role: 'ADMIN',
      totalEmployees: 0,
      attendanceRate: 0,
      monthlyPayroll: 0,
      pendingRequests: [],
      whosOut: [],
      departments: [],
    });
    expect(res.body.attendanceTrend).toHaveLength(7);
  });

  it('builds the admin overview from real activity', async () => {
    const saraCreated = await admin.post('/api/employees').send(SARA);
    const omarCreated = await admin.post('/api/employees').send(OMAR);
    sara = await ctx.login(SARA.email, SARA.password, 'employee');
    omar = await ctx.login(OMAR.email, OMAR.password, 'employee');
    expect(saraCreated.status).toBe(201);

    const leaves = ctx.app.get<Model<LeaveApplication>>(
      getModelToken(LeaveApplication.name),
    );
    await leaves.create({
      employeeId: new mongoose.Types.ObjectId(omarCreated.body.employee._id),
      type: LeaveType.CASUAL,
      startDate: cairoDay(),
      endDate: cairoDay(),
      reason: 'Moving',
      status: LeaveStatus.APPROVED,
    });

    expect((await sara.post('/api/attendance')).status).toBe(200);
    const request = await sara.post('/api/leave').send({
      type: 'ANNUAL',
      startDate: SARA_LEAVE.start,
      endDate: SARA_LEAVE.end,
      reason: 'Family trip',
    });
    expect(request.status).toBe(201);
    saraLeaveId = request.body.data._id;

    const { body } = await admin.get('/api/dashboard');

    expect(body).toMatchObject({
      role: 'ADMIN',
      totalEmployees: 2,
      totalDepartments: 2,
      newHiresThisMonth: 1,
      todayAttendance: 1,
      attendanceRate: 50,
      pendingLeaves: 1,
      monthlyPayroll: 10600,
    });
    expect([0, 1]).toContain(body.lateToday);
    expect(body.departments).toEqual([
      { department: 'Engineering', count: 1 },
      { department: 'Sales', count: 1 },
    ]);
    expect(body.pendingRequests).toHaveLength(1);
    expect(body.pendingRequests[0]).toMatchObject({
      employeeName: 'Sara Ali',
      type: 'ANNUAL',
    });
    expect(body.whosOut).toHaveLength(1);
    expect(body.whosOut[0]).toMatchObject({
      employeeName: 'Omar Nabil',
      type: 'CASUAL',
    });
    expect(body.attendanceTrend).toHaveLength(7);
    expect(body.attendanceTrend.at(-1)).toMatchObject({
      date: todayKey,
      checkedIn: 1,
    });
  });

  it('gives an employee a personal summary', async () => {
    const { body } = await sara.get('/api/dashboard');

    expect(body.role).toBe('EMPLOYEE');
    expect(body.employee.firstName).toBe('Sara');
    expect(body.salary.netSalary).toBe(5300);
    expect(body.todayRecord).not.toBeNull();
    expect(body.currentMonthAttendance).toBeGreaterThanOrEqual(1);
    expect(body.pendingLeaves).toBe(1);
    expect(body.upcomingLeave).toBeNull();
    expect(body.latestPayslip).toBeNull();
  });

  it('describes the employee leave balance and finds the next leave', async () => {
    const { body } = await omar.get('/api/dashboard');

    expect(body.todayRecord).toBeNull();
    expect(body.leaveBalance).toMatchObject({
      tier: 'first-year',
      entitlement: 15,
      sickTaken: 0,
    });
    expect(body.leaveBalance.casual.limit).toBe(7);
    expect(body.upcomingLeave).toMatchObject({ type: 'CASUAL' });
    expect(body.upcomingLeave.startDate.startsWith(todayKey)).toBe(true);
  });

  it('shows an approved leave as the upcoming one', async () => {
    const approve = await admin
      .patch(`/api/leave/${saraLeaveId}`)
      .send({ status: 'APPROVED' });
    expect(approve.status).toBe(200);

    const { body } = await sara.get('/api/dashboard');

    expect(body.upcomingLeave.startDate.startsWith(SARA_LEAVE.start)).toBe(
      true,
    );
    expect(body.pendingLeaves).toBe(0);
  });
});
