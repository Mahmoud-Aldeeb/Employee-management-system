import {
  AlarmClockIcon,
  CalendarCheckIcon,
  CalendarPlusIcon,
  ClockIcon,
  DollarSignIcon,
  LogOutIcon,
  type LucideIcon,
} from "lucide-react";
import type { NotificationType } from "@/types";

interface NotificationPresentation {
  icon: LucideIcon;
  tone: string;
}

export const NOTIFICATION_PRESENTATION: Record<
  NotificationType,
  NotificationPresentation
> = {
  LEAVE_REQUESTED: {
    icon: CalendarPlusIcon,
    tone: "bg-indigo-50 text-indigo-600",
  },
  LEAVE_DECIDED: {
    icon: CalendarCheckIcon,
    tone: "bg-emerald-50 text-emerald-600",
  },
  LEAVE_REMINDER: { icon: AlarmClockIcon, tone: "bg-amber-50 text-amber-600" },
  PAYSLIP_ISSUED: { icon: DollarSignIcon, tone: "bg-sky-50 text-sky-600" },
  ATTENDANCE_REMINDER: { icon: ClockIcon, tone: "bg-amber-50 text-amber-600" },
  AUTO_CHECK_OUT: { icon: LogOutIcon, tone: "bg-slate-100 text-slate-600" },
};

export function formatBadgeCount(count: number) {
  return count > 99 ? "99+" : String(count);
}

export function isInternalLink(link: string) {
  return link.startsWith("/") && !link.startsWith("//");
}
