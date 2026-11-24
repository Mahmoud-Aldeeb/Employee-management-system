'use client';

import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import Loading from '@/components/Loading';
import Pagination from '@/components/ui/Pagination';
import {
  EMPTY_AUDIT_FILTERS,
  useAuditLogs,
  type AuditFilterValues,
} from '@/hooks/use-audit-logs';
import { useDebounce } from '@/hooks/use-debounce';
import { getErrorMessage } from '@/lib/errors';
import AuditLogFilters from './AuditLogFilters';
import AuditLogList from './AuditLogList';

export default function AuditLogView() {
  const [filters, setFilters] = useState<AuditFilterValues>(EMPTY_AUDIT_FILTERS);
  const [pageState, setPageState] = useState({ key: '', page: 1 });
  const search = useDebounce(filters.search);

  const appliedFilters = { ...filters, search };
  const filterKey = JSON.stringify(appliedFilters);
  const page = pageState.key === filterKey ? pageState.page : 1;

  const { data, isPending, isError, error, isPlaceholderData } = useAuditLogs({
    ...appliedFilters,
    page,
  });

  useEffect(() => {
    if (isError) toast.error(getErrorMessage(error, 'Failed to load the audit log'));
  }, [isError, error]);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Audit Log</h1>
        <p className="page-subtitle">Every administrative action, with the values before and after</p>
      </div>

      <AuditLogFilters values={filters} onChange={setFilters} />

      {isPending ? (
        <Loading fullScreen={false} />
      ) : !data ? (
        <p className="py-12 text-center text-slate-500">Failed to load the audit log</p>
      ) : (
        <>
          <AuditLogList entries={data.data} dimmed={isPlaceholderData} />
          <Pagination
            page={page}
            totalPages={data.totalPages}
            total={data.total}
            noun="event"
            onChange={(next) => setPageState({ key: filterKey, page: next })}
          />
        </>
      )}
    </div>
  );
}