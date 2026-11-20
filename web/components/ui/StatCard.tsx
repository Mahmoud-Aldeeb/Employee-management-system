import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  hint?: string;
  color: string;
}

export default function StatCard({ icon: Icon, label, value, hint, color }: StatCardProps) {
  return (
    <div className="card card-hover group relative flex items-center gap-4 overflow-hidden p-4 sm:p-5">
      <div className="absolute bottom-0 left-0 top-0 w-1 rounded-r-full bg-slate-200 transition-colors group-hover:bg-indigo-500/70" />
      <div className="rounded-xl p-3" style={{ backgroundColor: `${color}18` }}>
        <Icon className="size-5" style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-2xl font-bold tracking-tight text-slate-900">{value}</p>
        {hint && <p className="mt-0.5 text-xs text-slate-400">{hint}</p>}
      </div>
    </div>
  );
}