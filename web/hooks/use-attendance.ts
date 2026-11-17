import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { AttendanceResponse } from "@/types";

export const ATTENDANCE_KEY = ["attendance"] as const;

export function useAttendance() {
  return useQuery({
    queryKey: ATTENDANCE_KEY,
    queryFn: async () => {
      const { data } = await api.get<AttendanceResponse>("/attendance");
      return data;
    },
  });
}

export function useClockInOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<{ type: "CHECK_IN" | "CHECK_OUT" }>(
        "/attendance",
      );
      return data;
    },
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ATTENDANCE_KEY }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      ]),
  });
}
