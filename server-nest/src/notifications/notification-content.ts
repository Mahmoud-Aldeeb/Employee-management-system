import { LeaveStatus } from '../common/enums/leave-status.enum.js';
import {
  NotificationType,
  type NotificationContent,
} from './notification.types.js';

interface LeaveSummary {
  leaveType: string;
  period: string;
}

const DECISIONS: Record<LeaveStatus, { title: string; outcome: string }> = {
  [LeaveStatus.APPROVED]: { title: 'Leave approved', outcome: 'was approved' },
  [LeaveStatus.REJECTED]: { title: 'Leave rejected', outcome: 'was rejected' },
  [LeaveStatus.PENDING]: {
    title: 'Leave reopened',
    outcome: 'is pending again',
  },
};

export function leaveRequestedContent({
  employeeName,
  leaveType,
  period,
}: LeaveSummary & { employeeName: string }): NotificationContent {
  return {
    type: NotificationType.LEAVE_REQUESTED,
    title: 'New leave request',
    message: `${employeeName} requested ${leaveType.toLowerCase()} leave (${period}).`,
    link: '/leave',
  };
}

export function leaveDecisionContent({
  status,
  leaveType,
  period,
}: LeaveSummary & { status: LeaveStatus }): NotificationContent {
  const { title, outcome } = DECISIONS[status];

  return {
    type: NotificationType.LEAVE_DECIDED,
    title,
    message: `Your ${leaveType.toLowerCase()} leave (${period}) ${outcome}.`,
    link: '/leave',
  };
}

export function leaveReminderContent(
  employeeName: string,
): NotificationContent {
  return {
    type: NotificationType.LEAVE_REMINDER,
    title: 'Leave request waiting',
    message: `${employeeName}'s request has been pending for 24 hours.`,
    link: '/leave',
  };
}

export function payslipIssuedContent(period: string): NotificationContent {
  return {
    type: NotificationType.PAYSLIP_ISSUED,
    title: 'New payslip',
    message: `Your payslip for ${period} is ready.`,
    link: '/payslips',
  };
}

export function absenceReminderContent(): NotificationContent {
  return {
    type: NotificationType.ATTENDANCE_REMINDER,
    title: 'Attendance reminder',
    message: 'You have not checked in yet today.',
    link: '/attendance',
  };
}

export function autoCheckOutContent(): NotificationContent {
  return {
    type: NotificationType.AUTO_CHECK_OUT,
    title: 'Automatic check-out',
    message:
      'You did not check out, so your day was closed automatically at 4 hours.',
    link: '/attendance',
  };
}
