import { describe, expect, it } from 'vitest';
import { LeaveStatus } from '../src/common/enums/leave-status.enum.js';
import { formatLeavePeriod } from '../src/leave/leave-period.js';
import {
  absenceReminderContent,
  autoCheckOutContent,
  leaveDecisionContent,
  leaveReminderContent,
  leaveRequestedContent,
  payslipIssuedContent,
} from '../src/notifications/notification-content.js';
import { NotificationType } from '../src/notifications/notification.types.js';

const PERIOD = '01 Dec 2026 - 02 Dec 2026';

describe('formatLeavePeriod', () => {
  it('formats both ends in Cairo dates', () => {
    expect(
      formatLeavePeriod(new Date('2026-12-01'), new Date('2026-12-02')),
    ).toBe(PERIOD);
  });
});

describe('notification content', () => {
  it('describes a new leave request for the admins', () => {
    expect(
      leaveRequestedContent({
        employeeName: 'Sara Ali',
        leaveType: 'ANNUAL',
        period: PERIOD,
      }),
    ).toEqual({
      type: NotificationType.LEAVE_REQUESTED,
      title: 'New leave request',
      message: `Sara Ali requested annual leave (${PERIOD}).`,
      link: '/leave',
    });
  });

  it('describes every leave decision for the employee', () => {
    const decide = (status: LeaveStatus) =>
      leaveDecisionContent({ status, leaveType: 'CASUAL', period: PERIOD });

    expect(decide(LeaveStatus.APPROVED)).toMatchObject({
      type: NotificationType.LEAVE_DECIDED,
      title: 'Leave approved',
      message: `Your casual leave (${PERIOD}) was approved.`,
    });
    expect(decide(LeaveStatus.REJECTED)).toMatchObject({
      title: 'Leave rejected',
      message: `Your casual leave (${PERIOD}) was rejected.`,
    });
    expect(decide(LeaveStatus.PENDING)).toMatchObject({
      title: 'Leave reopened',
      message: `Your casual leave (${PERIOD}) is pending again.`,
    });
  });

  it('describes the payslip, the reminders and the automatic check-out', () => {
    expect(payslipIssuedContent('10/2026')).toEqual({
      type: NotificationType.PAYSLIP_ISSUED,
      title: 'New payslip',
      message: 'Your payslip for 10/2026 is ready.',
      link: '/payslips',
    });
    expect(leaveReminderContent('Sara Ali')).toMatchObject({
      type: NotificationType.LEAVE_REMINDER,
      message: "Sara Ali's request has been pending for 24 hours.",
    });
    expect(absenceReminderContent()).toMatchObject({
      type: NotificationType.ATTENDANCE_REMINDER,
      link: '/attendance',
    });
    expect(autoCheckOutContent()).toMatchObject({
      type: NotificationType.AUTO_CHECK_OUT,
      link: '/attendance',
    });
  });
});
