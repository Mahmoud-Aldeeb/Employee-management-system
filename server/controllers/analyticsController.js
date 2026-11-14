import Attendance from "../models/Attendance.js";
import Employee from "../models/Employee.js";
import LeaveApplication from "../models/LeaveApplication.js";
import { DEPARTMENTS } from "../constants/departments.js";

// GET /api/analytics
// Admin-only: returns comprehensive analytics data for charts
export const getAnalytics = async (req, res) => {
  try {
    const now = new Date();
    const year = parseInt(req.query.year) || now.getFullYear();
    const month = parseInt(req.query.month) || now.getMonth() + 1;

    // ─── 1. Monthly attendance chart — last 30 days ───────────────────────────
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const monthlyAttendance = await Attendance.aggregate([
      {
        $match: {
          date: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$date" },
          },
          count: { $sum: 1 },
          avgWorkingHours: { $avg: "$workingHours" },
          lateCount: {
            $sum: { $cond: [{ $eq: ["$status", "LATE"] }, 1, 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // ─── 2. Leave status breakdown (pie chart) ────────────────────────────────
    const leaveBreakdown = await LeaveApplication.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const leaveStats = { PENDING: 0, APPROVED: 0, REJECTED: 0 };
    leaveBreakdown.forEach((item) => {
      if (leaveStats.hasOwnProperty(item._id)) {
        leaveStats[item._id] = item.count;
      }
    });

    // ─── 3. Average weekly working hours ──────────────────────────────────────
    const weeklyHours = await Attendance.aggregate([
      {
        $match: {
          workingHours: { $gt: 0 },
          date: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: { $isoWeek: "$date" },
          year: { $first: { $isoWeekYear: "$date" } },
          avgHours: { $avg: "$workingHours" },
          totalDays: { $sum: 1 },
        },
      },
      { $sort: { year: 1, _id: 1 } },
      { $limit: 8 },
    ]);

    // ─── 4. Top departments by attendance this month ──────────────────────────
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const departmentAttendance = await Attendance.aggregate([
      {
        $match: {
          date: { $gte: startOfMonth },
        },
      },
      {
        $lookup: {
          from: "employees",
          localField: "employeeId",
          foreignField: "_id",
          as: "employee",
        },
      },
      { $unwind: "$employee" },
      {
        $group: {
          _id: "$employee.department",
          attendanceCount: { $sum: 1 },
        },
      },
      { $sort: { attendanceCount: -1 } },
      { $limit: 10 },
    ]);

    // ─── 5. Leave type breakdown ───────────────────────────────────────────────
    const leaveTypeBreakdown = await LeaveApplication.aggregate([
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
        },
      },
    ]);

    // ─── 6. Overall summary numbers ───────────────────────────────────────────
    const totalActive = await Employee.countDocuments({ isDeleted: false });
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayAttendance = await Attendance.countDocuments({
      date: { $gte: todayStart },
    });
    const attendanceRate =
      totalActive > 0
        ? Math.round((todayAttendance / totalActive) * 100)
        : 0;

    return res.json({
      success: true,
      data: {
        monthlyAttendance: monthlyAttendance.map((d) => ({
          date: d._id,
          count: d.count,
          avgWorkingHours: d.avgWorkingHours
            ? parseFloat(d.avgWorkingHours.toFixed(1))
            : 0,
          lateCount: d.lateCount,
        })),
        leaveStats,
        weeklyHours: weeklyHours.map((w) => ({
          week: `Wk ${w._id}`,
          avgHours: parseFloat((w.avgHours || 0).toFixed(1)),
          days: w.totalDays,
        })),
        departmentAttendance: departmentAttendance.map((d) => ({
          department: d._id || "Unknown",
          count: d.attendanceCount,
        })),
        leaveTypeBreakdown: leaveTypeBreakdown.map((d) => ({
          type: d._id,
          count: d.count,
        })),
        summary: {
          totalActiveEmployees: totalActive,
          todayAttendanceCount: todayAttendance,
          attendanceRate,
        },
      },
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return res.status(500).json({ error: "Failed to fetch analytics data" });
  }
};
