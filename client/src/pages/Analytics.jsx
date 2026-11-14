import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format, parseISO } from "date-fns";
import {
  TrendingUpIcon,
  UsersIcon,
  ClockIcon,
  CalendarCheckIcon,
} from "lucide-react";
import api from "../api/axios";
import useFetch from "../hooks/useFetch";
import usePageTitle from "../hooks/usePageTitle";
import Loading from "../components/Loading";

// ─── Color palette ────────────────────────────────────────────────────────────
const COLORS = {
  indigo: "#6366f1",
  emerald: "#10b981",
  amber: "#f59e0b",
  rose: "#f43f5e",
  violet: "#8b5cf6",
  sky: "#0ea5e9",
};

const PIE_COLORS = [COLORS.emerald, COLORS.rose, COLORS.amber];
const DEPT_COLORS = [
  COLORS.indigo,
  COLORS.emerald,
  COLORS.violet,
  COLORS.sky,
  COLORS.amber,
  COLORS.rose,
];

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-sm">
        <p className="font-semibold text-slate-700 mb-1">{label}</p>
        {payload.map((p) => (
          <p key={p.dataKey} style={{ color: p.color }}>
            {p.name}: <span className="font-semibold">{p.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// ─── Stat card ────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, sub, color }) => (
  <div className="card card-hover p-5 flex items-center gap-4 relative overflow-hidden group">
    <div className="absolute left-0 top-0 bottom-0 w-1 rounded-r-full bg-slate-200 group-hover:bg-indigo-500/70 transition-colors" />
    <div
      className="p-3 rounded-xl"
      style={{ backgroundColor: `${color}18` }}
    >
      <Icon className="w-5 h-5" style={{ color }} />
    </div>
    <div>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-2xl font-bold text-slate-900 tracking-tight">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

// ─── Analytics Page ────────────────────────────────────────────────────────────
const Analytics = () => {
  usePageTitle("Analytics");

  const { data: payload, loading } = useFetch(
    () => api.get("/analytics"),
    []
  );

  if (loading) return <Loading />;
  if (!payload?.data) {
    return (
      <p className="text-center text-slate-500 py-12">
        Failed to load analytics data
      </p>
    );
  }

  const {
    monthlyAttendance,
    leaveStats,
    weeklyHours,
    departmentAttendance,
    leaveTypeBreakdown,
    summary,
  } = payload.data;

  // Format leave pie chart data
  const leavePieData = [
    { name: "Approved", value: leaveStats.APPROVED },
    { name: "Rejected", value: leaveStats.REJECTED },
    { name: "Pending", value: leaveStats.PENDING },
  ].filter((d) => d.value > 0);

  // Format attendance line chart dates
  const attendanceChartData = monthlyAttendance.map((d) => ({
    ...d,
    displayDate: format(parseISO(d.date), "MMM d"),
  }));

  const avgWeeklyHours =
    weeklyHours.length > 0
      ? (
          weeklyHours.reduce((sum, w) => sum + w.avgHours, 0) /
          weeklyHours.length
        ).toFixed(1)
      : "N/A";

  return (
    <div className="animate-fade-in space-y-8">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="page-header">
        <h1 className="page-title">Analytics</h1>
        <p className="page-subtitle">
          Deep insights into workforce performance and attendance
        </p>
      </div>

      {/* ── Summary Cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={UsersIcon}
          label="Active Employees"
          value={summary.totalActiveEmployees}
          sub="Non-deleted accounts"
          color={COLORS.indigo}
        />
        <StatCard
          icon={CalendarCheckIcon}
          label="Today's Attendance"
          value={summary.todayAttendanceCount}
          sub={`${summary.attendanceRate}% attendance rate`}
          color={COLORS.emerald}
        />
        <StatCard
          icon={ClockIcon}
          label="Avg Weekly Hours"
          value={`${avgWeeklyHours}h`}
          sub="Past 4 weeks"
          color={COLORS.violet}
        />
        <StatCard
          icon={TrendingUpIcon}
          label="Total Leave Apps"
          value={
            leaveStats.APPROVED + leaveStats.REJECTED + leaveStats.PENDING
          }
          sub={`${leaveStats.APPROVED} approved`}
          color={COLORS.amber}
        />
      </div>

      {/* ── Row 1: Attendance Area Chart ───────────────────────────────────── */}
      <div className="card p-6">
        <h2 className="text-base font-semibold text-slate-900 mb-1">
          Daily Attendance — Last 30 Days
        </h2>
        <p className="text-sm text-slate-400 mb-6">
          Check-ins per day including late arrivals
        </p>
        {attendanceChartData.length === 0 ? (
          <p className="text-center text-slate-400 py-8">No data yet</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={attendanceChartData}>
              <defs>
                <linearGradient id="attendanceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.indigo} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={COLORS.indigo} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="lateGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.amber} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={COLORS.amber} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="displayDate"
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 12, color: "#64748b" }}
              />
              <Area
                type="monotone"
                dataKey="count"
                name="Present"
                stroke={COLORS.indigo}
                strokeWidth={2}
                fill="url(#attendanceGrad)"
                dot={false}
                activeDot={{ r: 5, fill: COLORS.indigo }}
              />
              <Area
                type="monotone"
                dataKey="lateCount"
                name="Late Arrivals"
                stroke={COLORS.amber}
                strokeWidth={2}
                fill="url(#lateGrad)"
                dot={false}
                activeDot={{ r: 5, fill: COLORS.amber }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Row 2: Leave Pie + Weekly Hours Bar ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leave Status Pie */}
        <div className="card p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-1">
            Leave Applications Breakdown
          </h2>
          <p className="text-sm text-slate-400 mb-6">
            Approved vs Rejected vs Pending
          </p>
          {leavePieData.length === 0 ? (
            <p className="text-center text-slate-400 py-8">No leave data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={leavePieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {leavePieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [`${value} applications`, name]}
                />
                <Legend wrapperStyle={{ fontSize: 12, color: "#64748b" }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Average Weekly Working Hours */}
        <div className="card p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-1">
            Average Weekly Working Hours
          </h2>
          <p className="text-sm text-slate-400 mb-6">
            Average hours per employee per week
          </p>
          {weeklyHours.length === 0 ? (
            <p className="text-center text-slate-400 py-8">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={weeklyHours} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 12]}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="avgHours"
                  name="Avg Hours"
                  fill={COLORS.violet}
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Row 3: Top Departments Horizontal Bar ──────────────────────────── */}
      <div className="card p-6">
        <h2 className="text-base font-semibold text-slate-900 mb-1">
          Top Departments by Attendance — This Month
        </h2>
        <p className="text-sm text-slate-400 mb-6">
          Which departments are showing up consistently
        </p>
        {departmentAttendance.length === 0 ? (
          <p className="text-center text-slate-400 py-8">No data yet</p>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(departmentAttendance.length * 52, 200)}>
            <BarChart
              data={departmentAttendance}
              layout="vertical"
              barSize={28}
              margin={{ left: 16 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="department"
                width={130}
                tick={{ fontSize: 11, fill: "#64748b" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Check-ins" radius={[0, 6, 6, 0]}>
                {departmentAttendance.map((_, index) => (
                  <Cell
                    key={`dept-${index}`}
                    fill={DEPT_COLORS[index % DEPT_COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Row 4: Leave Type Bar ───────────────────────────────────────────── */}
      <div className="card p-6">
        <h2 className="text-base font-semibold text-slate-900 mb-1">
          Leave Types Distribution
        </h2>
        <p className="text-sm text-slate-400 mb-6">
          Sick, Casual, and Annual leave counts
        </p>
        {leaveTypeBreakdown.length === 0 ? (
          <p className="text-center text-slate-400 py-8">No leave data yet</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={leaveTypeBreakdown} barSize={48}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="type"
                tick={{ fontSize: 12, fill: "#64748b" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Applications" radius={[8, 8, 0, 0]}>
                <Cell fill={COLORS.rose} />
                <Cell fill={COLORS.sky} />
                <Cell fill={COLORS.emerald} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default Analytics;
