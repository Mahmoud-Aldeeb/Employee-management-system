import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { PortalRole, SessionUser } from "@/types";
import { storeSession } from "./use-auth";

export function useDemoStatus() {
  return useQuery({
    queryKey: ["demo", "status"],
    queryFn: async () => {
      const { data } = await api.get<{ enabled: boolean }>("/demo/status");
      return data.enabled;
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

export function useDemoLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (role: PortalRole) => {
      const { data } = await api.post<{ user: SessionUser }>("/demo/login", {
        role,
      });
      return data.user;
    },
    onSuccess: (user) => storeSession(queryClient, user),
  });
}
