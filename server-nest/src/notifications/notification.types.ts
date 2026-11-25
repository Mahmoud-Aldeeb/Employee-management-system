export enum NotificationType {
  LEAVE_REQUESTED = 'LEAVE_REQUESTED',
  LEAVE_DECIDED = 'LEAVE_DECIDED',
  LEAVE_REMINDER = 'LEAVE_REMINDER',
  PAYSLIP_ISSUED = 'PAYSLIP_ISSUED',
  ATTENDANCE_REMINDER = 'ATTENDANCE_REMINDER',
  AUTO_CHECK_OUT = 'AUTO_CHECK_OUT',
}

export interface NotificationContent {
  type: NotificationType;
  title: string;
  message: string;
  link: string;
}

export interface NotificationView extends NotificationContent {
  id: string;
  readAt: Date | null;
  createdAt: Date;
}

export interface NotificationPage {
  data: NotificationView[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  unreadCount: number;
}
