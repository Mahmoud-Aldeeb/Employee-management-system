import { describe, expect, it } from 'vitest';
import { buildAuditFilter } from '../src/audit/audit-filter.js';
import { AuditAction } from '../src/audit/audit.types.js';
import { cairoDayStart } from '../src/common/utils/cairo-time.js';

describe('cairoDayStart', () => {
  it('returns the Cairo midnight of a winter day', () => {
    expect(cairoDayStart(new Date('2026-01-15')).toISOString()).toBe(
      '2026-01-14T22:00:00.000Z',
    );
  });

  it('follows daylight saving time in summer', () => {
    expect(cairoDayStart(new Date('2026-07-15')).toISOString()).toBe(
      '2026-07-14T21:00:00.000Z',
    );
  });
});

describe('buildAuditFilter', () => {
  it('scopes the query to demo or real events', () => {
    expect(buildAuditFilter({}, false)).toEqual({ isDemo: false });
    expect(buildAuditFilter({}, true)).toEqual({ isDemo: true });
  });

  it('adds the action', () => {
    expect(
      buildAuditFilter({ action: AuditAction.LEAVE_APPROVED }, false),
    ).toEqual({
      isDemo: false,
      action: AuditAction.LEAVE_APPROVED,
    });
  });

  it('turns the date range into Cairo day bounds', () => {
    expect(
      buildAuditFilter({ from: '2026-01-15', to: '2026-01-16' }, false),
    ).toEqual({
      isDemo: false,
      createdAt: {
        $gte: new Date('2026-01-14T22:00:00.000Z'),
        $lt: new Date('2026-01-16T22:00:00.000Z'),
      },
    });
  });

  it('searches the actor and the target case-insensitively and escapes input', () => {
    expect(buildAuditFilter({ search: ' a.b* ' }, false)).toEqual({
      isDemo: false,
      $or: [{ actorEmail: /a\.b\*/i }, { targetLabel: /a\.b\*/i }],
    });
  });

  it('ignores a blank search', () => {
    expect(buildAuditFilter({ search: '   ' }, false)).toEqual({
      isDemo: false,
    });
  });
});
