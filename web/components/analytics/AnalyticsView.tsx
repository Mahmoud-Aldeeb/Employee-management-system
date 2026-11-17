'use client';

import { CalendarCheckIcon, ClockIcon, TrendingUpIcon, UsersIcon } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Loading from '@/components/Loading';
import { useAnalytics } from '@/hooks/use-analytics';
import { COLORS } from '@/lib/chart-colors';
import { getErrorMessage } from '@/lib/errors';
import {
  AttendanceChart,
  LeaveStatusChart,
  LeaveTypeChart,
  WeeklyHoursChart,
} from './AnalyticsCharts';
import ChartCard from './ChartCard';
import DepartmentBars from './DepartmentBars';
import StatCard from './StatCard';

export default function AnalyticsView() {
  const { data, isPending, isError, error } = useAnalytics();

  useEffect(() => {
    if (isError) toast.error(getErrorMessage(error, 'Failed to load analytics'));
  }, [isError, error]);

  if (isPending) return <Loading fullScreen={false} />;

  if (!data) {
    return <p className="py-12 text-center text-slate-500">Failed to load analytics data</p>;
  }

  const {
    monthlyAttendance,
    leaveStats,
    weeklyHours,
    departmentAttendance,
    leaveTypeBreakdown,
    summary,
  } = data;

  const totalLeaves = leaveStats.APPROVED + leaveStats.REJECTED + leaveStats.PENDING;
  const averageHours =
    weeklyHours.length > 0
      ? (weeklyHours.reduce((sum, week) => sum + week.avgHours, 0) / weeklyHours.length).toFixed(1)
      : null;

  return (
    <div className="animate-fade-in space-y-6 sm:space-y-8">
      <div className="page-header mb-0">
        <h1 className="page-title">Analytics</h1>
        <p className="page-subtitle">Deep insights into workforce performance and attendance</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        <StatCard
          icon={UsersIcon}
          label="Active Employees"
          value={summary.totalActiveEmployees}
          hint="Non-deleted accounts"
          color={COLORS.indigo}
        />
        <StatCard
          icon={CalendarCheckIcon}
          label="Today's Attendance"
          value={summary.todayAttendanceCount}
          hint={`${summary.attendanceRate}% attendance rate`}
          color={COLORS.emerald}
        />
        <StatCard
          icon={ClockIcon}
          label="Avg Weekly Hours"
          value={averageHours ? `${averageHours}h` : 'N/A'}
          hint="Last 30 days"
          color={COLORS.violet}
        />
        <StatCard
          icon={TrendingUpIcon}
          label="Total Leave Apps"
          value={totalLeaves}
          hint={`${leaveStats.APPROVED} approved`}
          color={COLORS.amber}
        />
      </div>

      <ChartCard
        title="Daily Attendance — Last 30 Days"
        description="Check-ins per day including late arrivals"
        empty={monthlyAttendance.length === 0}
      >
        <AttendanceChart data={monthlyAttendance} />
      </ChartCard>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard
          title="Leave Applications Breakdown"
          description="Approved vs Rejected vs Pending"
          empty={totalLeaves === 0}
          emptyText="No leave data yet"
        >
          <LeaveStatusChart stats={leaveStats} />
        </ChartCard>

        <ChartCard
          title="Average Weekly Working Hours"
          description="Average hours per employee per week"
          empty={weeklyHours.length === 0}
        >
          <WeeklyHoursChart data={weeklyHours} />
        </ChartCard>
      </div>

      <ChartCard
        title="Top Departments by Attendance — This Month"
        description="Which departments are showing up consistently"
        empty={departmentAttendance.length === 0}
      >
        <DepartmentBars items={departmentAttendance} />
      </ChartCard>

      <ChartCard
        title="Leave Types Distribution"
        description="Sick, Casual, and Annual leave counts"
        empty={leaveTypeBreakdown.length === 0}
        emptyText="No leave data yet"
      >
        <LeaveTypeChart data={leaveTypeBreakdown} />
      </ChartCard>
    </div>
  );
}