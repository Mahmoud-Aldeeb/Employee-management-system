import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { SalarySummary } from "@/types";

export function useMySalary(enabled = true) {
  return useQuery({
    queryKey: ["salary", "me"],
    queryFn: async () => {
      const { data } = await api.get<SalarySummary>("/profile/salary");
      return data;
    },
    enabled,
  });
}
