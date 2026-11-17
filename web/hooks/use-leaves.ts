import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { LeaveStatus, LeaveType, LeavesResponse } from "@/types";

export const LEAVES_KEY = ["leaves"] as const;

export interface LeaveInput {
  type: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
}

export function useLeaves() {
  return useQuery({
    queryKey: LEAVES_KEY,
    queryFn: async () => {
      const { data } = await api.get<LeavesResponse>("/leave");
      return data;
    },
  });
}

function useInvalidateLeaves() {
  const queryClient = useQueryClient();

  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: LEAVES_KEY }),
      queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
    ]);
}

export function useCreateLeave() {
  const invalidate = useInvalidateLeaves();

  return useMutation({
    mutationFn: async (input: LeaveInput) => {
      await api.post("/leave", input);
    },
    onSuccess: invalidate,
  });
}

export function useUpdateLeaveStatus() {
  const invalidate = useInvalidateLeaves();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: LeaveStatus }) => {
      await api.patch(`/leave/${id}`, { status });
    },
    onSuccess: invalidate,
  });
}
