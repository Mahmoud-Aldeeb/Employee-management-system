import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  noun: string;
  onChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, total, noun, onChange }: PaginationProps) {
  if (total === 0) return null;

  return (
    <nav
      aria-label="Pagination"
      className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-sm text-slate-500">{`${total} ${total === 1 ? noun : `${noun}s`}`}</p>
      {totalPages > 1 && (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onChange(page - 1)}
            disabled={page <= 1}
            className="btn-secondary flex items-center gap-1 disabled:opacity-50"
          >
            <ChevronLeftIcon className="size-4" /> Previous
          </button>
          <span className="text-sm text-slate-600">{`Page ${page} of ${totalPages}`}</span>
          <button
            type="button"
            onClick={() => onChange(page + 1)}
            disabled={page >= totalPages}
            className="btn-secondary flex items-center gap-1 disabled:opacity-50"
          >
            Next <ChevronRightIcon className="size-4" />
          </button>
        </div>
      )}
    </nav>
  );
}