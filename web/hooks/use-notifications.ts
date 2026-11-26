import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { NotificationPage } from "@/types";

export const NOTIFICATIONS_KEY = ["notifications"] as const;
export const NOTIFICATION_PANEL_SIZE = 10;
export const NOTIFICATIONS_PAGE_SIZE = 20;

const POLL_INTERVAL_MS = 60_000;
const POLL_JITTER_MS = 10_000;

export interface NotificationQuery {
  page: number;
  limit: number;
  unreadOnly: boolean;
}

function nextPollDelay() {
  return POLL_INTERVAL_MS + Math.floor(Math.random() * POLL_JITTER_MS);
}

export function useUnreadCount() {
  return useQuery({
    queryKey: [...NOTIFICATIONS_KEY, "unread-count"],
    queryFn: async () => {
      const { data } = await api.get<{ count: number }>(
        "/notifications/unread-count",
      );
      return data.count;
    },
    staleTime: 30_000,
    retry: 1,
    refetchInterval: (query) =>
      query.state.status === "error" ? false : nextPollDelay(),
  });
}

export function useNotifications({
  page,
  limit,
  unreadOnly,
}: NotificationQuery) {
  return useQuery({
    queryKey: [...NOTIFICATIONS_KEY, "list", { page, limit, unreadOnly }],
    queryFn: async () => {
      const { data } = await api.get<NotificationPage>("/notifications", {
        params: { page, limit, ...(unreadOnly ? { unread: true } : {}) },
      });
      return data;
    },
    placeholderData: keepPreviousData,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/notifications/${id}/read`);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY }),
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await api.post("/notifications/read-all");
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY }),
  });
}
