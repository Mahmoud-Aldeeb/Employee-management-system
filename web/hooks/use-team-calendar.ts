import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { TeamCalendar } from "@/types";

export function useTeamCalendar(month: string | undefined, department: string) {
  return useQuery({
    queryKey: ["leave", "calendar", { month: month ?? "current", department }],
    queryFn: async () => {
      const { data } = await api.get<TeamCalendar>("/leave/calendar", {
        params: {
          month: month || undefined,
          department: department || undefined,
        },
      });
      return data;
    },
    placeholderData: keepPreviousData,
  });
}
