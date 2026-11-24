import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { AuditAction, AuditLogPage } from "@/types";

export const AUDIT_LOGS_KEY = ["audit-logs"] as const;
export const AUDIT_PAGE_SIZE = 20;

export interface AuditFilterValues {
  action: AuditAction | "";
  search: string;
  from: string;
  to: string;
}

export interface AuditLogQuery extends AuditFilterValues {
  page: number;
}

export const EMPTY_AUDIT_FILTERS: AuditFilterValues = {
  action: "",
  search: "",
  from: "",
  to: "",
};

function toParams({ action, search, from, to, page }: AuditLogQuery) {
  const term = search.trim();

  return {
    page,
    limit: AUDIT_PAGE_SIZE,
    ...(action ? { action } : {}),
    ...(term ? { search: term } : {}),
    ...(from ? { from } : {}),
    ...(to ? { to } : {}),
  };
}

export function useAuditLogs(query: AuditLogQuery) {
  return useQuery({
    queryKey: [...AUDIT_LOGS_KEY, query],
    queryFn: async () => {
      const { data } = await api.get<AuditLogPage>("/audit-logs", {
        params: toParams(query),
      });
      return data;
    },
    placeholderData: keepPreviousData,
  });
}
