import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  LeaveBalance,
  LeaveStatus,
  LeaveType,
  LeavesResponse,
} from "@/types";
import { invalidateAppData } from "@/lib/invalidate";

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

export function useCreateLeave() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: LeaveInput) => {
      await api.post("/leave", input);
    },
    onSuccess: () => invalidateAppData(queryClient),
  });
}

export function useUpdateLeaveStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: LeaveStatus }) => {
      await api.patch(`/leave/${id}`, { status });
    },
    onSuccess: () => invalidateAppData(queryClient),
  });
}

export function useLeaveBalance(enabled = true) {
  return useQuery({
    queryKey: ["leave", "balance"],
    queryFn: async () => {
      const { data } = await api.get<LeaveBalance>("/leave/balance");
      return data;
    },
    enabled,
  });
}
