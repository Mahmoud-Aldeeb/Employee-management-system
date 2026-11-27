import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { DeviceLocation } from "@/lib/geolocation";
import type { AttendancePolicy, AttendanceResponse } from "@/types";
import { invalidateAppData } from "@/lib/invalidate";

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

export function useAttendancePolicy() {
  return useQuery({
    queryKey: [...ATTENDANCE_KEY, "policy"],
    queryFn: async () => {
      const { data } = await api.get<AttendancePolicy>("/attendance/policy");
      return data;
    },
    staleTime: 60_000,
  });
}

export function useClockInOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (location?: DeviceLocation) => {
      const { data } = await api.post<{ type: "CHECK_IN" | "CHECK_OUT" }>(
        "/attendance",
        location ? { location } : {},
      );
      return data;
    },
    onSuccess: () => invalidateAppData(queryClient),
  });
}
