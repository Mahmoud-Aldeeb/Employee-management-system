import { AlertCircleIcon, CalendarCheckIcon, FileTextIcon } from 'lucide-react';
import Link from 'next/link';
import CheckInCard from '@/components/attendance/CheckInCard';
import SalaryBreakdown from '@/components/salary/SalaryBreakdown';
import StatCard from '@/components/ui/StatCard';
import { COLORS } from '@/lib/chart-colors';
import type { EmployeeDashboardData } from '@/types';
import LatestPayslipCard from './LatestPayslipCard';
import LeaveSummary from './LeaveSummary';

export default function EmployeeDashboard({ data }: { data: EmployeeDashboardData }) {
  const { employee } = data;

  return (
    <div className="animate-fade-in space-y-6 sm:space-y-8">
      <div className="page-header mb-0">
        <h1 className="page-title">Welcome, {employee.firstName}!</h1>
        <p className="page-subtitle">
          {employee.position} - {employee.department || 'No Department'}
        </p>
      </div>

      {employee.isDeleted ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-600">
          Your account has been deactivated. Attendance is disabled.
        </div>
      ) : (
        <CheckInCard todayRecord={data.todayRecord ?? undefined} />
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <StatCard
          icon={CalendarCheckIcon}
          label="Days Present"
          value={data.currentMonthAttendance}
          hint="This month"
          color={COLORS.indigo}
        />
        <StatCard
          icon={AlertCircleIcon}
          label="Late Arrivals"
          value={data.lateThisMonth}
          hint="This month"
          color={COLORS.amber}
        />
        <StatCard
          icon={FileTextIcon}
          label="Pending Leaves"
          value={data.pendingLeaves}
          hint="Awaiting approval"
          color={COLORS.emerald}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        <SalaryBreakdown salary={data.salary} />
        <LeaveSummary daysTaken={data.leaveDaysThisYear} upcoming={data.upcomingLeave} />
        <LatestPayslipCard payslip={data.latestPayslip} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href="/leave" className="btn-primary text-center">
          Apply for Leave
        </Link>
        <Link href="/payslips" className="btn-secondary text-center">
          View Payslips
        </Link>
      </div>
    </div>
  );
}