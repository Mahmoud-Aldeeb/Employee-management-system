import { useEffect, useState } from "react";
import Loading from "../components/Loading";
import CheckInButton from "../components/attendance/CheckInButton";
import AttendanceStats from "../components/attendance/AttendanceStats";
import AttendanceHistory from "../components/attendance/AttendanceHistory";
import AttendanceCalendar from "../components/attendance/AttendanceCalendar";
import { Download, Calendar as CalendarIcon, List as ListIcon } from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../api/axios";
import useFetch from "../hooks/useFetch";
import usePageTitle from "../hooks/usePageTitle";
import { exportToCSV } from "../utils/export";

const Attendance = () => {
  usePageTitle("Attendance");
  const [viewMode, setViewMode] = useState("table"); // 'table' | 'calendar'

  // useFetch handles retrieving attendance record history and employee details
  const {
    data: payload,
    loading,
    error,
    refetch,
  } = useFetch(() => api.get("/attendance"), []);

  const history = payload?.data || [];
  const isDeleted = payload?.employee?.isDeleted || false;

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  if (loading) return <Loading />;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayRecord = history.find(
    (r) => new Date(r.date).toDateString() === today.toDateString()
  );

  const handleExport = () => {
    exportToCSV(history, "attendance_history", [
      { label: "Date", key: "date" },
      { label: "Status", key: "status" },
      { label: "Check In", key: "checkIn" },
      { label: "Check Out", key: "checkOut" },
      { label: "Working Hours", key: "workingHours" },
      { label: "Day Type", key: "dayType" },
    ]);
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="page-title">Attendance</h1>
          <p className="page-subtitle">
            Track your work hours and daily check-ins
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className="btn-secondary flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
                viewMode === "table"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <ListIcon className="w-3.5 h-3.5" /> Table
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
                viewMode === "calendar"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" /> Calendar
            </button>
          </div>
        </div>
      </div>

      {isDeleted ? (
        <div className="mb-8 p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center">
          <p className="text-rose-600">
            You can no longer clock in or out because your employee records have
            been marked as deleted.
          </p>
        </div>
      ) : (
        <div className="mb-8">
          <CheckInButton todayRecord={todayRecord} onAction={refetch} />
        </div>
      )}

      <AttendanceStats history={history} />

      {viewMode === "calendar" ? (
        <AttendanceCalendar history={history} />
      ) : (
        <AttendanceHistory history={history} />
      )}
    </div>
  );
};

export default Attendance;
