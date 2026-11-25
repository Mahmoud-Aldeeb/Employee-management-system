import { describe, expect, it } from 'vitest';
import { buildDemoDataset } from '../src/demo/demo-dataset.js';
import { NotificationType } from '../src/notifications/notification.types.js';

const NOW = new Date('2026-11-21T10:00:00.000Z');
const PASSWORD_HASH = 'secret-hash-value';
const DAY_MS = 86_400_000;

const dataset = buildDemoDataset({ now: NOW, passwordHash: PASSWORD_HASH });
const adminId = dataset.users[0]._id;
const salmaId = dataset.employees[0].userId;
const forUser = (id: typeof adminId) =>
  dataset.notifications.filter((item) => item.userId.equals(id));
const unread = (items: typeof dataset.notifications) =>
  items.filter((item) => item.readAt === null);

describe('demo notifications', () => {
  it('belong to the demo admin and the demo employee only', () => {
    expect(forUser(adminId).length + forUser(salmaId).length).toBe(
      dataset.notifications.length,
    );
  });

  it('give the admin a request per pending leave, the oldest already read', () => {
    const items = forUser(adminId);

    expect(items).toHaveLength(4);
    expect(
      items.every((item) => item.type === NotificationType.LEAVE_REQUESTED),
    ).toBe(true);
    expect(unread(items)).toHaveLength(3);
  });

  it('give the demo employee a decision and a new payslip', () => {
    const items = forUser(salmaId);

    expect(items.map((item) => item.type).sort()).toEqual([
      NotificationType.LEAVE_DECIDED,
      NotificationType.PAYSLIP_ISSUED,
    ]);
    expect(unread(items)).toHaveLength(1);
  });

  it('never lie in the future or outlive the retention window', () => {
    for (const item of dataset.notifications) {
      expect(item.createdAt.getTime()).toBeLessThanOrEqual(NOW.getTime());
      expect(NOW.getTime() - item.createdAt.getTime()).toBeLessThan(
        85 * DAY_MS,
      );
      if (item.readAt) {
        expect(item.readAt.getTime()).toBeGreaterThanOrEqual(
          item.createdAt.getTime(),
        );
        expect(item.readAt.getTime()).toBeLessThanOrEqual(NOW.getTime());
      }
    }
  });

  it('contain no secret', () => {
    expect(JSON.stringify(dataset.notifications)).not.toContain(PASSWORD_HASH);
  });
});
