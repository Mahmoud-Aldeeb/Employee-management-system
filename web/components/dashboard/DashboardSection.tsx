import type { ReactNode } from 'react';

interface DashboardSectionProps {
  id: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}

export default function DashboardSection({
  id,
  title,
  description,
  action,
  className = '',
  children,
}: DashboardSectionProps) {
  return (
    <section aria-labelledby={id} className={`card p-4 sm:p-6 ${className}`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 id={id} className="text-base font-semibold text-slate-900">
            {title}
          </h2>
          {description && <p className="mt-0.5 text-sm text-slate-400">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}