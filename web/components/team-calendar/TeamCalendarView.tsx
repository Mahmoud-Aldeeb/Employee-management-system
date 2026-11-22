'use client';

import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import Loading from '@/components/Loading';
import { useSession } from '@/hooks/use-auth';
import { useTeamCalendar } from '@/hooks/use-team-calendar';
import { DEPARTMENTS } from '@/lib/constants';
import { getErrorMessage } from '@/lib/errors';
import { monthTitle } from '@/lib/team-calendar';
import AgendaList from './AgendaList';
import DayDetails from './DayDetails';
import MonthGrid from './MonthGrid';

const navButton =
  'flex size-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50';

export default function TeamCalendarView() {
  const [month, setMonth] = useState<string | undefined>(undefined);
  const [department, setDepartment] = useState('');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const { data: session } = useSession();
  const { data, isPending, isError, error } = useTeamCalendar(month, department);
  const isAdmin = session?.role === 'ADMIN';

  useEffect(() => {
    if (isError) toast.error(getErrorMessage(error, 'Failed to load the team calendar'));
  }, [isError, error]);

  if (isPending) return <Loading fullScreen={false} />;

  if (!data) {
    return <p className="py-12 text-center text-slate-500">Failed to load the team calendar</p>;
  }

  const goTo = (target: string | undefined) => {
    setMonth(target);
    setSelectedDate(null);
  };

  const detailsDay =
    data.days.find((day) => day.date === selectedDate) ?? data.days.find((day) => day.isToday);
  const stats = [
    { label: 'Out today', value: data.summary.outToday },
    { label: 'Employees out this month', value: data.summary.employeesOut },
    { label: 'Pending requests', value: data.summary.pendingLeaves },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">Team Calendar</h1>
          <p className="page-subtitle">
            {isAdmin
              ? 'All approved and pending leave across the company'
              : 'Your leave and the approved leave of your department'}
          </p>
        </div>
        {isAdmin && (
          <select
            aria-label="Filter by department"
            value={department}
            onChange={(event) => {
              setDepartment(event.target.value);
              setSelectedDate(null);
            }}
            className="sm:w-56"
          >
            <option value="">All Departments</option>
            {DEPARTMENTS.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          aria-label="Previous month"
          onClick={() => goTo(data.previousMonth)}
          className={navButton}
        >
          <ChevronLeftIcon className="size-4" />
        </button>
        <h2 className="min-w-40 text-center text-lg font-semibold text-slate-900">
          {monthTitle(data.month)}
        </h2>
        <button
          type="button"
          aria-label="Next month"
          onClick={() => goTo(data.nextMonth)}
          className={navButton}
        >
          <ChevronRightIcon className="size-4" />
        </button>
        <button
          type="button"
          disabled={month === undefined}
          onClick={() => goTo(undefined)}
          className="btn-secondary h-10 py-0 disabled:opacity-50"
        >
          Today
        </button>
      </div>

      <dl aria-label="Summary" className="flex flex-wrap gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-slate-200 bg-white px-4 py-2">
            <dt className="text-xs text-slate-500">{stat.label}</dt>
            <dd className="text-lg font-semibold text-slate-900">{stat.value}</dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded bg-emerald-200" /> Approved
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded border border-dashed border-amber-400 bg-amber-100" />{' '}
          Pending
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded outline-2 outline-indigo-400" /> Your leave
        </span>
      </div>

      <section aria-label="Month view" className="card hidden p-4 md:block">
        <MonthGrid days={data.days} selectedDate={selectedDate} onSelect={setSelectedDate} />
      </section>

      <div className="hidden md:block">
        <DayDetails day={detailsDay} />
      </div>

      <section aria-label="Agenda" className="md:hidden">
        <AgendaList days={data.days} />
      </section>

      {!isAdmin && (
        <p className="text-xs text-slate-400">
          You see approved leave of your department without its type, plus your own requests.
        </p>
      )}
    </div>
  );
}