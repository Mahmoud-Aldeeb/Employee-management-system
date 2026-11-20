import { DEPARTMENT_COLORS } from '@/lib/chart-colors';

interface DepartmentBarsProps {
  items: { department: string; count: number }[];
}

export default function DepartmentBars({ items }: DepartmentBarsProps) {
  const max = Math.max(...items.map((item) => item.count), 1);

  return (
    <ul className="space-y-4">
      {items.map((item, index) => (
        <li key={item.department}>
          <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate text-slate-600">{item.department}</span>
            <span className="shrink-0 font-semibold text-slate-900">{item.count}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div
              role="progressbar"
              aria-label={item.department}
              aria-valuenow={item.count}
              aria-valuemin={0}
              aria-valuemax={max}
              className="h-full rounded-full"
              style={{
                width: `${(item.count / max) * 100}%`,
                backgroundColor: DEPARTMENT_COLORS[index % DEPARTMENT_COLORS.length],
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}