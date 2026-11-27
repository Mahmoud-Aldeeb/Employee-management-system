import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { invalidateAppData } from "@/lib/invalidate";
import type { Workplace } from "@/types";

export const WORKPLACES_KEY = ["workplaces"] as const;

export interface WorkplaceInput {
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
}

export type WorkplaceUpdate = Partial<WorkplaceInput> & { isActive?: boolean };

export function useWorkplaces() {
  return useQuery({
    queryKey: WORKPLACES_KEY,
    queryFn: async () => {
      const { data } = await api.get<Workplace[]>("/workplaces");
      return data;
    },
  });
}

export function useCreateWorkplace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: WorkplaceInput) => {
      const { data } = await api.post<Workplace>("/workplaces", input);
      return data;
    },
    onSuccess: () => invalidateAppData(queryClient),
  });
}

export function useUpdateWorkplace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: WorkplaceUpdate;
    }) => {
      await api.put(`/workplaces/${id}`, input);
    },
    onSuccess: () => invalidateAppData(queryClient),
  });
}

export function useDeleteWorkplace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/workplaces/${id}`);
    },
    onSuccess: () => invalidateAppData(queryClient),
  });
}
