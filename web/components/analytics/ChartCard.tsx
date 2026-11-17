import type { ReactNode } from 'react';

interface ChartCardProps {
  title: string;
  description: string;
  empty: boolean;
  emptyText?: string;
  children: ReactNode;
}

export default function ChartCard({
  title,
  description,
  empty,
  emptyText = 'No data yet',
  children,
}: ChartCardProps) {
  return (
    <section className="card p-4 sm:p-6">
      <h2 className="mb-1 text-base font-semibold text-slate-900">{title}</h2>
      <p className="mb-5 text-sm text-slate-400 sm:mb-6">{description}</p>
      {empty ? <p className="py-8 text-center text-slate-400">{emptyText}</p> : children}
    </section>
  );
}