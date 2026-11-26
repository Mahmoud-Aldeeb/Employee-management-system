import { useRouter } from "next/navigation";
import { useMarkNotificationRead } from "@/hooks/use-notifications";
import { isInternalLink } from "@/lib/notifications";
import type { NotificationEntry } from "@/types";

export function useOpenNotification(afterOpen?: () => void) {
  const router = useRouter();
  const markRead = useMarkNotificationRead();

  return (entry: NotificationEntry) => {
    if (entry.readAt === null) markRead.mutate(entry.id);
    afterOpen?.();
    if (isInternalLink(entry.link)) router.push(entry.link);
  };
}
