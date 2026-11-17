'use client';

import { format, parseISO } from 'date-fns';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { COLORS, LEAVE_STATUS_COLORS, LEAVE_TYPE_COLORS } from '@/lib/chart-colors';
import type { AnalyticsData } from '@/types';

const tick = { fontSize: 11, fill: '#94a3b8' };
const legendStyle = { fontSize: 12, color: '#64748b' };
const tooltipStyle = {
  contentStyle: {
    borderRadius: 12,
    border: '1px solid #e2e8f0',
    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
    fontSize: 13,
  },
  labelStyle: { fontWeight: 600, color: '#334155' },
};

export function AttendanceChart({ data }: { data: AnalyticsData['monthlyAttendance'] }) {
  const chartData = data.map((row) => ({
    ...row,
    displayDate: format(parseISO(row.date), 'MMM d'),
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={COLORS.indigo} stopOpacity={0.15} />
            <stop offset="95%" stopColor={COLORS.indigo} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="lateGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={COLORS.amber} stopOpacity={0.15} />
            <stop offset="95%" stopColor={COLORS.amber} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis
          dataKey="displayDate"
          tick={tick}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
          minTickGap={24}
        />
        <YAxis tick={tick} axisLine={false} tickLine={false} width={32} allowDecimals={false} />
        <Tooltip {...tooltipStyle} />
        <Legend wrapperStyle={legendStyle} />
        <Area
          type="monotone"
          dataKey="count"
          name="Present"
          stroke={COLORS.indigo}
          strokeWidth={2}
          fill="url(#attendanceGradient)"
          dot={false}
          activeDot={{ r: 5, fill: COLORS.indigo }}
        />
        <Area
          type="monotone"
          dataKey="lateCount"
          name="Late Arrivals"
          stroke={COLORS.amber}
          strokeWidth={2}
          fill="url(#lateGradient)"
          dot={false}
          activeDot={{ r: 5, fill: COLORS.amber }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function LeaveStatusChart({ stats }: { stats: AnalyticsData['leaveStats'] }) {
  const data = [
    { name: 'Approved', value: stats.APPROVED, fill: LEAVE_STATUS_COLORS.APPROVED },
    { name: 'Rejected', value: stats.REJECTED, fill: LEAVE_STATUS_COLORS.REJECTED },
    { name: 'Pending', value: stats.PENDING, fill: LEAVE_STATUS_COLORS.PENDING },
  ].filter((entry) => entry.value > 0);

  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="45%"
          innerRadius="55%"
          outerRadius="80%"
          paddingAngle={4}
        />
        <Tooltip {...tooltipStyle} />
        <Legend wrapperStyle={legendStyle} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function WeeklyHoursChart({ data }: { data: AnalyticsData['weeklyHours'] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} barSize={32} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey="week" tick={tick} axisLine={false} tickLine={false} />
        <YAxis tick={tick} axisLine={false} tickLine={false} width={32} domain={[0, 'auto']} />
        <Tooltip {...tooltipStyle} cursor={{ fill: '#f8fafc' }} />
        <Bar dataKey="avgHours" name="Avg Hours" fill={COLORS.violet} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function LeaveTypeChart({ data }: { data: AnalyticsData['leaveTypeBreakdown'] }) {
  const chartData = data.map((entry) => ({
    ...entry,
    fill: LEAVE_TYPE_COLORS[entry.type] ?? COLORS.indigo,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} barSize={48} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey="type" tick={tick} axisLine={false} tickLine={false} />
        <YAxis tick={tick} axisLine={false} tickLine={false} width={32} allowDecimals={false} />
        <Tooltip {...tooltipStyle} cursor={{ fill: '#f8fafc' }} />
        <Bar dataKey="count" name="Applications" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}