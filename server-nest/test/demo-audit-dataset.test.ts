import { describe, expect, it } from 'vitest';
import { AuditAction } from '../src/audit/audit.types.js';
import { buildDemoDataset } from '../src/demo/demo-dataset.js';
import { DEMO_ADMIN_EMAIL } from '../src/demo/demo.constants.js';

const NOW = new Date('2026-11-21T10:00:00.000Z');
const PASSWORD_HASH = 'secret-hash-value';
const DAY_MS = 86_400_000;

const dataset = buildDemoDataset({ now: NOW, passwordHash: PASSWORD_HASH });
const logs = dataset.auditLogs;
const countOf = (action: AuditAction) =>
  logs.filter((log) => log.action === action).length;

describe('demo audit history', () => {
  it('is large enough to need more than one page', () => {
    expect(logs.length).toBeGreaterThan(20);
  });

  it('belongs to the demo admin only', () => {
    expect(logs.every((log) => log.isDemo)).toBe(true);
    expect(logs.every((log) => log.actorEmail === DEMO_ADMIN_EMAIL)).toBe(true);
    expect(logs.every((log) => log.actorId.equals(dataset.users[0]._id))).toBe(
      true,
    );
  });

  it('mirrors the decided leaves and the latest payslips', () => {
    expect(countOf(AuditAction.LEAVE_APPROVED)).toBe(6);
    expect(countOf(AuditAction.LEAVE_REJECTED)).toBe(2);
    expect(countOf(AuditAction.PAYSLIP_CREATED)).toBe(dataset.employees.length);
    expect(countOf(AuditAction.SALARY_UPDATED)).toBe(2);
  });

  it('never lies in the future or outlives the retention window', () => {
    for (const log of logs) {
      expect(log.createdAt.getTime()).toBeLessThanOrEqual(NOW.getTime());
      expect(NOW.getTime() - log.createdAt.getTime()).toBeLessThan(
        170 * DAY_MS,
      );
    }
  });

  it('contains no secret', () => {
    expect(JSON.stringify(logs)).not.toContain(PASSWORD_HASH);
  });
});
