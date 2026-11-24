import { describe, expect, it } from 'vitest';
import { describeValues, diffFields } from '../src/audit/audit-diff.js';

describe('diffFields', () => {
  it('returns only the fields that changed', () => {
    const changes = diffFields(
      { position: 'Developer', phone: '010' },
      { position: 'Lead', phone: '010' },
      ['position', 'phone'],
    );

    expect(changes).toEqual([
      { field: 'position', from: 'Developer', to: 'Lead' },
    ]);
  });

  it('ignores fields that were not sent', () => {
    expect(diffFields({ position: 'Developer' }, {}, ['position'])).toEqual([]);
  });

  it('ignores fields outside the allow list', () => {
    expect(
      diffFields({ password: 'old' }, { password: 'new' }, ['position']),
    ).toEqual([]);
  });

  it('treats a missing value as null', () => {
    expect(diffFields({}, { department: 'Sales' }, ['department'])).toEqual([
      { field: 'department', from: null, to: 'Sales' },
    ]);
  });

  it('compares dates by day', () => {
    const before = { joinDate: new Date('2026-01-15T00:00:00.000Z') };

    expect(
      diffFields(before, { joinDate: new Date('2026-01-15') }, ['joinDate']),
    ).toEqual([]);
    expect(
      diffFields(before, { joinDate: new Date('2026-02-01') }, ['joinDate']),
    ).toEqual([{ field: 'joinDate', from: '2026-01-15', to: '2026-02-01' }]);
  });
});

describe('describeValues', () => {
  it('describes new values as changes from null', () => {
    expect(
      describeValues({
        position: 'Lead',
        department: undefined,
        joinDate: new Date('2026-01-15'),
      }),
    ).toEqual([
      { field: 'position', from: null, to: 'Lead' },
      { field: 'department', from: null, to: null },
      { field: 'joinDate', from: null, to: '2026-01-15' },
    ]);
  });
});
