import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Role } from '../src/common/enums/role.enum.js';
import { employeePayload } from './utils/factories.js';
import { createTestContext } from './utils/test-app.js';

const ADMIN = { email: 'admin@test.local', password: 'Admin#12345' };
const OFFICE = { latitude: 30.0444, longitude: 31.2357 };

const sample = (
  latitude: number,
  longitude: number,
  overrides: Partial<{ accuracy: number; capturedAt: number }> = {},
) => ({
  location: {
    latitude,
    longitude,
    accuracy: 15,
    capturedAt: Date.now(),
    ...overrides,
  },
});
const nearOffice = () => sample(OFFICE.latitude + 0.0009, OFFICE.longitude);
const farAway = () => sample(OFFICE.latitude + 0.01, OFFICE.longitude);

describe('Clocking in from the work location', () => {
  let ctx: Awaited<ReturnType<typeof createTestContext>>;
  let admin: Awaited<ReturnType<typeof ctx.login>>;
  let workplaceId: string;

  const staff = async (name: string) => {
    const payload = employeePayload(`${name}@test.local`, {
      firstName: name,
      lastName: 'Tester',
    });
    const created = await admin.post('/api/employees').send(payload);
    expect(created.status).toBe(201);
    return {
      id: created.body.employee._id as string,
      agent: await ctx.login(payload.email, payload.password, 'employee'),
    };
  };

  const auditCount = async (action: string) =>
    (await admin.get(`/api/audit-logs?action=${action}`)).body.total as number;

  beforeAll(async () => {
    ctx = await createTestContext();
    await ctx.createUser(ADMIN.email, ADMIN.password, Role.ADMIN);
    admin = await ctx.login(ADMIN.email, ADMIN.password, 'admin');
  });

  afterAll(async () => {
    await ctx.close();
  });

  it('lets anyone clock in while no work location is set', async () => {
    const { agent } = await staff('early');

    const policy = await agent.get('/api/attendance/policy');
    expect(policy.body).toEqual({ locationRequired: false, workplaces: [] });

    const res = await agent.post('/api/attendance');
    expect(res.status).toBe(200);
    expect(res.body.data.checkInLocation).toBeNull();
  });

  it('keeps work locations away from employees', async () => {
    const { agent } = await staff('curious');

    expect((await agent.get('/api/workplaces')).status).toBe(403);
    expect(
      (
        await agent
          .post('/api/workplaces')
          .send({ name: 'X', latitude: 1, longitude: 1 })
      ).status,
    ).toBe(403);
  });

  it('creates a work location and records it in the audit log', async () => {
    const res = await admin
      .post('/api/workplaces')
      .send({ name: 'Main Office', ...OFFICE });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      name: 'Main Office',
      radiusMeters: 150,
      isActive: true,
    });
    workplaceId = res.body.id;
    expect(await auditCount('WORKPLACE_CREATED')).toBe(1);
  });

  it('validates the position, the radius and the name', async () => {
    const badLatitude = await admin
      .post('/api/workplaces')
      .send({ name: 'A', latitude: 95, longitude: 31 });
    const tinyRadius = await admin
      .post('/api/workplaces')
      .send({ name: 'B', ...OFFICE, radiusMeters: 10 });
    const duplicate = await admin
      .post('/api/workplaces')
      .send({ name: 'Main Office', ...OFFICE });

    expect(badLatitude.status).toBe(400);
    expect(tinyRadius.status).toBe(400);
    expect(duplicate.status).toBe(400);
    expect(duplicate.body.error).toBe(
      'A location with this name already exists',
    );
  });

  it('tells employees that the location is now required', async () => {
    const { agent } = await staff('policy');

    const policy = await agent.get('/api/attendance/policy');

    expect(policy.body).toEqual({
      locationRequired: true,
      workplaces: [{ name: 'Main Office', radiusMeters: 150 }],
    });
  });

  it('asks for the location when none was sent', async () => {
    const { agent } = await staff('nolocation');

    const res = await agent.post('/api/attendance');

    expect(res.status).toBe(422);
    expect(res.body).toEqual({
      error: 'Allow location access to clock in.',
      code: 'LOCATION_REQUIRED',
    });
  });

  it('accepts a clock in at the office and keeps only a summary of the position', async () => {
    const { agent } = await staff('inside');

    const res = await agent.post('/api/attendance').send(nearOffice());

    expect(res.status).toBe(200);
    expect(res.body.type).toBe('CHECK_IN');
    expect(res.body.data.checkInLocation).toEqual({
      status: 'INSIDE',
      workplaceName: 'Main Office',
      distanceMeters: 100,
      accuracyMeters: 15,
    });
    expect(JSON.stringify(res.body)).not.toContain('30.045');
  });

  it('refuses a clock in from far away and creates no record', async () => {
    const { agent } = await staff('faraway');

    const res = await agent.post('/api/attendance').send(farAway());
    expect(res.status).toBe(403);
    expect(res.body).toEqual({
      error: 'You are 1.1 km from Main Office (allowed 150 m).',
      code: 'OUTSIDE_WORKPLACE',
    });
    expect((await agent.get('/api/attendance')).body.data).toHaveLength(0);

    expect(
      (await agent.post('/api/attendance').send(nearOffice())).status,
    ).toBe(200);
  });

  it('refuses a reading that is imprecise or out of date', async () => {
    const { agent } = await staff('unsure');

    const imprecise = await agent
      .post('/api/attendance')
      .send(sample(OFFICE.latitude, OFFICE.longitude, { accuracy: 500 }));
    expect(imprecise.status).toBe(422);
    expect(imprecise.body.code).toBe('LOCATION_LOW_ACCURACY');

    const stale = await agent
      .post('/api/attendance')
      .send(
        sample(OFFICE.latitude, OFFICE.longitude, {
          capturedAt: Date.now() - 600_000,
        }),
      );
    expect(stale.status).toBe(422);
    expect(stale.body.code).toBe('LOCATION_STALE');
  });

  it('rejects a malformed location', async () => {
    const { agent } = await staff('malformed');

    const res = await agent
      .post('/api/attendance')
      .send({
        location: {
          latitude: 'north',
          longitude: 31,
          accuracy: 5,
          capturedAt: Date.now(),
        },
      });

    expect(res.status).toBe(400);
  });

  it('never blocks a clock out but records where it happened', async () => {
    const outer = await staff('outer');
    await outer.agent.post('/api/attendance').send(nearOffice());
    const away = await outer.agent.post('/api/attendance').send(farAway());
    expect(away.status).toBe(200);
    expect(away.body.type).toBe('CHECK_OUT');
    expect(away.body.data.checkOutLocation).toMatchObject({
      status: 'OUTSIDE',
      workplaceName: 'Main Office',
    });

    const silent = await staff('silent');
    await silent.agent.post('/api/attendance').send(nearOffice());
    const unknown = await silent.agent.post('/api/attendance');
    expect(unknown.body.data.checkOutLocation).toEqual({
      status: 'UNVERIFIED',
      workplaceName: null,
      distanceMeters: null,
      accuracyMeters: null,
    });

    const steady = await staff('steady');
    await steady.agent.post('/api/attendance').send(nearOffice());
    const home = await steady.agent.post('/api/attendance').send(nearOffice());
    expect(home.body.data.checkOutLocation).toMatchObject({
      status: 'INSIDE',
      distanceMeters: 100,
    });
  });

  it('exempts employees who may clock in from anywhere', async () => {
    const { id, agent } = await staff('remote');
    const update = await admin
      .put(`/api/employees/${id}`)
      .send({ canCheckInAnywhere: true });
    expect(update.status).toBe(200);

    const policy = await agent.get('/api/attendance/policy');
    expect(policy.body.locationRequired).toBe(false);

    const res = await agent.post('/api/attendance');
    expect(res.status).toBe(200);
    expect(res.body.data.checkInLocation).toBeNull();
  });

  it('updates a location and records the change', async () => {
    const res = await admin
      .put(`/api/workplaces/${workplaceId}`)
      .send({ radiusMeters: 300 });
    expect(res.status).toBe(200);

    const audit = await admin.get('/api/audit-logs?action=WORKPLACE_UPDATED');
    expect(audit.body.total).toBe(1);
    expect(audit.body.data[0].changes).toEqual([
      { field: 'radiusMeters', from: 150, to: 300 },
    ]);
  });

  it('stops requiring the location when every location is switched off', async () => {
    const off = await admin
      .put(`/api/workplaces/${workplaceId}`)
      .send({ isActive: false });
    expect(off.status).toBe(200);
    expect((await admin.get('/api/workplaces')).body[0].isActive).toBe(false);

    const { agent } = await staff('free');
    expect(
      (await agent.get('/api/attendance/policy')).body.locationRequired,
    ).toBe(false);
    expect((await agent.post('/api/attendance')).status).toBe(200);
  });

  it('deletes a location and records it', async () => {
    const res = await admin.delete(`/api/workplaces/${workplaceId}`);
    expect(res.status).toBe(200);

    expect((await admin.get('/api/workplaces')).body).toEqual([]);
    expect(await auditCount('WORKPLACE_DELETED')).toBe(1);
    expect((await admin.delete(`/api/workplaces/${workplaceId}`)).status).toBe(
      404,
    );
  });
});
