import { CalendarCheckIcon, FileTextIcon, UsersIcon, WalletIcon } from 'lucide-react';
import DepartmentBars from '@/components/ui/DepartmentBars';
import StatCard from '@/components/ui/StatCard';
import { COLORS } from '@/lib/chart-colors';
import { formatMoney } from '@/lib/format';
import type { AdminDashboardData } from '@/types';
import AttendanceTrend from './AttendanceTrend';
import DashboardSection from './DashboardSection';
import PendingApprovals from './PendingApprovals';
import WhosOut from './WhosOut';

export default function AdminDashboard({ data }: { data: AdminDashboardData }) {
  return (
    <div className="animate-fade-in space-y-6 sm:space-y-8">
      <div className="page-header mb-0">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Welcome back, Admin - here&apos;s your overview</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        <StatCard
          icon={UsersIcon}
          label="Total Employees"
          value={data.totalEmployees}
          hint={`${data.newHiresThisMonth} joined this month`}
          color={COLORS.indigo}
        />
        <StatCard
          icon={CalendarCheckIcon}
          label="Today's Attendance"
          value={data.todayAttendance}
          hint={`${data.attendanceRate}% attendance rate`}
          color={COLORS.emerald}
        />
        <StatCard
          icon={FileTextIcon}
          label="Pending Leaves"
          value={data.pendingLeaves}
          hint="Awaiting your approval"
          color={COLORS.amber}
        />
        <StatCard
          icon={WalletIcon}
          label="Monthly Payroll"
          value={formatMoney(data.monthlyPayroll)}
          hint="Net, active employees"
          color={COLORS.violet}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <PendingApprovals
          items={data.pendingRequests}
          total={data.pendingLeaves}
          className="lg:col-span-2"
        />
        <WhosOut items={data.whosOut} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DashboardSection
          id="attendance-trend"
          title="Attendance, last 7 days"
          description={`Late arrivals today: ${data.lateToday}`}
        >
          <AttendanceTrend days={data.attendanceTrend} />
        </DashboardSection>
        <DashboardSection
          id="headcount"
          title="Headcount by department"
          description={`${data.totalDepartments} departments in use`}
        >
          {data.departments.length === 0 ? (
            <p className="py-6 text-center text-slate-400">No employees yet</p>
          ) : (
            <DepartmentBars items={data.departments} />
          )}
        </DashboardSection>
      </div>
    </div>
  );
}