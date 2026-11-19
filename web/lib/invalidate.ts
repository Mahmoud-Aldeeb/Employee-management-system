import type { QueryClient } from "@tanstack/react-query";
import { SESSION_KEY } from "@/hooks/use-auth";

export function invalidateAppData(queryClient: QueryClient) {
  return queryClient.invalidateQueries({
    predicate: (query) => query.queryKey[0] !== SESSION_KEY[0],
  });
}
